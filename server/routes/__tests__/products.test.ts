import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { testClient } from 'hono/testing'

const selectMock = vi.hoisted(() => vi.fn())

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

      c.set('user', { id: 'usr-1', role: 'admin' })
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
  cached: vi.fn(async (_key: string, _ttl: number, fn: () => Promise<unknown>) => fn()),
  invalidate: vi.fn(),
}))
vi.mock('isomorphic-dompurify', () => ({
  default: () => ({
    sanitize(value: string) {
      return value
    },
  }),
}))
vi.mock('../../lib/rules', () => ({
  attachProductStocks: vi.fn(async (items: Array<Record<string, unknown>>) =>
    items.map((item) => ({ ...item, totalStock: 8 })),
  ),
  getProductStock: vi.fn(async () => 8),
}))

let appModule: Awaited<typeof import('../../app')>

beforeAll(async () => {
  appModule = await import('../../app')
})

beforeEach(() => {
  selectMock.mockReset()
  selectMock
    .mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          limit: () => ({
            offset: async () => [
              {
                id: 'PRD-001',
                name: 'Demo Urun',
                sku: 'SKU-001',
                barcode: '123',
                categoryId: 'cat-1',
                brand: 'Demo',
                unit: 'Adet',
                costPrice: '80',
                salePrice: '100',
                taxRate: '20',
                reorderPoint: 3,
                status: 'active',
                description: 'test',
                createdAt: new Date('2026-06-22'),
                updatedAt: new Date('2026-06-22'),
              },
            ],
          }),
        }),
      }),
    }))
    .mockImplementationOnce(() => ({
      from: () => ({
        where: async () => [{ count: '1' }],
      }),
    }))
    .mockImplementationOnce(() => ({
      from: async () => [{ id: 'cat-1', name: 'Elektronik' }],
    }))
})

describe('GET /api/products', () => {
  it('returns 401 without a token', async () => {
    const client = testClient(appModule.app) as any
    const response = await client.api.products.$get()

    expect(response.status).toBe(401)
  })

  it('returns 200 with a valid token', async () => {
    const client = testClient(appModule.app) as any
    const response = await client.api.products.$get(
      {},
      {
        headers: { Authorization: 'Bearer test-token' },
      },
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0]?.stock).toBe(8)
  })
})
