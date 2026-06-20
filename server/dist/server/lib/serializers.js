"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toNumber = toNumber;
exports.withTimestamps = withTimestamps;
function toNumber(value) {
    if (typeof value === 'number')
        return value;
    if (value == null)
        return 0;
    return Number(value);
}
function withTimestamps(item) {
    return {
        ...item,
        createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
        updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
    };
}
