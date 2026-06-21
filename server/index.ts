import { serve } from '@hono/node-server'
import cron from 'node-cron'
import { eq, inArray } from 'drizzle-orm'
import { app } from './app'
import { db } from './db/client'
import { currentAccounts, invoices, users } from './db/schema'
import { sendMail } from './lib/mailer'

const port = Number(process.env.PORT ?? 3001)

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
      .map((admin) => sendMail(admin.email, 'Gecikmis Fatura Ozeti', html)),
  )
})

serve({ fetch: app.fetch, port }, () => {
  console.log(`ERP API -> http://localhost:${port}`)
})
