"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextSequenceId = nextSequenceId;
exports.nextDocumentId = nextDocumentId;
exports.nextTransactionId = nextTransactionId;
function nextSequenceId(ids, prefix) {
    const nextValue = ids
        .map((id) => Number(id.replace(`${prefix}-`, '')))
        .filter((value) => Number.isFinite(value))
        .reduce((max, value) => Math.max(max, value), 0) + 1;
    return `${prefix}-${String(nextValue).padStart(3, '0')}`;
}
function nextDocumentId(ids, prefix) {
    const nextValue = ids
        .map((id) => Number(id.split('-').at(-1)))
        .filter((value) => Number.isFinite(value))
        .reduce((max, value) => Math.max(max, value), 0) + 1;
    return `${prefix}-2024-${String(nextValue).padStart(4, '0')}`;
}
function nextTransactionId(ids) {
    return nextSequenceId(ids, 'TRX');
}
