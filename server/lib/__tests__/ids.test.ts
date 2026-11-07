import { describe, expect, it } from 'vitest'
import {
  insertWithGeneratedId,
  isUniqueViolation,
  nextDocumentId,
  nextTransactionId,
} from '../ids'

describe('id generators', () => {
  it('creates tenant-scoped document ids without colliding globally', () => {
    const year = new Date().getFullYear()
    const ids = ['FT-AAAAAAAA-2024-0001', 'FT-AAAAAAAA-2024-0002', 'FT-2024-0009']

    expect(nextDocumentId(ids, 'FT', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')).toBe(
      `FT-AAAAAAAA-${year}-0010`,
    )
  })

  it('creates tenant-scoped transaction ids from the last numeric segment', () => {
    const ids = ['TRX-12345678-001', 'TRX-12345678-002', 'TRX-099']

    expect(nextTransactionId(ids, '12345678-9999-8888-7777-666666666666')).toBe('TRX-12345678-100')
  })
})

describe('isUniqueViolation', () => {
  it('detects a direct 23505 error code', () => {
    expect(isUniqueViolation({ code: '23505' })).toBe(true)
  })

  it('detects a 23505 code nested in a cause chain', () => {
    expect(isUniqueViolation(new Error('wrapped', { cause: { code: '23505' } }))).toBe(true)
  })

  it('rejects other errors', () => {
    expect(isUniqueViolation(new Error('boom'))).toBe(false)
    expect(isUniqueViolation({ code: '23503' })).toBe(false)
    expect(isUniqueViolation(undefined)).toBe(false)
  })
})

describe('insertWithGeneratedId', () => {
  it('inserts on the first attempt and returns the generated id', async () => {
    const inserted: string[] = []
    const id = await insertWithGeneratedId(
      async () => ['FT-2026-0001'],
      (ids) => `FT-2026-${String(ids.length + 1).padStart(4, '0')}`,
      async (nextId) => inserted.push(nextId),
    )

    expect(id).toBe('FT-2026-0002')
    expect(inserted).toEqual(['FT-2026-0002'])
  })

  it('retries with a fresh id list on unique violations', async () => {
    let attempts = 0
    const id = await insertWithGeneratedId(
      async () => (attempts === 0 ? ['TRX-001'] : ['TRX-001', 'TRX-002']),
      (ids) => `TRX-${String(ids.length + 1).padStart(3, '0')}`,
      async (nextId) => {
        attempts += 1
        if (attempts === 1) {
          throw new Error('insert failed', { cause: { code: '23505' } })
        }
        return nextId
      },
    )

    expect(attempts).toBe(2)
    expect(id).toBe('TRX-003')
  })

  it('rethrows non-violation errors immediately', async () => {
    await expect(
      insertWithGeneratedId(
        async () => [],
        () => 'TRX-001',
        async () => {
          throw new Error('boom')
        },
      ),
    ).rejects.toThrow('boom')
  })

  it('gives up after max attempts', async () => {
    await expect(
      insertWithGeneratedId(
        async () => [],
        () => 'TRX-001',
        async () => {
          throw new Error('insert failed', { cause: { code: '23505' } })
        },
        2,
      ),
    ).rejects.toThrow('insert failed')
  })
})
