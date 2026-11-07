import { describe, expect, it } from 'vitest'
import { Hono } from 'hono'
import { testClient } from 'hono/testing'
import { tenantMiddleware } from '../tenant'

function makeApp(user?: Record<string, unknown>) {
  const app = new Hono()
  app.use('*', async (c, next) => {
    if (user) {
      c.set('user', user as never)
    }
    await next()
  })
  app.use('*', tenantMiddleware)
  app.get('/scoped', (c) => c.json({ tenantId: c.get('tenantId') ?? null }))
  return testClient(app) as any
}

describe('tenantMiddleware', () => {
  it('rejects requests without a user', async () => {
    const client = makeApp()
    const response = await client.scoped.$get()
    expect(response.status).toBe(403)
    expect((await response.json()).error).toBe('Tenant scope required')
  })

  it('rejects users without a tenantId', async () => {
    const client = makeApp({ id: 'usr-1', role: 'admin' })
    const response = await client.scoped.$get()
    expect(response.status).toBe(403)
    expect((await response.json()).error).toBe('Tenant scope required')
  })

  it('rejects a mismatching x-tenant-id header', async () => {
    const client = makeApp({ id: 'usr-1', tenantId: 'ten-1' })
    const response = await client.scoped.$get({}, {
      headers: { 'x-tenant-id': 'ten-2' },
    })
    expect(response.status).toBe(403)
    expect((await response.json()).error).toBe('Forbidden tenant scope')
  })

  it('accepts a matching x-tenant-id header', async () => {
    const client = makeApp({ id: 'usr-1', tenantId: 'ten-1' })
    const response = await client.scoped.$get({}, {
      headers: { 'x-tenant-id': 'ten-1' },
    })
    expect(response.status).toBe(200)
    expect((await response.json()).tenantId).toBe('ten-1')
  })

  it('ignores the tenantId query parameter', async () => {
    const client = makeApp({ id: 'usr-1', tenantId: 'ten-1' })
    const response = await client.scoped.$get({ query: { tenantId: 'ten-2' } })
    expect(response.status).toBe(200)
    expect((await response.json()).tenantId).toBe('ten-1')
  })
})
