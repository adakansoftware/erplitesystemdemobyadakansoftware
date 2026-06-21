import { createMiddleware } from 'hono/factory'
import type { ZodSchema } from 'zod'
import { sanitizeValue } from './sanitize'

export function validate<T>(schema: ZodSchema<T>) {
  return createMiddleware(async (c, next) => {
    const contentType = c.req.header('content-type') ?? ''
    if (!contentType.toLocaleLowerCase().includes('application/json')) {
      return c.json(
        { error: 'Validation failed', details: { formErrors: ['JSON body bekleniyor'] } },
        400,
      )
    }

    const body = await c.req.json().catch(() => null)
    if (body === null) {
      return c.json(
        { error: 'Validation failed', details: { formErrors: ['Gecersiz JSON gonderildi'] } },
        400,
      )
    }

    const result = schema.safeParse(sanitizeValue(body))

    if (!result.success) {
      return c.json(
        { error: 'Validation failed', details: result.error.flatten() },
        400,
      )
    }

    c.set('validatedBody', result.data)
    await next()
  })
}
