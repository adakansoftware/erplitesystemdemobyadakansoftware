import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client'
import { companySettings } from '../db/schema'
import { ok } from '../lib/http'
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
  const [row] = await db.select().from(companySettings).where(eq(companySettings.id, 1))
  return ok(c, row ?? null)
})

settingsRoutes.put('/', requireRole('admin'), validate(settingsSchema), async (c) => {
  const body = c.get('validatedBody') as z.infer<typeof settingsSchema>
  await db
    .insert(companySettings)
    .values({ id: 1, ...body, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: companySettings.id,
      set: { ...body, updatedAt: new Date() },
    })
  const [row] = await db.select().from(companySettings).where(eq(companySettings.id, 1))
  return ok(c, row)
})
