import { db } from '../db/client'
import { auditLogs } from '../db/schema'
import { logger } from './logger'

export async function audit(params: {
  userId?: string
  action: 'create' | 'update' | 'delete' | 'login' | 'logout'
  entity: string
  entityId?: string
  oldValues?: unknown
  newValues?: unknown
  ip?: string
  userAgent?: string
}) {
  db.insert(auditLogs)
    .values({
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      oldValues: params.oldValues,
      newValues: params.newValues,
      ip: params.ip,
      userAgent: params.userAgent,
    })
    .catch((error) => logger.error('Audit insert failed', error))
}
