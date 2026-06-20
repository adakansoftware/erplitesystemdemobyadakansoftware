"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
exports.requireRole = requireRole;
const cookie_1 = require("hono/cookie");
const factory_1 = require("hono/factory");
const http_1 = require("../lib/http");
const auth_1 = require("../lib/auth");
exports.authMiddleware = (0, factory_1.createMiddleware)(async (c, next) => {
    const token = c.req.header('Authorization')?.replace('Bearer ', '') ??
        (0, cookie_1.getCookie)(c, 'erp_token');
    if (!token) {
        return (0, http_1.fail)(c, 401, 'Unauthorized');
    }
    try {
        const payload = await (0, auth_1.verifyToken)(token);
        c.set('user', {
            id: typeof payload.id === 'string' ? payload.id : undefined,
            name: typeof payload.name === 'string' ? payload.name : undefined,
            email: typeof payload.email === 'string' ? payload.email : undefined,
            role: typeof payload.role === 'string' ? payload.role : undefined,
        });
        await next();
    }
    catch {
        return (0, http_1.fail)(c, 401, 'Invalid token');
    }
});
function requireRole(...roles) {
    return (0, factory_1.createMiddleware)(async (c, next) => {
        const user = c.get('user');
        if (!user?.role || !roles.includes(user.role)) {
            return (0, http_1.fail)(c, 403, 'Forbidden');
        }
        await next();
    });
}
