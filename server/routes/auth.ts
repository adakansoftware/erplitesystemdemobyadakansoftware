import { Hono } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client'
import { users } from '../db/schema'
import { hashPassword, signToken, verifyPassword } from '../lib/auth'
import { fail, ok } from '../lib/http'
import { authMiddleware } from '../middleware/auth'
import { validate } from '../middleware/validate'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
})

export const authRoutes = new Hono()

authRoutes.post('/login', validate(loginSchema), async (c) => {
  const body = c.get('validatedBody') as z.infer<typeof loginSchema>
  const [user] = await db.select().from(users).where(eq(users.email, body.email))

  if (!user || !user.active || !verifyPassword(body.password, user.passwordHash)) {
    return fail(c, 401, 'Invalid email or password')
  }

  const token = await signToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })

  setCookie(c, 'erp_token', token, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 8,
    path: '/',
  })

  return ok(c, {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  })
})

authRoutes.post('/logout', async (c) => {
  deleteCookie(c, 'erp_token', { path: '/' })
  return ok(c, { success: true })
})

authRoutes.get('/me', authMiddleware, async (c) => {
  const user = c.get('user')
  return ok(c, user)
})

authRoutes.patch('/password', authMiddleware, validate(passwordSchema), async (c) => {
  const body = c.get('validatedBody') as z.infer<typeof passwordSchema>
  const sessionUser = c.get('user') as { id?: string } | undefined

  if (!sessionUser?.id) {
    return fail(c, 401, 'Unauthorized')
  }

  const [user] = await db.select().from(users).where(eq(users.id, sessionUser.id))
  if (!user || !verifyPassword(body.currentPassword, user.passwordHash)) {
    return fail(c, 401, 'Current password is incorrect')
  }

  await db
    .update(users)
    .set({ passwordHash: hashPassword(body.newPassword), updatedAt: new Date() })
    .where(eq(users.id, sessionUser.id))

  return ok(c, { ok: true })
})
