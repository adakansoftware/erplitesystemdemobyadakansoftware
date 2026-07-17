import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client'
import { companySettings } from '../db/schema'
import { audit } from '../lib/audit'
import { cached, invalidate } from '../lib/cache'
import { fail, ok } from '../lib/http'
import { requireRole } from '../middleware/auth'
import { validate } from '../middleware/validate'

const settingsSchema = z.object({
  name: z.string().min(2),
  taxNumber: z.string().optional().nullable(),
  taxOffice: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  currency: z.string().default('TRY'),
})

export const settingsRoutes = new Hono()

settingsRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  if (!tenantId) {
    return fail(c, 403, 'Tenant scope required')
  }
  const cacheKey = tenantId ? `settings:company:${tenantId}` : 'settings:company'
  const row = await cached(cacheKey, 3600, async () => {
    const [settings] = await db
      .select()
      .from(companySettings)
      .where(eq(companySettings.tenantId, tenantId))
    return settings ?? null
  })
  return ok(c, row)
})

settingsRoutes.put('/', requireRole('admin'), validate(settingsSchema), async (c) => {
  const tenantId = c.get('tenantId')
  if (!tenantId) {
    return fail(c, 403, 'Tenant scope required')
  }
  const body = c.get('validatedBody') as z.infer<typeof settingsSchema>
  const [previous] = await db
    .select()
    .from(companySettings)
    .where(eq(companySettings.tenantId, tenantId))
  await db
    .insert(companySettings)
    .values({ id: 1, tenantId, ...body, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: companySettings.tenantId,
      set: { ...body, updatedAt: new Date() },
    })
  const [row] = await db
    .select()
    .from(companySettings)
    .where(eq(companySettings.tenantId, tenantId))
  await invalidate('settings:*')
  await audit({
    userId: (c.get('user') as { id?: string } | undefined)?.id,
    action: 'update',
    entity: 'settings',
    entityId: `company:${tenantId}`,
    oldValues: previous ?? null,
    newValues: row,
    ip: c.req.header('x-forwarded-for'),
    userAgent: c.req.header('user-agent'),
  })
  return ok(c, row)
})
