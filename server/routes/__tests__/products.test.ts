import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { testClient } from 'hono/testing'

const selectMock = vi.hoisted(() => vi.fn())
const insertMock = vi.hoisted(() => vi.fn())

vi.mock('../../db/client', () => ({
  db: {
    select: selectMock,
    insert: insertMock,
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
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
  cached: vi.fn(async (_key: string, _ttl: number, fn: () => Promise<unknown>) => fn()),
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
  insertMock.mockReset()
  insertMock.mockImplementation(() => ({
    values: () => ({
      returning: async () => [],
    }),
  }))
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
      from: () => ({
        where: async () => [{ id: 'cat-1', name: 'Elektronik' }],
      }),
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

describe('POST /api/products', () => {
  it('generates a sequential id on the server', async () => {
    selectMock.mockReset()
    selectMock
      .mockImplementationOnce(() => ({
        from: () => ({
          where: async () => [],
        }),
      }))
      .mockImplementationOnce(() => ({
        from: () => ({
          where: async () => [],
        }),
      }))
    insertMock.mockImplementation(() => ({
      values: () => ({
        returning: async () => [
          {
            id: 'PRD-TEN1-001',
            tenantId: 'ten-1',
            name: 'Yeni Urun',
            sku: 'SKU-NEW',
          },
        ],
      }),
    }))

    const client = testClient(appModule.app) as any
    const response = await client.api.products.$post(
      {
        json: {
          name: 'Yeni Urun',
          sku: 'SKU-NEW',
          costPrice: 10,
          salePrice: 20,
          taxRate: 20,
          reorderPoint: 0,
        },
      },
      {
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
      },
    )

    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.data?.id).toBe('PRD-TEN1-001')
    expect(body.data?.id).not.toMatch(/^PRD-\d{13}$/)
  })
})

describe('PUT /api/products/:id', () => {
  it('returns 404 for a missing product', async () => {
    selectMock.mockReset()
    selectMock
      .mockImplementationOnce(() => ({
        from: () => ({
          where: async () => [],
        }),
      }))
      .mockImplementationOnce(() => ({
        from: () => ({
          where: async () => [],
        }),
      }))

    const client = testClient(appModule.app) as any
    const response = await client.api.products[':id'].$put(
      {
        param: { id: 'PRD-404' },
        json: { name: 'Yok' },
      },
      {
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
      },
    )

    expect(response.status).toBe(404)
  })
})

describe('DELETE /api/products/:id', () => {
  it('returns 404 for a missing product', async () => {
    selectMock.mockReset()
    selectMock.mockImplementation(() => ({
      from: () => ({
        where: async () => [],
      }),
    }))

    const client = testClient(appModule.app) as any
    const response = await client.api.products[':id'].$delete(
      { param: { id: 'PRD-404' } },
      {
        headers: { Authorization: 'Bearer test-token' },
      },
    )

    expect(response.status).toBe(404)
  })
})
