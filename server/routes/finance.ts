import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client'
import { financeAccounts, transactions } from '../db/schema'
import { nextTransactionId } from '../lib/ids'
import { created, ok } from '../lib/http'
import { toNumber } from '../lib/serializers'
import { validate } from '../middleware/validate'

const financeAccountSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  type: z.enum(['cash', 'bank']),
  bankName: z.string().optional().nullable(),
  iban: z.string().optional().nullable(),
  currency: z.string().default('TRY'),
})

const transactionSchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  description: z.string().min(2),
  category: z.string().optional().nullable(),
  financeAccountId: z.string(),
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive(),
  currentAccountId: z.string().optional().nullable(),
})

export const financeRoutes = new Hono()

financeRoutes.get('/accounts', async (c) => {
  const accounts = await db.select().from(financeAccounts)
  const txs = await db.select().from(transactions)
  const result = accounts.map((account) => ({
    ...account,
    balance: txs
      .filter((tx) => tx.financeAccountId === account.id)
      .reduce(
        (sum, tx) => sum + (tx.type === 'income' ? toNumber(tx.amount) : -toNumber(tx.amount)),
        0,
      ),
  }))
  return ok(c, result)
})

financeRoutes.post('/accounts', validate(financeAccountSchema), async (c) => {
  const body = c.get('validatedBody') as z.infer<typeof financeAccountSchema>
  await db.insert(financeAccounts).values({
    id: body.id ?? `ACC-${Date.now()}`,
    name: body.name,
    type: body.type,
    bankName: body.bankName,
    iban: body.iban,
    currency: body.currency,
  })
  return created(c, body)
})

financeRoutes.get('/transactions', async (c) => {
  const accountId = c.req.query('accountId')
  const type = c.req.query('type')
  const filters = [
    accountId ? eq(transactions.financeAccountId, accountId) : undefined,
    type ? eq(transactions.type, type) : undefined,
  ].filter(Boolean)

  const [txs, accounts] = await Promise.all([
    db.select().from(transactions).where(filters.length ? and(...filters) : undefined),
    db.select().from(financeAccounts),
  ])
  const accountMap = new Map(accounts.map((account) => [account.id, account.name]))

  return ok(
    c,
    txs.map((item) => ({
      ...item,
      amount: Number(item.amount),
      account: accountMap.get(item.financeAccountId) ?? item.financeAccountId,
    })),
  )
})

financeRoutes.post('/transactions', validate(transactionSchema), async (c) => {
  const body = c.get('validatedBody') as z.infer<typeof transactionSchema>
  const ids = await db.select({ id: transactions.id }).from(transactions)
  await db.insert(transactions).values({
    id: body.id ?? nextTransactionId(ids.map((item) => item.id)),
    date: body.date,
    description: body.description,
    category: body.category,
    financeAccountId: body.financeAccountId,
    type: body.type,
    amount: String(body.amount),
    currentAccountId: body.currentAccountId,
  })
  return created(c, body)
})

financeRoutes.delete('/transactions/:id', async (c) => {
  const id = c.req.param('id')
  await db.delete(transactions).where(eq(transactions.id, id))
  return ok(c, { id })
})

financeRoutes.get('/summary', async (c) => {
  const accounts = await db.select().from(financeAccounts)
  const txs = await db.select().from(transactions)
  const summary = accounts.reduce(
    (acc, account) => {
      const balance = txs
        .filter((tx) => tx.financeAccountId === account.id)
        .reduce(
          (sum, tx) =>
            sum + (tx.type === 'income' ? toNumber(tx.amount) : -toNumber(tx.amount)),
          0,
        )

      if (account.type === 'cash') acc.totalCash += balance
      if (account.type === 'bank') acc.totalBank += balance
      return acc
    },
    { totalCash: 0, totalBank: 0, netPosition: 0 },
  )
  summary.netPosition = summary.totalCash + summary.totalBank
  return ok(c, summary)
})
