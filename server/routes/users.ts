import { Hono } from 'hono'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client'
import { users } from '../db/schema'
import { hashPassword } from '../lib/auth'
import { created, fail, ok } from '../lib/http'
import { requireRole } from '../middleware/auth'
import { validate } from '../middleware/validate'

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'manager', 'sales']),
})

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['admin', 'manager', 'sales']).optional(),
  active: z.boolean().optional(),
})

export const usersRoutes = new Hono()

usersRoutes.use('*', requireRole('admin'))

usersRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const page = Math.max(1, Number(c.req.query('page') ?? 1))
  const limit = Math.min(100, Number(c.req.query('limit') ?? 50))
  const offset = (page - 1) * limit

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        active: users.active,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(tenantId ? eq(users.tenantId, tenantId) : undefined)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<string>`count(*)` })
      .from(users)
      .where(tenantId ? eq(users.tenantId, tenantId) : undefined),
  ])

  const total = Number(countResult[0]?.count ?? 0)
  return ok(c, items, { total, page, limit, pages: Math.ceil(total / limit) })
})

usersRoutes.post('/', validate(createUserSchema), async (c) => {
  const body = c.get('validatedBody') as z.infer<typeof createUserSchema>
  const tenantId = c.get('tenantId')
  const [existing] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.email, body.email),
        ...(tenantId ? [eq(users.tenantId, tenantId)] : []),
      ),
    )
  if (existing) {
    return fail(c, 409, 'User already exists')
  }

  const [createdUser] = await db
    .insert(users)
    .values({
      tenantId,
      name: body.name,
      email: body.email,
      passwordHash: hashPassword(body.password),
      role: body.role,
      active: true,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })

  return created(c, createdUser)
})

usersRoutes.put('/:id', validate(updateUserSchema), async (c) => {
  const id = c.req.param('id')
  const body = c.get('validatedBody') as z.infer<typeof updateUserSchema>
  const tenantId = c.get('tenantId')

  const [updatedUser] = await db
    .update(users)
    .set({ ...body, updatedAt: new Date() })
    .where(
      and(
        eq(users.id, id),
        ...(tenantId ? [eq(users.tenantId, tenantId)] : []),
      ),
    )
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })

  if (!updatedUser) {
    return fail(c, 404, 'User not found')
  }

  return ok(c, updatedUser)
})

usersRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const tenantId = c.get('tenantId')

  const [updatedUser] = await db
    .update(users)
    .set({ active: false, updatedAt: new Date() })
    .where(
      and(
        eq(users.id, id),
        ...(tenantId ? [eq(users.tenantId, tenantId)] : []),
      ),
    )
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })

  if (!updatedUser) {
    return fail(c, 404, 'User not found')
  }

  return ok(c, updatedUser)
})
