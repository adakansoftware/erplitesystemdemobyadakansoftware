import { serve } from '@hono/node-server'
import type { IncomingMessage } from 'node:http'
import cron from 'node-cron'
import { eq, inArray } from 'drizzle-orm'
import { WebSocketServer, type WebSocket } from 'ws'
import { app } from './app'
import { db } from './db/client'
import { currentAccounts, invoices, users } from './db/schema'
import { verifyToken } from './lib/auth'
import { eventBus } from './lib/event-bus'
import { logger } from './lib/logger'
import { sendQueuedMail } from './lib/queue'
import { notifyUser, registerClient, unregisterClient } from './lib/ws'

const port = Number(process.env.PORT ?? 3001)

eventBus.on('invoice.created', ({ invoiceId, userId }) => {
  if (!userId) {
    return
  }

  notifyUser(userId, 'invoice.created', { invoiceId })
})

eventBus.on('invoice.paid', async ({ invoiceId, amount, userId }) => {
  if (userId) {
    notifyUser(userId, 'invoice.paid', { invoiceId, amount })
  }

  logger.info(`Invoice paid: ${invoiceId} (${amount})`)
})

eventBus.on('quotation.accepted', ({ quotationId, invoiceId, userId }) => {
  if (!userId) {
    return
  }

  notifyUser(userId, 'quotation.accepted', { quotationId, invoiceId })
})

eventBus.on('purchase.received', ({ purchaseId, userId }) => {
  if (!userId) {
    return
  }

  notifyUser(userId, 'purchase.received', { purchaseId })
})

eventBus.on('stock.low', async ({ productId, qty, threshold }) => {
  const admins = await db.select().from(users).where(eq(users.role, 'admin'))
  const html = `
    <p>Kritik stok bildirimi olustu.</p>
    <p>Urun: ${productId}</p>
    <p>Mevcut stok: ${qty}</p>
    <p>Esik deger: ${threshold}</p>
  `

  await Promise.all(
    admins
      .filter((admin) => admin.active)
      .map((admin) =>
        sendQueuedMail({
          to: admin.email,
          subject: `Kritik stok uyarisi - ${productId}`,
          html,
        }),
      ),
  )
})

cron.schedule('0 8 * * *', async () => {
  const today = new Date().toISOString().slice(0, 10)
  const overdueInvoices = await db
    .select()
    .from(invoices)
    .where(eq(invoices.status, 'overdue'))

  const pendingOverdue = overdueInvoices.filter((invoice) => invoice.dueDate < today)
  if (!pendingOverdue.length) {
    return
  }

  const admins = await db.select().from(users).where(eq(users.role, 'admin'))
  const accountIds = pendingOverdue
    .map((invoice) => invoice.currentAccountId)
    .filter((value): value is string => Boolean(value))
  const relatedAccounts = accountIds.length
    ? await db.select().from(currentAccounts).where(inArray(currentAccounts.id, accountIds))
    : []
  const accountMap = new Map(relatedAccounts.map((account) => [account.id, account]))

  const html = `
    <h2>ERP Lite Gecikmis Fatura Ozeti</h2>
    <ul>
      ${pendingOverdue
        .map((invoice) => {
          const account = invoice.currentAccountId
            ? accountMap.get(invoice.currentAccountId)
            : null
          return `<li>${invoice.id} - ${invoice.customer} - Vade: ${invoice.dueDate}${
            account?.email ? ` - ${account.email}` : ''
          }</li>`
        })
        .join('')}
    </ul>
  `

  await Promise.all(
    admins
      .filter((admin) => admin.active)
      .map((admin) =>
        sendQueuedMail({
          to: admin.email,
          subject: 'Gecikmis Fatura Ozeti',
          html,
        }),
      ),
  )
})

cron.schedule('0 * * * *', async () => {
  const today = new Date().toISOString().slice(0, 10)
  const overdueInvoices = await db
    .select()
    .from(invoices)
    .where(eq(invoices.status, 'sent'))

  await Promise.all(
    overdueInvoices
      .filter((invoice) => invoice.dueDate < today)
      .map((invoice) =>
        db
          .update(invoices)
          .set({ status: 'overdue', updatedAt: new Date() })
          .where(eq(invoices.id, invoice.id)),
      ),
  )
})

const server = serve({ fetch: app.fetch, port }, () => {
  logger.info(`ERP API -> http://localhost:${port}`)
})

const wss = new WebSocketServer({ noServer: true })

function readCookie(req: IncomingMessage, name: string) {
  const raw = req.headers.cookie
  if (!raw) {
    return undefined
  }

  return raw
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.slice(name.length + 1)
}

async function authorizeUpgrade(req: IncomingMessage) {
  const base = `http://${req.headers.host ?? 'localhost'}`
  const url = new URL(req.url ?? '/', base)
  const token =
    url.searchParams.get('token') ??
    readCookie(req, 'erp_token') ??
    req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return null
  }

  try {
    const payload = await verifyToken(token)
    return typeof payload.id === 'string' ? payload.id : null
  } catch {
    return null
  }
}

server.on('upgrade', async (req, socket, head) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
  if (url.pathname !== '/api/ws') {
    socket.destroy()
    return
  }

  const userId = await authorizeUpgrade(req)
  if (!userId) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
    socket.destroy()
    return
  }

  wss.handleUpgrade(req, socket, head, (ws: WebSocket) => {
    registerClient(userId, ws as unknown as WebSocket)
    ws.send(JSON.stringify({ event: 'ws.connected', data: { userId } }))

    ws.on('close', () => {
      unregisterClient(userId, ws as unknown as WebSocket)
    })
  })
})
