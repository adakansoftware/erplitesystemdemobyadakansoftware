import { Hono } from 'hono'
import { and, eq, ilike } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client'
import { currentAccounts, transactions } from '../db/schema'
import { calculateCurrentAccountBalance } from '../lib/rules'
import { created, fail, ok } from '../lib/http'
import { validate } from '../middleware/validate'

const accountSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  type: z.enum(['customer', 'supplier']),
  taxNumber: z.string().optional().nullable(),
  taxOffice: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  creditLimit: z.coerce.number().default(0),
})

export const currentAccountsRoutes = new Hono()

currentAccountsRoutes.get('/', async (c) => {
  const type = c.req.query('type')
  const search = c.req.query('search')
  const filters = [
    type ? eq(currentAccounts.type, type) : undefined,
    search ? ilike(currentAccounts.name, `%${search}%`) : undefined,
    eq(currentAccounts.active, true),
  ].filter(Boolean)

  const items = await db
    .select()
    .from(currentAccounts)
    .where(and(...filters))

  const withBalance = await Promise.all(
    items.map(async (item) => ({
      ...item,
      balance: await calculateCurrentAccountBalance(item.id),
    })),
  )
  return ok(c, withBalance)
})

currentAccountsRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  const [account] = await db
    .select()
    .from(currentAccounts)
    .where(eq(currentAccounts.id, id))
  if (!account) {
    return fail(c, 404, 'Current account not found')
  }

  return ok(c, { ...account, balance: await calculateCurrentAccountBalance(id) })
})

currentAccountsRoutes.get('/:id/statement', async (c) => {
  const id = c.req.param('id')
  const rows = await db
    .select()
    .from(transactions)
    .where(eq(transactions.currentAccountId, id))
  return ok(c, rows)
})

currentAccountsRoutes.post('/', validate(accountSchema), async (c) => {
  const body = c.get('validatedBody') as z.infer<typeof accountSchema>
  await db.insert(currentAccounts).values({
    id: body.id ?? `CARI-${Date.now()}`,
    name: body.name,
    type: body.type,
    taxNumber: body.taxNumber,
    taxOffice: body.taxOffice,
    address: body.address,
    city: body.city,
    phone: body.phone,
    email: body.email,
    creditLimit: String(body.creditLimit),
  })
  return created(c, body)
})

currentAccountsRoutes.put('/:id', validate(accountSchema.partial()), async (c) => {
  const id = c.req.param('id')
  const body = c.get('validatedBody') as Partial<z.infer<typeof accountSchema>>
  await db
    .update(currentAccounts)
    .set({
      ...body,
      creditLimit: body.creditLimit != null ? String(body.creditLimit) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(currentAccounts.id, id))
  const [account] = await db.select().from(currentAccounts).where(eq(currentAccounts.id, id))
  return ok(c, account)
})

currentAccountsRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await db
    .update(currentAccounts)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(currentAccounts.id, id))
  return ok(c, { id, active: false })
})
