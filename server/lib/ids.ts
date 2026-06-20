export function nextSequenceId(ids: string[], prefix: string) {
  const nextValue =
    ids
      .map((id) => Number(id.replace(`${prefix}-`, '')))
      .filter((value) => Number.isFinite(value))
      .reduce((max, value) => Math.max(max, value), 0) + 1

  return `${prefix}-${String(nextValue).padStart(3, '0')}`
}

export function nextDocumentId(ids: string[], prefix: string) {
  const nextValue =
    ids
      .map((id) => Number(id.split('-').at(-1)))
      .filter((value) => Number.isFinite(value))
      .reduce((max, value) => Math.max(max, value), 0) + 1

  return `${prefix}-2024-${String(nextValue).padStart(4, '0')}`
}

export function nextTransactionId(ids: string[]) {
  return nextSequenceId(ids, 'TRX')
}
