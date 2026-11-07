import { describe, expect, it } from 'vitest'
import {
  createRefreshToken,
  hashPassword,
  signAccessToken,
  verifyPassword,
  verifyToken,
} from '../auth'

describe('auth helpers', () => {
  it('hashes and verifies passwords', async () => {
    const hash = await hashPassword('test123')
    expect(await verifyPassword('test123', hash)).toBe(true)
    expect(await verifyPassword('wrong', hash)).toBe(false)
  })

  it('creates and verifies access tokens', async () => {
    process.env.JWT_SECRET = 'test-secret'
    const token = await signAccessToken({ id: '1', email: 'a@b.com', role: 'admin' })
    const payload = await verifyToken(token)
    expect(payload.email).toBe('a@b.com')
  })

  it('creates random refresh tokens', () => {
    expect(createRefreshToken()).not.toBe(createRefreshToken())
  })
})
