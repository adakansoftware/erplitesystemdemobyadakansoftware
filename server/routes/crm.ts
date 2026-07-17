import { Hono } from 'hono'
import { and, eq, ilike, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client'
import { companies, contacts, currentAccounts, deals, leads, tasks, users } from '../db/schema'
import { created, fail, ok } from '../lib/http'
import { requireRole } from '../middleware/auth'
import { validate } from '../middleware/validate'

async function ensureCurrentAccountBelongsToTenant(
  tenantId: string | undefined,
  currentAccountId: string | null | undefined,
) {
  if (!tenantId || !currentAccountId) return true

  const [account] = await db
    .select({ id: currentAccounts.id })
    .from(currentAccounts)
    .where(and(eq(currentAccounts.id, currentAccountId), eq(currentAccounts.tenantId, tenantId)))

  return Boolean(account)
}

async function ensureCompanyBelongsToTenant(tenantId: string | undefined, companyId: string | null | undefined) {
  if (!tenantId || !companyId) return true

  const [company] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(and(eq(companies.id, companyId), eq(companies.tenantId, tenantId)))

  return Boolean(company)
}

async function ensureAssignedUserBelongsToTenant(
  tenantId: string | undefined,
  assignedTo: string | null | undefined,
) {
  if (!tenantId || !assignedTo) return true

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, assignedTo), eq(users.tenantId, tenantId)))

  return Boolean(user)
}

function crudRoutes<T extends z.ZodTypeAny>(
  app: Hono,
  base: string,
  table: any,
  schema: T,
  searchColumn?: any,
) {
  app.get(base, async (c) => {
    const tenantId = c.get('tenantId')
    const search = c.req.query('search')
    const page = Math.max(1, Number(c.req.query('page') ?? 1))
    const limit = Math.min(100, Number(c.req.query('limit') ?? 50))
    const offset = (page - 1) * limit
    const whereClause = and(
      ...(tenantId && 'tenantId' in table ? [eq(table.tenantId, tenantId)] : []),
      ...(search && searchColumn ? [ilike(searchColumn, `%${search}%`)] : []),
    )
    const [items, countResult] = await Promise.all([
      db.select().from(table).where(whereClause).limit(limit).offset(offset),
      db.select({ count: sql<string>`count(*)` }).from(table).where(whereClause),
    ])
    const total = Number(countResult[0]?.count ?? 0)
    return ok(c, items, { total, page, limit, pages: Math.ceil(total / limit) })
  })

  app.post(base, validate(schema), async (c) => {
    const body = c.get('validatedBody') as z.infer<T>
    const tenantId = c.get('tenantId')
    if (base === '/companies' && !await ensureCurrentAccountBelongsToTenant(tenantId, (body as { currentAccountId?: string | null }).currentAccountId)) {
      return fail(c, 404, 'Current account not found')
    }
    if (base === '/contacts' && !await ensureCompanyBelongsToTenant(tenantId, (body as { companyId?: string | null }).companyId)) {
      return fail(c, 404, 'Company not found')
    }
    if (base === '/deals' && !await ensureCurrentAccountBelongsToTenant(tenantId, (body as { currentAccountId?: string | null }).currentAccountId)) {
      return fail(c, 404, 'Current account not found')
    }
    if (base === '/tasks' && !await ensureAssignedUserBelongsToTenant(tenantId, (body as { assignedTo?: string | null }).assignedTo)) {
      return fail(c, 404, 'Assigned user not found')
    }
    await db.insert(table).values({
      ...(body as Record<string, unknown>),
      ...('tenantId' in table ? { tenantId } : {}),
    })
    return created(c, body)
  })
}

const leadSchema = z.object({
  id: z.string(),
  name: z.string(),
  company: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  status: z.string().default('new'),
  value: z.coerce.number().default(0),
  owner: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
})

const companySchema = z.object({
  id: z.string(),
  name: z.string(),
  sector: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  currentAccountId: z.string().optional().nullable(),
})

const contactSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
})

const dealSchema = z.object({
  id: z.string(),
  title: z.string(),
  currentAccountId: z.string().optional().nullable(),
  stage: z.string().default('lead'),
  value: z.coerce.number().default(0),
  owner: z.string().optional().nullable(),
  closeDate: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
})

const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  related: z.string().optional().nullable(),
  relatedType: z.string().optional().nullable(),
  relatedId: z.string().optional().nullable(),
  due: z.string().optional().nullable(),
  priority: z.string().default('medium'),
  owner: z.string().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
  done: z.boolean().optional(),
})

export const crmRoutes = new Hono()

crudRoutes(crmRoutes, '/leads', leads, leadSchema, leads.name)
crudRoutes(crmRoutes, '/companies', companies, companySchema, companies.name)
crudRoutes(crmRoutes, '/contacts', contacts, contactSchema, contacts.name)
crudRoutes(crmRoutes, '/deals', deals, dealSchema, deals.title)
crudRoutes(crmRoutes, '/tasks', tasks, taskSchema, tasks.title)

