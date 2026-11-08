import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { testClient } from 'hono/testing'

const selectMock = vi.hoisted(() => vi.fn())
const insertMock = vi.hoisted(() => vi.fn())
const updateMock = vi.hoisted(() => vi.fn())
const transactionMock = vi.hoisted(() => vi.fn())
const createStockInMock = vi.hoisted(() => vi.fn())

const dbMock = {
  select: selectMock,
  insert: insertMock,
  update: updateMock,
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
  createStockInForPurchaseOrder: createStockInMock,
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
  updateMock.mockReset()
  transactionMock.mockReset()
  createStockInMock.mockReset()
  updateMock.mockImplementation(() => ({ set: () => ({ where: async () => undefined }) }))
  transactionMock.mockImplementation(async (fn: (tx: typeof dbMock) => Promise<unknown>) =>
    fn(dbMock),
  )
})

describe('POST /api/purchase-orders/:id/receive', () => {
  it('receives lines and creates stock movements inside a transaction', async () => {
    selectMock
      .mockImplementationOnce(() => ({
        from: () => ({
          where: async () => [
            {
              id: 'SPA-001',
              tenantId: 'ten-1',
              supplier: 'Demo Tedarikci',
              warehouseId: 'WH-01',
              status: 'sent',
            },
          ],
        }),
      }))
      .mockImplementationOnce(() => ({
        from: () => ({
          where: async () => [
            {
              id: 'PL-1',
              purchaseOrderId: 'SPA-001',
              productId: 'PRD-001',
              product: 'Demo Urun',
              quantity: '10',
              unitPrice: '5',
              taxRate: '20',
              receivedQty: '0',
              lineOrder: 0,
            },
          ],
        }),
      }))

    const client = testClient(appModule.app) as any
    const response = await client.api['purchase-orders'][':id'].receive.$post(
      {
        param: { id: 'SPA-001' },
        json: { lines: [{ lineId: 'PL-1', receivedQty: 10 }] },
      },
      {
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
      },
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data?.status).toBe('received')
    expect(transactionMock).toHaveBeenCalledTimes(1)
    expect(createStockInMock).toHaveBeenCalledWith('SPA-001', 'usr-1', dbMock)
  })

  it('returns 404 for a missing purchase order', async () => {
    selectMock.mockImplementation(() => ({
      from: () => ({
        where: async () => [],
      }),
    }))

    const client = testClient(appModule.app) as any
    const response = await client.api['purchase-orders'][':id'].receive.$post(
      {
        param: { id: 'SPA-404' },
        json: { lines: [] },
      },
      {
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
      },
    )

    expect(response.status).toBe(404)
    expect(transactionMock).not.toHaveBeenCalled()
  })
})
