import { Hono } from 'hono'
import { and, eq, ilike, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client'
import { companies, contacts, deals, leads, tasks } from '../db/schema'
import { created, ok } from '../lib/http'
import { requireRole } from '../middleware/auth'
import { validate } from '../middleware/validate'

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
  await db
    .update(companies)
    .set(c.get('validatedBody') as Partial<z.infer<typeof companySchema>>)
    .where(and(eq(companies.id, id), ...(tenantId ? [eq(companies.tenantId, tenantId)] : [])))
  return ok(c, { id })
})

crmRoutes.put('/contacts/:id', validate(contactSchema.partial()), async (c) => {
  const id = c.req.param('id')
  const tenantId = c.get('tenantId')
  await db
    .update(contacts)
    .set(c.get('validatedBody') as Partial<z.infer<typeof contactSchema>>)
    .where(and(eq(contacts.id, id), ...(tenantId ? [eq(contacts.tenantId, tenantId)] : [])))
  return ok(c, { id })
})

crmRoutes.put('/deals/:id', validate(dealSchema.partial()), async (c) => {
  const id = c.req.param('id')
  const tenantId = c.get('tenantId')
  const body = c.get('validatedBody') as Partial<z.infer<typeof dealSchema>>
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
  await db
    .update(tasks)
    .set(c.get('validatedBody') as Partial<z.infer<typeof taskSchema>>)
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
