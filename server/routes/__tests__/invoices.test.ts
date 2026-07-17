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
                id: 'FT-001',
                customer: 'Demo Musteri',
                issueDate: '2026-06-22',
                dueDate: '2026-06-25',
                status: 'draft',
                note: 'test',
                relatedQuotationId: null,
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
        where: async () => [
          {
            invoiceId: 'FT-001',
            productId: 'PRD-001',
            product: 'Demo Urun',
            quantity: '2',
            unitPrice: '100',
            taxRate: '20',
            lineOrder: 0,
          },
        ],
      }),
    }))
})

describe('GET /api/invoices', () => {
  it('returns 401 without a token', async () => {
    const client = testClient(appModule.app) as any
    const response = await client.api.invoices.$get()

    expect(response.status).toBe(401)
  })

  it('returns 200 with a valid token', async () => {
    const client = testClient(appModule.app) as any
    const response = await client.api.invoices.$get(
      {},
      {
        headers: { Authorization: 'Bearer test-token' },
      },
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0]?.id).toBe('FT-001')
  })
})
