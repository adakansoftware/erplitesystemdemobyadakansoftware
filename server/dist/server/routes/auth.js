"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const hono_1 = require("hono");
const cookie_1 = require("hono/cookie");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const client_1 = require("../db/client");
const schema_1 = require("../db/schema");
const auth_1 = require("../lib/auth");
const http_1 = require("../lib/http");
const auth_2 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.authRoutes = new hono_1.Hono();
exports.authRoutes.post('/login', (0, validate_1.validate)(loginSchema), async (c) => {
    const body = c.get('validatedBody');
    const [user] = await client_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, body.email));
    if (!user || !(0, auth_1.verifyPassword)(body.password, user.passwordHash)) {
        return (0, http_1.fail)(c, 401, 'Invalid email or password');
    }
    const token = await (0, auth_1.signToken)({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    });
    (0, cookie_1.setCookie)(c, 'erp_token', token, {
        httpOnly: true,
        sameSite: 'Lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 8,
        path: '/',
    });
    return (0, http_1.ok)(c, {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    });
});
exports.authRoutes.post('/logout', async (c) => {
    (0, cookie_1.deleteCookie)(c, 'erp_token', { path: '/' });
    return (0, http_1.ok)(c, { success: true });
});
exports.authRoutes.get('/me', auth_2.authMiddleware, async (c) => {
    const user = c.get('user');
    return (0, http_1.ok)(c, user);
});
