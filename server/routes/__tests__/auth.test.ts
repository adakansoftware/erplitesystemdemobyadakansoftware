import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { testClient } from 'hono/testing'
import { hashPassword } from '../../lib/auth'

const selectWhereMock = vi.hoisted(() => vi.fn())
const insertValuesMock = vi.hoisted(() => vi.fn())
const updateWhereMock = vi.hoisted(() => vi.fn())

vi.mock('../../db/client', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: selectWhereMock,
      })),
    })),
    insert: vi.fn(() => ({
      values: insertValuesMock,
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: updateWhereMock,
      })),
    })),
    delete: vi.fn(),
  },
}))

vi.mock('../../lib/audit', () => ({ audit: vi.fn() }))
vi.mock('isomorphic-dompurify', () => ({
  default: () => ({
    sanitize(value: string) {
      return value
    },
  }),
}))

let appModule: Awaited<typeof import('../../app')>

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret'
  appModule = await import('../../app')
})

beforeEach(() => {
  const passwordHash = hashPassword('demo123')

  selectWhereMock.mockReset()
  insertValuesMock.mockReset()
  updateWhereMock.mockReset()

  selectWhereMock
    .mockResolvedValueOnce([
      {
        id: 'usr-1',
        tenantId: 'ten-1',
        name: 'Demo Admin',
        email: 'admin@demo.com',
        role: 'admin',
        active: true,
        passwordHash,
      },
    ])
    .mockResolvedValueOnce([
      {
        id: 'rt-1',
        userId: 'usr-1',
        token: 'refresh-token-1',
        revoked: false,
        expiresAt: new Date(Date.now() + 60_000),
      },
    ])
    .mockResolvedValueOnce([
      {
        id: 'usr-1',
        tenantId: 'ten-1',
        name: 'Demo Admin',
        email: 'admin@demo.com',
        role: 'admin',
        active: true,
        passwordHash,
      },
    ])

  insertValuesMock.mockResolvedValue([])
  updateWhereMock.mockResolvedValue([])
})

describe('auth routes', () => {
  it('supports login, refresh, and logout', async () => {
    const client = testClient(appModule.app) as any

    const loginResponse = await client.api.auth.login.$post({
      json: { email: 'admin@demo.com', password: 'demo123' },
    })

    expect(loginResponse.status).toBe(200)
    const loginBody = await loginResponse.json()
    expect(loginBody.data.user.email).toBe('admin@demo.com')
    expect(loginBody.data.token).toBeTypeOf('string')

    const refreshResponse = await client.api.auth.refresh.$post(
      {},
      {
        headers: { 'x-refresh-token': 'refresh-token-1' },
      },
    )

    expect(refreshResponse.status).toBe(200)
    const refreshBody = await refreshResponse.json()
    expect(refreshBody.data.token).toBeTypeOf('string')

    const logoutResponse = await client.api.auth.logout.$post(
      {},
      {
        headers: {
          'x-refresh-token': 'refresh-token-1',
          Cookie: `erp_token=${loginBody.data.token}`,
        },
      },
    )

    expect(logoutResponse.status).toBe(200)
    expect(updateWhereMock).toHaveBeenCalled()
  })
})
