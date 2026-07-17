import { Hono } from 'hono'
import { and, eq, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client'
import { currentAccounts, financeAccounts, transactions } from '../db/schema'
import { audit } from '../lib/audit'
import { cached, invalidate, tenantCacheKey, tenantCachePattern } from '../lib/cache'
import { nextTransactionId } from '../lib/ids'
import { created, fail, ok } from '../lib/http'
import { toNumber } from '../lib/serializers'
import { requireRole } from '../middleware/auth'
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
  const tenantId = c.get('tenantId')
  const accounts = await db
    .select()
    .from(financeAccounts)
    .where(tenantId ? eq(financeAccounts.tenantId, tenantId) : undefined)
  const txs = await db
    .select()
    .from(transactions)
    .where(tenantId ? eq(transactions.tenantId, tenantId) : undefined)
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
  const tenantId = c.get('tenantId')
  await db.insert(financeAccounts).values({
    id: body.id ?? `ACC-${Date.now()}`,
    tenantId,
    name: body.name,
    type: body.type,
    bankName: body.bankName,
    iban: body.iban,
    currency: body.currency,
  })
  await invalidate(tenantCachePattern('finance:summary', tenantId))
  return created(c, body)
})

financeRoutes.get('/transactions', async (c) => {
  const tenantId = c.get('tenantId')
  const accountId = c.req.query('accountId')
  const type = c.req.query('type')
  const page = Math.max(1, Number(c.req.query('page') ?? 1))
  const limit = Math.min(100, Number(c.req.query('limit') ?? 50))
  const offset = (page - 1) * limit
  const filters: SQL[] = [
    tenantId ? eq(transactions.tenantId, tenantId) : undefined,
    accountId ? eq(transactions.financeAccountId, accountId) : undefined,
    type ? eq(transactions.type, type) : undefined,
  ].filter((filter): filter is SQL => filter !== undefined)

  const [txs, accounts, countResult] = await Promise.all([
    db
      .select()
      .from(transactions)
      .where(filters.length ? and(...filters) : undefined)
      .limit(limit)
      .offset(offset),
    db.select().from(financeAccounts).where(tenantId ? eq(financeAccounts.tenantId, tenantId) : undefined),
    db
      .select({ count: sql<string>`count(*)` })
      .from(transactions)
      .where(filters.length ? and(...filters) : undefined),
  ])
  const accountMap = new Map(accounts.map((account) => [account.id, account.name]))
  const total = Number((countResult as Array<{ count: string }>)[0]?.count ?? 0)

  return ok(
    c,
    txs.map((item) => ({
      ...item,
        amount: Number(item.amount),
        account: accountMap.get(item.financeAccountId) ?? item.financeAccountId,
      })),
    { total, page, limit, pages: Math.ceil(total / limit) },
  )
})

financeRoutes.post('/transactions', validate(transactionSchema), async (c) => {
  const body = c.get('validatedBody') as z.infer<typeof transactionSchema>
  const tenantId = c.get('tenantId')
  if (tenantId && body.currentAccountId) {
    const [account] = await db
      .select({ id: currentAccounts.id })
      .from(currentAccounts)
      .where(and(eq(currentAccounts.id, body.currentAccountId), eq(currentAccounts.tenantId, tenantId)))

    if (!account) {
      return fail(c, 404, 'Current account not found')
    }
  }
  const ids = await db.select({ id: transactions.id }).from(transactions)
  const id = body.id ?? nextTransactionId(ids.map((item) => item.id))
  await db.insert(transactions).values({
    id,
    date: body.date,
    description: body.description,
    category: body.category,
    financeAccountId: body.financeAccountId,
    type: body.type,
    amount: String(body.amount),
    currentAccountId: body.currentAccountId,
    tenantId,
    createdBy: (c.get('user') as { id?: string } | undefined)?.id,
  })
  await invalidate(tenantCachePattern('reports:cashflow', tenantId))
  await audit({
    userId: (c.get('user') as { id?: string } | undefined)?.id,
    action: 'create',
    entity: 'transaction',
    entityId: id,
    newValues: body,
    ip: c.req.header('x-forwarded-for'),
    userAgent: c.req.header('user-agent'),
  })
  await invalidate(tenantCachePattern('finance:summary', tenantId))
  return created(c, body)
})

financeRoutes.delete('/transactions/:id', requireRole('admin'), async (c) => {
  const id = c.req.param('id')
  const tenantId = c.get('tenantId')
  await db
    .delete(transactions)
    .where(
      and(
        eq(transactions.id, id),
        ...(tenantId ? [eq(transactions.tenantId, tenantId)] : []),
      ),
    )
  await invalidate(tenantCachePattern('reports:cashflow', tenantId))
  await invalidate(tenantCachePattern('finance:summary', tenantId))
  return ok(c, { id })
})

financeRoutes.get('/summary', async (c) => {
  const tenantId = c.get('tenantId')
  const summary = await cached(tenantCacheKey('finance:summary', tenantId), 60, async () => {
    const accounts = await db
      .select()
      .from(financeAccounts)
      .where(tenantId ? eq(financeAccounts.tenantId, tenantId) : undefined)
    const txs = await db
      .select()
      .from(transactions)
      .where(tenantId ? eq(transactions.tenantId, tenantId) : undefined)
    const result = accounts.reduce(
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
    result.netPosition = result.totalCash + result.totalBank
    return result
  })
  summary.netPosition = summary.totalCash + summary.totalBank
  return ok(c, summary)
})
