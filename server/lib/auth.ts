import { pbkdf2, randomBytes, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { SignJWT, jwtVerify } from 'jose'

const encoder = new TextEncoder()

function secret() {
  const value = process.env.JWT_SECRET
  if (!value) {
    throw new Error('JWT_SECRET is not defined')
  }
  return encoder.encode(value)
}

export async function signAccessToken(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secret())
}

export async function verifyToken(token: string) {
  const result = await jwtVerify(token, secret())
  return result.payload
}

export function createRefreshToken() {
  return randomBytes(48).toString('hex')
}

const pbkdf2Async = promisify(pbkdf2)

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = await pbkdf2Async(password, salt, 100000, 64, 'sha512')
  return `${salt}:${hash.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) {
    return false
  }

  const nextHash = await pbkdf2Async(password, salt, 100000, 64, 'sha512')
  const storedHash = Buffer.from(hash, 'hex')
  if (storedHash.length !== nextHash.length) {
    return false
  }

  return timingSafeEqual(nextHash, storedHash)
}