crmRoutes.put('/leads/:id', validate(leadSchema.partial()), async (c) => {
  const id = c.req.param('id')
  const tenantId = c.get('tenantId')
  const body = c.get('validatedBody') as Partial<z.infer<typeof leadSchema>>
  await db
    .update(leads)
    .set({
      ...body,
      value: body.value != null ? String(body.value) : undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(leads.id, id), ...(tenantId ? [eq(leads.tenantId, tenantId)] : [])))
  return ok(c, { id })
})

crmRoutes.delete('/leads/:id', async (c) => {
  const id = c.req.param('id')
  const tenantId = c.get('tenantId')
  await db
    .delete(leads)
    .where(and(eq(leads.id, id), ...(tenantId ? [eq(leads.tenantId, tenantId)] : [])))
  return ok(c, { id })
})

crmRoutes.put('/companies/:id', validate(companySchema.partial()), async (c) => {
  const id = c.req.param('id')
  const tenantId = c.get('tenantId')
  const body = c.get('validatedBody') as Partial<z.infer<typeof companySchema>>
  if (!await ensureCurrentAccountBelongsToTenant(tenantId, body.currentAccountId)) {
    return fail(c, 404, 'Current account not found')
  }
  await db
    .update(companies)
    .set(body)
    .where(and(eq(companies.id, id), ...(tenantId ? [eq(companies.tenantId, tenantId)] : [])))
  return ok(c, { id })
})

crmRoutes.put('/contacts/:id', validate(contactSchema.partial()), async (c) => {
  const id = c.req.param('id')
  const tenantId = c.get('tenantId')
  const body = c.get('validatedBody') as Partial<z.infer<typeof contactSchema>>
  if (!await ensureCompanyBelongsToTenant(tenantId, body.companyId)) {
    return fail(c, 404, 'Company not found')
  }
  await db
    .update(contacts)
    .set(body)
    .where(and(eq(contacts.id, id), ...(tenantId ? [eq(contacts.tenantId, tenantId)] : [])))
  return ok(c, { id })
})

crmRoutes.put('/deals/:id', validate(dealSchema.partial()), async (c) => {
  const id = c.req.param('id')
  const tenantId = c.get('tenantId')
  const body = c.get('validatedBody') as Partial<z.infer<typeof dealSchema>>
  if (!await ensureCurrentAccountBelongsToTenant(tenantId, body.currentAccountId)) {
    return fail(c, 404, 'Current account not found')
  }
  await db
    .update(deals)
    .set({
      ...body,
      value: body.value != null ? String(body.value) : undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(deals.id, id), ...(tenantId ? [eq(deals.tenantId, tenantId)] : [])))
  return ok(c, { id })
})

crmRoutes.put('/tasks/:id', validate(taskSchema.partial()), async (c) => {
  const id = c.req.param('id')
  const tenantId = c.get('tenantId')
  const body = c.get('validatedBody') as Partial<z.infer<typeof taskSchema>>
  if (!await ensureAssignedUserBelongsToTenant(tenantId, body.assignedTo)) {
    return fail(c, 404, 'Assigned user not found')
  }
  await db
    .update(tasks)
    .set(body)
    .where(and(eq(tasks.id, id), ...(tenantId ? [eq(tasks.tenantId, tenantId)] : [])))
  return ok(c, { id })
})

crmRoutes.patch('/tasks/:id/toggle', async (c) => {
  const id = c.req.param('id')
  const tenantId = c.get('tenantId')
  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), ...(tenantId ? [eq(tasks.tenantId, tenantId)] : [])))
  await db
    .update(tasks)
    .set({ done: !task?.done, doneAt: !task?.done ? new Date() : null, updatedAt: new Date() })
    .where(and(eq(tasks.id, id), ...(tenantId ? [eq(tasks.tenantId, tenantId)] : [])))
  return ok(c, { id, done: !task?.done })
})

crmRoutes.delete('/tasks/:id', requireRole('admin', 'manager'), async (c) => {
  const id = c.req.param('id')
  const tenantId = c.get('tenantId')
  await db
    .delete(tasks)
    .where(and(eq(tasks.id, id), ...(tenantId ? [eq(tasks.tenantId, tenantId)] : [])))
  return ok(c, { id })
})

crmRoutes.get('/pipeline', async (c) => {
  const tenantId = c.get('tenantId')
  const items = await db
    .select()
    .from(deals)
    .where(tenantId ? eq(deals.tenantId, tenantId) : undefined)
  const grouped = items.reduce<Record<string, { count: number; totalValue: number }>>(
    (acc, item) => {
      const key = item.stage
      acc[key] ??= { count: 0, totalValue: 0 }
      acc[key].count += 1
      acc[key].totalValue += Number(item.value ?? 0)
      return acc
    },
    {},
  )
  return ok(c, grouped)
})
