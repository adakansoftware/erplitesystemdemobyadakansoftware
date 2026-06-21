import { describe, expect, it, vi } from 'vitest'

vi.mock('isomorphic-dompurify', () => ({
  default: () => ({
    sanitize(value: string) {
      return value
        .replace(/<script.*?>.*?<\/script>/gi, '')
        .replace(/\son\w+="[^"]*"/gi, '')
        .replace(/\son\w+='[^']*'/gi, '')
        .replace(/\son\w+=([^\s>]+)/gi, '')
    },
  }),
}))

import { sanitizeValue } from '../../middleware/sanitize'

describe('sanitizeValue', () => {
  it('sanitizes script tags in nested values', () => {
    const result = sanitizeValue({
      note: '<script>alert(1)</script><b>safe</b>',
      items: ['<img src=x onerror=alert(1)>'],
    }) as { note: string; items: string[] }

    expect(result.note).not.toContain('<script>')
    expect(result.items[0]).not.toContain('onerror')
  })
})
