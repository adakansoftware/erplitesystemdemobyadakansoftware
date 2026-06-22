import { Hono, type Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client'
import { refreshTokens, users } from '../db/schema'
import { audit } from '../lib/audit'
import {
  createRefreshToken,
  hashPassword,
  signAccessToken,
  verifyToken,
  verifyPassword,
} from '../lib/auth'
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

function getRefreshTokenFromRequest(c: Context) {
  return c.req.header('x-refresh-token') ?? getCookie(c, 'erp_refresh_token')
}

authRoutes.post('/login', validate(loginSchema), async (c) => {
  const body = c.get('validatedBody') as z.infer<typeof loginSchema>
  const [user] = await db.select().from(users).where(eq(users.email, body.email))

  if (!user || !user.active || !verifyPassword(body.password, user.passwordHash)) {
    return fail(c, 401, 'Invalid email or password')
  }

  const token = await signAccessToken({
    id: user.id,
    tenantId: user.tenantId,
    name: user.name,
    email: user.email,
    role: user.role,
  })
  const refreshToken = createRefreshToken()
  const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  await db.insert(refreshTokens).values({
    userId: user.id,
    token: refreshToken,
    expiresAt: refreshExpiry,
  })

  setCookie(c, 'erp_token', token, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 15,
    path: '/',
  })
  setCookie(c, 'erp_refresh_token', refreshToken, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })

  await audit({
    userId: user.id,
    action: 'login',
    entity: 'auth',
    entityId: user.id,
    ip: c.req.header('x-forwarded-for'),
    userAgent: c.req.header('user-agent'),
  })

  return ok(c, {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    },
  })
})

authRoutes.post('/logout', async (c) => {
  const refreshToken = getRefreshTokenFromRequest(c)
  const accessToken = getCookie(c, 'erp_token')
  const session = accessToken ? await verifyAccessTokenSafely(accessToken) : null
  if (refreshToken) {
    await db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.token, refreshToken))
  }
  await audit({
    userId: session?.id,
    action: 'logout',
    entity: 'auth',
    entityId: session?.id,
    ip: c.req.header('x-forwarded-for'),
    userAgent: c.req.header('user-agent'),
  })
  deleteCookie(c, 'erp_token', { path: '/' })
  deleteCookie(c, 'erp_refresh_token', { path: '/' })
  return ok(c, { success: true })
})

authRoutes.post('/refresh', async (c) => {
  const token = getRefreshTokenFromRequest(c)
  if (!token) {
    return fail(c, 401, 'Refresh token missing')
  }

  const [refreshToken] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.token, token))
  if (!refreshToken || refreshToken.revoked || refreshToken.expiresAt < new Date()) {
    return fail(c, 401, 'Refresh token invalid')
  }

  const [user] = await db.select().from(users).where(eq(users.id, refreshToken.userId))
  if (!user || !user.active) {
    return fail(c, 401, 'User not found')
  }

  const accessToken = await signAccessToken({
    id: user.id,
    tenantId: user.tenantId,
    name: user.name,
    email: user.email,
    role: user.role,
  })
  const nextRefreshToken = createRefreshToken()
  const nextExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  await db
    .update(refreshTokens)
    .set({ revoked: true })
    .where(eq(refreshTokens.id, refreshToken.id))
  await db.insert(refreshTokens).values({
    userId: user.id,
    token: nextRefreshToken,
    expiresAt: nextExpiry,
  })

  setCookie(c, 'erp_token', accessToken, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 15,
    path: '/',
  })
  setCookie(c, 'erp_refresh_token', nextRefreshToken, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })

  return ok(c, { token: accessToken })
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
  await db
    .update(refreshTokens)
    .set({ revoked: true })
    .where(eq(refreshTokens.userId, sessionUser.id))

  return ok(c, { ok: true })
})

async function verifyAccessTokenSafely(token: string) {
  try {
    const payload = await verifyToken(token)
    return {
      id: typeof payload.id === 'string' ? payload.id : undefined,
    }
  } catch {
    return null
  }
}
