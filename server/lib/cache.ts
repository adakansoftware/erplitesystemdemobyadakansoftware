import Redis from 'ioredis'
import { logger } from './logger'

const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> {
  if (!redis) return fn()

  const hit = await redis.get(key)
  if (hit) {
    return JSON.parse(hit) as T
  }

  const value = await fn()
  await redis.setex(key, ttlSeconds, JSON.stringify(value))
  return value
}

export async function invalidate(pattern: string) {
  if (!redis) return

  try {
    const keys = await redis.keys(pattern)
    if (keys.length) {
      await redis.del(...keys)
    }
  } catch (error) {
    logger.error('Cache invalidation failed', error)
  }
}
