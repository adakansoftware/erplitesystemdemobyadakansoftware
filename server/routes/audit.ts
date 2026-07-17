import { Hono } from 'hono'
import { desc, eq, inArray } from 'drizzle-orm'
import { db } from '../db/client'
import { auditLogs, users } from '../db/schema'
import { ok } from '../lib/http'
import { requireRole } from '../middleware/auth'

export const auditRoutes = new Hono()

auditRoutes.get('/', requireRole('admin'), async (c) => {
  const tenantId = c.get('tenantId')
  const tenantUsers = tenantId
    ? await db.select({ id: users.id }).from(users).where(eq(users.tenantId, tenantId))
    : []
  const userIds = tenantUsers.map((user) => user.id)
  const logs = await db
    .select()
    .from(auditLogs)
    .where(tenantId && userIds.length ? inArray(auditLogs.userId, userIds) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(200)
  return ok(c, logs)
})
