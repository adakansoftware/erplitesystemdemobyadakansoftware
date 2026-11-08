import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { testClient } from 'hono/testing'

const selectMock = vi.hoisted(() => vi.fn())
const insertMock = vi.hoisted(() => vi.fn())
const updateMock = vi.hoisted(() => vi.fn())
const transactionMock = vi.hoisted(() => vi.fn())

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
  updateMock.mockReset()
  transactionMock.mockReset()
  insertMock.mockImplementation(() => ({ values: async () => undefined }))
  updateMock.mockImplementation(() => ({ set: () => ({ where: async () => undefined }) }))
  transactionMock.mockImplementation(async (fn: (tx: typeof dbMock) => Promise<unknown>) =>
    fn(dbMock),
  )
})

describe('POST /api/quotations/:id/convert-to-invoice', () => {
  it('converts the quotation inside a transaction', async () => {
    selectMock
      .mockImplementationOnce(() => ({
        from: () => ({
          where: async () => [
            {
              id: 'TKL-001',
              tenantId: 'ten-1',
              currentAccountId: null,
              customer: 'Demo Musteri',
              date: '2026-11-01',
              validUntil: '2026-11-15',
              note: 'test',
              status: 'sent',
            },
          ],
        }),
      }))
      .mockImplementationOnce(() => ({
        from: () => ({
          where: async () => [
            {
              quotationId: 'TKL-001',
              productId: null,
              product: 'Demo Urun',
              quantity: '2',
              unitPrice: '100',
              taxRate: '20',
              lineOrder: 0,
            },
          ],
        }),
      }))
      .mockImplementation(() => ({
        from: () => ({
          where: async () => [],
        }),
      }))

    const client = testClient(appModule.app) as any
    const response = await client.api.quotations[':id']['convert-to-invoice'].$post(
      { param: { id: 'TKL-001' } },
      {
        headers: { Authorization: 'Bearer test-token' },
      },
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data?.invoiceId).toMatch(/^FT-/)
    expect(transactionMock).toHaveBeenCalledTimes(1)
    expect(insertMock).toHaveBeenCalled()
    expect(updateMock).toHaveBeenCalled()
  })

  it('returns 404 for a missing quotation', async () => {
    selectMock.mockImplementation(() => ({
      from: () => ({
        where: async () => [],
      }),
    }))

    const client = testClient(appModule.app) as any
    const response = await client.api.quotations[':id']['convert-to-invoice'].$post(
      { param: { id: 'TKL-404' } },
      {
        headers: { Authorization: 'Bearer test-token' },
      },
    )

    expect(response.status).toBe(404)
    expect(transactionMock).not.toHaveBeenCalled()
  })
})
