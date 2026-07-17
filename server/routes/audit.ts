import { Hono } from 'hono'
import { desc, eq, inArray } from 'drizzle-orm'
import { db } from '../db/client'
import { auditLogs, users } from '../db/schema'
import { ok } from '../lib/http'
import { requireRole } from '../middleware/auth'

export const auditRoutes = new Hono()

auditRoutes.get('/', requireRole('admin'), async (c) => {
  const tenantId = c.get('tenantId')
  if (!tenantId) {
    return ok(c, [])
  }
  const tenantUsers = tenantId
    ? await db.select({ id: users.id }).from(users).where(eq(users.tenantId, tenantId))
    : []
  const userIds = tenantUsers.map((user) => user.id)
  if (!userIds.length) {
    return ok(c, [])
  }
  const logs = await db
    .select()
    .from(auditLogs)
    .where(inArray(auditLogs.userId, userIds))
    .orderBy(desc(auditLogs.createdAt))
    .limit(200)
  return ok(c, logs)
})
