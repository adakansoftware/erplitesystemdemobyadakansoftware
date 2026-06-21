import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import { createMiddleware } from 'hono/factory'
import { fail } from '../lib/http'

type Bucket = { count: number; resetAt: number }

const memoryBuckets = new Map<string, Bucket>()

function memoryLimit(key: string, max: number, windowMs: number) {
  const now = Date.now()
  const bucket = memoryBuckets.get(key)
  if (!bucket || bucket.resetAt < now) {
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

export const rateLimitMiddleware = createMiddleware(async (c, next) => {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anonymous'
  const success = await allowRequest(ip, 60, 60_000)
  if (!success) return fail(c, 429, 'Too many requests')
  await next()
})

export const authRateLimit = createMiddleware(async (c, next) => {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anonymous'
  const success = await allowRequest(`auth:${ip}`, 5, 15 * 60_000)
  if (!success) return fail(c, 429, 'Too many login attempts')
  await next()
})
