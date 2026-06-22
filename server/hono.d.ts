import 'hono'

declare module 'hono' {
  interface ContextVariableMap {
    validatedBody: unknown
    user: {
      id?: string
      name?: string
      email?: string
      role?: string
      tenantId?: string
    }
    tenantId?: string
  }
}

export {}
