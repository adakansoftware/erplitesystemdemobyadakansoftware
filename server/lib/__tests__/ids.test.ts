import { describe, expect, it } from 'vitest'
import { nextDocumentId, nextTransactionId } from '../ids'

describe('id generators', () => {
  it('creates tenant-scoped document ids without colliding globally', () => {
    const ids = ['FT-AAAAAAAA-2024-0001', 'FT-AAAAAAAA-2024-0002', 'FT-2024-0009']

    expect(nextDocumentId(ids, 'FT', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')).toBe('FT-AAAAAAAA-2024-0010')
  })

  it('creates tenant-scoped transaction ids from the last numeric segment', () => {
    const ids = ['TRX-12345678-001', 'TRX-12345678-002', 'TRX-099']

    expect(nextTransactionId(ids, '12345678-9999-8888-7777-666666666666')).toBe('TRX-12345678-100')
  })
})
