import { createMiddleware } from 'hono/factory'
import { fail } from '../lib/http'

function readTenantId(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export const tenantMiddleware = createMiddleware(async (c, next) => {
  const user = c.get('user') as { tenantId?: string } | undefined
  const tenantId = readTenantId(user?.tenantId)

  if (!tenantId) {
    return fail(c, 403, 'Tenant scope required')
  }

  const headerTenantId = readTenantId(c.req.header('x-tenant-id'))
  if (headerTenantId && headerTenantId !== tenantId) {
    return fail(c, 403, 'Forbidden tenant scope')
  }

  c.set('tenantId', tenantId)
  await next()
})
