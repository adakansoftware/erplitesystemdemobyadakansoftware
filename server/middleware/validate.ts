import { createMiddleware } from 'hono/factory'
import type { ZodSchema } from 'zod'

export function validate<T>(schema: ZodSchema<T>) {
  return createMiddleware(async (c, next) => {
    const body = await c.req.json()
    const result = schema.safeParse(body)

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
