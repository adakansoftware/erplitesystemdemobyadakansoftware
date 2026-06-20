import { Hono } from 'hono'
import { and, eq, ilike, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client'
import { companies, contacts, deals, leads, tasks } from '../db/schema'
import { created, ok } from '../lib/http'
import { validate } from '../middleware/validate'

function crudRoutes<T extends z.ZodTypeAny>(
  app: Hono,
  base: string,
  table: any,
  schema: T,
  searchColumn?: any,
) {
  app.get(base, async (c) => {
    const search = c.req.query('search')
    const items = await db
      .select()
      .from(table)
      .where(search && searchColumn ? ilike(searchColumn, `%${search}%`) : undefined)
    return ok(c, items)
  })

  app.post(base, validate(schema), async (c) => {
    const body = c.get('validatedBody') as z.infer<T>
    await db.insert(table).values(body as Record<string, unknown>)
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
  const body = c.get('validatedBody') as Partial<z.infer<typeof leadSchema>>
  await db
    .update(leads)
    .set({
      ...body,
      value: body.value != null ? String(body.value) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(leads.id, id))
  return ok(c, { id })
})

crmRoutes.delete('/leads/:id', async (c) => {
  const id = c.req.param('id')
  await db.delete(leads).where(eq(leads.id, id))
  return ok(c, { id })
})

crmRoutes.put('/companies/:id', validate(companySchema.partial()), async (c) => {
  const id = c.req.param('id')
  await db
    .update(companies)
    .set(c.get('validatedBody') as Partial<z.infer<typeof companySchema>>)
    .where(eq(companies.id, id))
  return ok(c, { id })
})

crmRoutes.put('/contacts/:id', validate(contactSchema.partial()), async (c) => {
  const id = c.req.param('id')
  await db
    .update(contacts)
    .set(c.get('validatedBody') as Partial<z.infer<typeof contactSchema>>)
    .where(eq(contacts.id, id))
  return ok(c, { id })
})

crmRoutes.put('/deals/:id', validate(dealSchema.partial()), async (c) => {
  const id = c.req.param('id')
  const body = c.get('validatedBody') as Partial<z.infer<typeof dealSchema>>
  await db
    .update(deals)
    .set({
      ...body,
      value: body.value != null ? String(body.value) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(deals.id, id))
  return ok(c, { id })
})

crmRoutes.put('/tasks/:id', validate(taskSchema.partial()), async (c) => {
  const id = c.req.param('id')
  await db
    .update(tasks)
    .set(c.get('validatedBody') as Partial<z.infer<typeof taskSchema>>)
    .where(eq(tasks.id, id))
  return ok(c, { id })
})

crmRoutes.patch('/tasks/:id/toggle', async (c) => {
  const id = c.req.param('id')
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id))
  await db
    .update(tasks)
    .set({ done: !task?.done, doneAt: !task?.done ? new Date() : null, updatedAt: new Date() })
    .where(eq(tasks.id, id))
  return ok(c, { id, done: !task?.done })
})

crmRoutes.get('/pipeline', async (c) => {
  const items = await db.select().from(deals)
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
