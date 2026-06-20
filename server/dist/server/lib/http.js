"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ok = ok;
exports.created = created;
exports.fail = fail;
function ok(c, data, meta) {
    return c.json(meta ? { data, meta } : { data }, 200);
}
function created(c, data) {
    return c.json({ data }, 201);
}
function fail(c, status, error, details) {
    return c.json(details ? { error, details } : { error }, status);
}
