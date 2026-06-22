import createDOMPurify from 'isomorphic-dompurify'
import { createMiddleware } from 'hono/factory'

const DOMPurify = createDOMPurify()

export function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') return DOMPurify.sanitize(value)
  if (Array.isArray(value)) return value.map(sanitizeValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, sanitizeValue(entry)]),
    )
  }
  return value
}

export const sanitizeMiddleware = createMiddleware(async (c, next) => {
  const body = c.req.header('content-type')?.includes('application/json')
    ? await c.req.json().catch(() => undefined)
    : undefined

  if (body && typeof body === 'object') {
    c.req.json = async <T>() => sanitizeValue(body) as T
  }

  await next()
})
