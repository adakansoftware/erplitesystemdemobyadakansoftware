"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockRoutes = void 0;
const hono_1 = require("hono");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const client_1 = require("../db/client");
const schema_1 = require("../db/schema");
const rules_1 = require("../lib/rules");
const http_1 = require("../lib/http");
const validate_1 = require("../middleware/validate");
const movementSchema = zod_1.z.object({
    productId: zod_1.z.string(),
    warehouseId: zod_1.z.string().optional().nullable(),
    type: zod_1.z.enum(['in', 'out', 'transfer', 'adjustment']),
    qty: zod_1.z.coerce.number().positive(),
    note: zod_1.z.string().optional().nullable(),
    unitCost: zod_1.z.coerce.number().optional(),
});
const warehouseSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    name: zod_1.z.string().min(2),
    location: zod_1.z.string().optional().nullable(),
    manager: zod_1.z.string().optional().nullable(),
    capacity: zod_1.z.coerce.number().optional(),
});
exports.stockRoutes = new hono_1.Hono();
exports.stockRoutes.get('/movements', async (c) => {
    const productId = c.req.query('productId');
    const warehouseId = c.req.query('warehouseId');
    const type = c.req.query('type');
    const filters = [
        productId ? (0, drizzle_orm_1.eq)(schema_1.stockMovements.productId, productId) : undefined,
        warehouseId ? (0, drizzle_orm_1.eq)(schema_1.stockMovements.warehouseId, warehouseId) : undefined,
        type ? (0, drizzle_orm_1.eq)(schema_1.stockMovements.type, type) : undefined,
    ].filter(Boolean);
    const result = await client_1.db
        .select()
        .from(schema_1.stockMovements)
        .where(filters.length ? (0, drizzle_orm_1.and)(...filters) : undefined);
    return (0, http_1.ok)(c, result);
});
exports.stockRoutes.post('/movements', (0, validate_1.validate)(movementSchema), async (c) => {
    const body = c.get('validatedBody');
    if (body.type === 'out') {
        const currentStock = await (0, rules_1.getProductStock)(body.productId);
        if (currentStock < body.qty) {
            return (0, http_1.fail)(c, 422, 'Insufficient stock');
        }
    }
    await client_1.db.insert(schema_1.stockMovements).values({
        productId: body.productId,
        warehouseId: body.warehouseId ?? 'WH-01',
        type: body.type,
        qty: String(body.qty),
        note: body.note,
        unitCost: body.unitCost != null ? String(body.unitCost) : undefined,
    });
    const [movement] = await client_1.db
        .select()
        .from(schema_1.stockMovements)
        .orderBy((0, drizzle_orm_1.sql) `${schema_1.stockMovements.createdAt} desc`)
        .limit(1);
    return (0, http_1.created)(c, movement);
});
exports.stockRoutes.get('/summary', async (c) => {
    const items = await client_1.db.select().from(schema_1.products);
    const summary = await Promise.all(items.map(async (item) => ({
        ...item,
        totalStock: await (0, rules_1.getProductStock)(item.id),
    })));
    return (0, http_1.ok)(c, summary);
});
exports.stockRoutes.get('/warehouses', async (c) => {
    return (0, http_1.ok)(c, await client_1.db.select().from(schema_1.warehouses));
});
exports.stockRoutes.post('/warehouses', (0, validate_1.validate)(warehouseSchema), async (c) => {
    const body = c.get('validatedBody');
    await client_1.db.insert(schema_1.warehouses).values({
        id: body.id ?? `WH-${Date.now()}`,
        name: body.name,
        location: body.location,
        manager: body.manager,
        capacity: body.capacity,
    });
    return (0, http_1.created)(c, body);
});
