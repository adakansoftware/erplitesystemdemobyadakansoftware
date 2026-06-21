import createDOMPurify from 'isomorphic-dompurify'

const DOMPurify = createDOMPurify()

export function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') return DOMPurify.sanitize(value)
  if (Array.isArray(value)) return value.map(sanitizeValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, sanitizeValue(entry)]),
    )
  }
  return value
}
