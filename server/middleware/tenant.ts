import { createMiddleware } from 'hono/factory'
import { fail } from '../lib/http'

function readTenantId(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : undefined
}

export const tenantMiddleware = createMiddleware(async (c, next) => {
  const user = c.get('user') as { tenantId?: string } | undefined
  const userTenantId = readTenantId(user?.tenantId)
  const requestedTenantId =
    readTenantId(c.req.header('x-tenant-id')) ?? readTenantId(c.req.query('tenantId'))

  if (userTenantId && requestedTenantId && requestedTenantId !== userTenantId) {
    return fail(c, 403, 'Forbidden tenant scope')
  }

  const tenantId = userTenantId ?? requestedTenantId

  c.set('tenantId', tenantId)
  await next()
})
