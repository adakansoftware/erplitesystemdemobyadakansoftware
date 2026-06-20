export function toNumber(value: string | number | null | undefined) {
  if (typeof value === 'number') return value
  if (value == null) return 0
  return Number(value)
}

export function withTimestamps<T extends Record<string, unknown>>(item: T) {
  return {
    ...item,
    createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
    updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
  }
}
