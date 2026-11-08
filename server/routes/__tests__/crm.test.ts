import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { testClient } from 'hono/testing'

const selectMock = vi.hoisted(() => vi.fn())
const insertMock = vi.hoisted(() => vi.fn())

const dbMock = {
  select: selectMock,
  insert: insertMock,
  update: vi.fn(),
  delete: vi.fn(),
  transaction: vi.fn(),
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
  insertMock.mockImplementation(() => ({
    values: () => ({
      returning: async () => [],
    }),
  }))
})

describe('POST /api/crm/tasks', () => {
  it('generates the id on the server and returns the inserted row', async () => {
    selectMock.mockImplementation(() => ({
      from: () => ({
        where: async () => [{ id: 'TK-401' }],
      }),
    }))
    insertMock.mockImplementation(() => ({
      values: () => ({
        returning: async () => [
          {
            id: 'TK-TEN1-002',
            tenantId: 'ten-1',
            title: 'Yeni gorev',
            priority: 'medium',
            done: false,
          },
        ],
      }),
    }))

    const client = testClient(appModule.app) as any
    const response = await client.api.crm.tasks.$post(
      {
        json: {
          title: 'Yeni gorev',
          priority: 'medium',
          done: false,
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
    expect(body.data?.id).toBe('TK-TEN1-002')
    expect(body.data?.title).toBe('Yeni gorev')
  })

  it('returns 404 when updating a missing lead', async () => {
    selectMock.mockImplementation(() => ({
      from: () => ({
        where: async () => [],
      }),
    }))

    const client = testClient(appModule.app) as any
    const response = await client.api.crm.leads[':id'].$put(
      {
        param: { id: 'LD-404' },
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
    expect(await response.json()).toMatchObject({ error: 'Lead not found' })
  })

  it('returns 404 when toggling a missing task', async () => {
    selectMock.mockImplementation(() => ({
      from: () => ({
        where: async () => [],
      }),
    }))

    const client = testClient(appModule.app) as any
    const response = await client.api.crm.tasks[':id'].toggle.$patch(
      { param: { id: 'TK-404' } },
      {
        headers: { Authorization: 'Bearer test-token' },
      },
    )

    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({ error: 'Task not found' })
  })
})
