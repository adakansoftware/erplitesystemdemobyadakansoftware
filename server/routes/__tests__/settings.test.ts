import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { testClient } from 'hono/testing'

const selectMock = vi.hoisted(() => vi.fn())
const cachedMock = vi.hoisted(() => vi.fn(async (_key: string, _ttl: number, fn: () => Promise<unknown>) => fn()))

vi.mock('../../db/client', () => ({
  db: {
    select: selectMock,
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../../middleware/auth', async () => {
  const { createMiddleware } = await import('hono/factory')
  const { fail } = await import('../../lib/http')

  return {
    authMiddleware: createMiddleware(async (c, next) => {
      const token = c.req.header('Authorization')?.replace('Bearer ', '')
      if (token !== 'test-token') {
        return fail(c, 401, 'Unauthorized')
      }

      c.set('user', { id: 'usr-1', role: 'admin', tenantId: 'ten-1' })
      await next()
    }),
    requireRole: (...roles: string[]) =>
      createMiddleware(async (c, next) => {
        const user = c.get('user') as { role?: string } | undefined
        if (!user?.role || !roles.includes(user.role)) {
          return fail(c, 403, 'Forbidden')
        }

        await next()
      }),
  }
})

vi.mock('../../lib/audit', () => ({ audit: vi.fn() }))
vi.mock('../../lib/cache', () => ({
  cached: cachedMock,
  invalidate: vi.fn(),
  tenantCacheKey: vi.fn(
    (prefix: string, tenantId?: string | null, ...parts: Array<string | number | null | undefined>) =>
      [prefix, tenantId ?? 'global', ...parts.map((part) => String(part ?? ''))].join(':'),
  ),
  tenantCachePattern: vi.fn(
    (prefix: string, tenantId?: string | null, suffix = '*') =>
      `${prefix}:${tenantId ?? 'global'}:${suffix}`,
  ),
}))
vi.mock('isomorphic-dompurify', () => ({
  default: () => ({
    sanitize(value: string) {
      return value
    },
  }),
}))

let appModule: Awaited<typeof import('../../app')>

beforeAll(async () => {
  appModule = await import('../../app')
})

beforeEach(() => {
  selectMock.mockReset()
  cachedMock.mockClear()
  selectMock.mockImplementation(() => ({
    from: () => ({
      where: async () => [
        {
          id: 1,
          tenantId: 'ten-1',
          name: 'Tenant Ayar',
          taxNumber: '123',
          taxOffice: 'Ikitelli',
          address: 'Adres',
          city: 'Istanbul',
          phone: '0212',
          email: 'info@example.com',
          website: 'example.com',
          logoUrl: 'https://example.com/logo.png',
          currency: 'TRY',
        },
      ],
    }),
  }))
})

describe('GET /api/settings', () => {
  it('uses a tenant-scoped cache key', async () => {
    const client = testClient(appModule.app) as any
    const response = await client.api.settings.$get(
      {},
      {
        headers: { Authorization: 'Bearer test-token' },
      },
    )

    expect(response.status).toBe(200)
    expect(cachedMock).toHaveBeenCalledWith(
      'settings:company:ten-1',
      3600,
      expect.any(Function),
    )
    const body = await response.json()
    expect(body.data?.tenantId).toBe('ten-1')
  })
})
