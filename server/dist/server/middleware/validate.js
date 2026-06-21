"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const factory_1 = require("hono/factory");
function validate(schema) {
    return (0, factory_1.createMiddleware)(async (c, next) => {
        const contentType = c.req.header('content-type') ?? '';
        if (!contentType.toLocaleLowerCase().includes('application/json')) {
            return c.json({ error: 'Validation failed', details: { formErrors: ['JSON body bekleniyor'] } }, 400);
        }
        const body = await c.req.json().catch(() => null);
        if (body === null) {
            return c.json({ error: 'Validation failed', details: { formErrors: ['Gecersiz JSON gonderildi'] } }, 400);
        }
        const result = schema.safeParse(body);
        if (!result.success) {
            return c.json({ error: 'Validation failed', details: result.error.flatten() }, 400);
        }
        c.set('validatedBody', result.data);
        await next();
    });
}
