import { createMiddleware } from 'hono/factory'

function readTenantId(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : undefined
}

export const tenantMiddleware = createMiddleware(async (c, next) => {
  const user = c.get('user') as { tenantId?: string } | undefined
  const tenantId =
    readTenantId(c.req.header('x-tenant-id')) ??
    readTenantId(c.req.query('tenantId')) ??
    readTenantId(user?.tenantId)

  c.set('tenantId', tenantId)
  await next()
})
