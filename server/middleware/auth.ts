import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { fail } from '../lib/http'
import { verifyToken } from '../lib/auth'

export const authMiddleware = createMiddleware(async (c, next) => {
  const token =
    c.req.header('Authorization')?.replace('Bearer ', '') ??
    getCookie(c, 'erp_token')

  if (!token) {
    return fail(c, 401, 'Unauthorized')
  }

  try {
    const payload = await verifyToken(token)
    c.set('user', {
      id: typeof payload.id === 'string' ? payload.id : undefined,
      name: typeof payload.name === 'string' ? payload.name : undefined,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      role: typeof payload.role === 'string' ? payload.role : undefined,
    })
    await next()
  } catch {
    return fail(c, 401, 'Invalid token')
  }
})

export function requireRole(...roles: string[]) {
  return createMiddleware(async (c, next) => {
    const user = c.get('user') as { role?: string } | undefined
    if (!user?.role || !roles.includes(user.role)) {
      return fail(c, 403, 'Forbidden')
    }
    await next()
  })
}
