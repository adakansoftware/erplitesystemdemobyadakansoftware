function normalizeScope(scope?: string | null) {
  if (!scope) {
    return null
  }

  const normalized = scope.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()
  return normalized || null
}

export function nextSequenceId(ids: string[], prefix: string, scope?: string | null) {
  const nextValue =
    ids
      .map((id) => Number(id.split('-').at(-1)))
      .filter((value) => Number.isFinite(value))
      .reduce((max, value) => Math.max(max, value), 0) + 1

  const scopeToken = normalizeScope(scope)
  return scopeToken
    ? `${prefix}-${scopeToken}-${String(nextValue).padStart(3, '0')}`
    : `${prefix}-${String(nextValue).padStart(3, '0')}`
}

export function nextDocumentId(ids: string[], prefix: string, scope?: string | null) {
  const nextValue =
    ids
      .map((id) => Number(id.split('-').at(-1)))
      .filter((value) => Number.isFinite(value))
      .reduce((max, value) => Math.max(max, value), 0) + 1

  const scopeToken = normalizeScope(scope)
  return scopeToken
    ? `${prefix}-${scopeToken}-2024-${String(nextValue).padStart(4, '0')}`
    : `${prefix}-2024-${String(nextValue).padStart(4, '0')}`
}

export function nextTransactionId(ids: string[], scope?: string | null) {
  return nextSequenceId(ids, 'TRX', scope)
}
