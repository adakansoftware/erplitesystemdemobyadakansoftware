import { serve } from '@hono/node-server'
import cron from 'node-cron'
import { eq, inArray } from 'drizzle-orm'
import { app } from './app'
import { db } from './db/client'
import { currentAccounts, invoices, users } from './db/schema'
import { eventBus } from './lib/event-bus'
import { logger } from './lib/logger'
import { sendQueuedMail } from './lib/queue'
import { notifyUser } from './lib/ws'

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

serve({ fetch: app.fetch, port }, () => {
  logger.info(`ERP API -> http://localhost:${port}`)
})
