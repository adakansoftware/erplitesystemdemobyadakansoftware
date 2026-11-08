import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { testClient } from 'hono/testing'

const selectMock = vi.hoisted(() => vi.fn())
const insertMock = vi.hoisted(() => vi.fn())
const transactionMock = vi.hoisted(() => vi.fn())
const ensureStockAvailableMock = vi.hoisted(() => vi.fn())

const dbMock = {
  select: selectMock,
  insert: insertMock,
  update: vi.fn(),
  delete: vi.fn(),
  transaction: transactionMock,
}

vi.mock('../../db/client', () => ({ db: dbMock }))

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
  tenantCachePattern: vi.fn(
    (prefix: string, tenantId?: string | null, suffix = '*') =>
      `${prefix}:${tenantId ?? 'global'}:${suffix}`,
  ),
}))
vi.mock('../../lib/event-bus', () => ({ eventBus: { emit: vi.fn() } }))
vi.mock('../../lib/rules', () => ({
  ensureStockAvailable: ensureStockAvailableMock,
  createStockOutForInvoice: vi.fn(),
  createInvoicePaymentTransaction: vi.fn(async () => 0),
  getProductStock: vi.fn(async () => 0),
  attachProductStocks: vi.fn(async (items: Array<Record<string, unknown>>) => items),
}))
vi.mock('isomorphic-dompurify', () => ({
  default: {
    sanitize(value: string) {
      return value
    },
  },
}))

let appModule: Awaited<typeof import('../../app')>

beforeAll(async () => {
  appModule = await import('../../app')
})

beforeEach(() => {
  selectMock.mockReset()
  insertMock.mockReset()
  transactionMock.mockReset()
  ensureStockAvailableMock.mockReset()
  insertMock.mockImplementation(() => ({ values: async () => undefined }))
  transactionMock.mockImplementation(async (fn: (tx: typeof dbMock) => Promise<unknown>) =>
    fn(dbMock),
  )
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

describe('POST /api/invoices', () => {
  it('returns 422 when stock is insufficient', async () => {
    ensureStockAvailableMock.mockResolvedValue({
      ok: false,
      productId: 'PRD-001',
      available: 0,
    })
    const client = testClient(appModule.app) as any
    const response = await client.api.invoices.$post(
      {
        json: {
          customer: 'Demo Musteri',
          issueDate: '2026-11-08',
          dueDate: '2026-11-15',
          lines: [{ product: 'Demo Urun', quantity: 2, unitPrice: 100 }],
        },
      },
      {
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
      },
    )

    expect(response.status).toBe(422)
    expect(transactionMock).not.toHaveBeenCalled()
  })

  it('creates an invoice inside a transaction', async () => {
    ensureStockAvailableMock.mockResolvedValue({ ok: true })
    selectMock.mockReset()
    selectMock.mockImplementation(() => ({
      from: () => ({
        where: async () => [],
      }),
    }))
    const client = testClient(appModule.app) as any
    const response = await client.api.invoices.$post(
      {
        json: {
          customer: 'Demo Musteri',
          issueDate: '2026-11-08',
          dueDate: '2026-11-15',
          lines: [{ product: 'Demo Urun', quantity: 2, unitPrice: 100 }],
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
    expect(body.data?.id).toMatch(/^FT-/)
    expect(transactionMock).toHaveBeenCalledTimes(1)
    expect(insertMock).toHaveBeenCalled()
  })
})

describe('PUT /api/invoices/:id/status', () => {
  it('returns 400 for an invalid status', async () => {
    const client = testClient(appModule.app) as any
    const response = await client.api.invoices[':id'].status.$put(
      {
        param: { id: 'FT-001' },
        json: { status: 'nonsense' },
      },
      {
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
      },
    )

    expect(response.status).toBe(400)
  })
})
