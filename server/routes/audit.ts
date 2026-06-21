import { Hono } from 'hono'
import { desc } from 'drizzle-orm'
import { db } from '../db/client'
import { auditLogs } from '../db/schema'
import { ok } from '../lib/http'
import { requireRole } from '../middleware/auth'

export const auditRoutes = new Hono()

auditRoutes.get('/', requireRole('admin'), async (c) => {
  const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200)
  return ok(c, logs)
})
