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
    ? `${prefix}-${scopeToken}-${new Date().getFullYear()}-${String(nextValue).padStart(4, '0')}`
    : `${prefix}-${new Date().getFullYear()}-${String(nextValue).padStart(4, '0')}`
}

export function nextTransactionId(ids: string[], scope?: string | null) {
  return nextSequenceId(ids, 'TRX', scope)
}

export function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error
  for (let depth = 0; current && depth < 5; depth += 1) {
    if (typeof current === 'object' && (current as { code?: string }).code === '23505') {
      return true
    }
    current = (current as { cause?: unknown }).cause
  }
  return false
}

export async function insertWithGeneratedId<T>(
  listIds: () => Promise<string[]>,
  buildId: (ids: string[]) => string,
  insert: (id: string) => Promise<T>,
  maxAttempts = 3,
): Promise<string> {
  let lastError: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const id = buildId(await listIds())
    try {
      await insert(id)
      return id
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error
      }
      lastError = error
    }
  }
  throw lastError
}
