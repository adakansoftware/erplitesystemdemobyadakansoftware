import type { Context } from 'hono'

export function ok<T>(c: Context, data: T, meta?: Record<string, unknown>) {
  return c.json(meta ? { data, meta } : { data }, 200)
}

export function created<T>(c: Context, data: T) {
  return c.json({ data }, 201)
}

export function fail(
  c: Context,
  status: 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500,
  error: string,
  details?: unknown,
) {
  return c.json(details ? { error, details } : { error }, status)
}
