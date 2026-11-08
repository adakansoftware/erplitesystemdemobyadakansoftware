import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import { createMiddleware } from 'hono/factory'
import type { Context } from 'hono'
import { fail } from '../lib/http'

type Bucket = { count: number; resetAt: number }

const memoryBuckets = new Map<string, Bucket>()

function memoryLimit(key: string, max: number, windowMs: number) {
  const now = Date.now()
  const bucket = memoryBuckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    if (memoryBuckets.size > 10_000) {
      for (const [existingKey, existing] of memoryBuckets) {
        if (existing.resetAt < now) memoryBuckets.delete(existingKey)
      }
    }
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (bucket.count >= max) {
    return false
  }
  bucket.count += 1
  return true
}

const upstash =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(60, '1 m'),
      })
    : null

async function allowRequest(key: string, max: number, windowMs: number) {
  if (upstash) {
    const { success } = await upstash.limit(key)
    return success
  }
  return memoryLimit(key, max, windowMs)
}

/**
 * X-Forwarded-For is only trusted when the server runs behind a proxy the
 * operator controls (TRUST_PROXY=1). Otherwise the header is client-controlled
 * and could be rotated per request to bypass rate limiting, so fall back to the
 * socket's remote address.
 */
function clientKey(c: Context) {
  if (process.env.TRUST_PROXY === '1') {
    const forwarded = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
    if (forwarded) return forwarded
  }
  const remote = (
    c.env as unknown as { incoming?: { socket?: { remoteAddress?: string } } } | undefined
  )?.incoming?.socket?.remoteAddress
  return remote || 'anonymous'
}

export const rateLimitMiddleware = createMiddleware(async (c, next) => {
  const success = await allowRequest(clientKey(c), 60, 60_000)
  if (!success) return fail(c, 429, 'Too many requests')
  await next()
})

export const authRateLimit = createMiddleware(async (c, next) => {
  const success = await allowRequest(`auth:${clientKey(c)}`, 5, 15 * 60_000)
  if (!success) return fail(c, 429, 'Too many login attempts')
  await next()
})
