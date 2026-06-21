"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.purchaseOrdersRoutes = void 0;
const hono_1 = require("hono");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const client_1 = require("../db/client");
const schema_1 = require("../db/schema");
const ids_1 = require("../lib/ids");
const rules_1 = require("../lib/rules");
const http_1 = require("../lib/http");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const lineSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    productId: zod_1.z.string().optional().nullable(),
    product: zod_1.z.string(),
    quantity: zod_1.z.coerce.number(),
    unitPrice: zod_1.z.coerce.number(),
    taxRate: zod_1.z.coerce.number().default(20),
    receivedQty: zod_1.z.coerce.number().optional(),
});
const purchaseSchema = zod_1.z.object({
    currentAccountId: zod_1.z.string().optional().nullable(),
    supplier: zod_1.z.string(),
    orderDate: zod_1.z.string(),
    expectedDate: zod_1.z.string().optional().nullable(),
    status: zod_1.z.string().default('draft'),
    note: zod_1.z.string().optional().nullable(),
    warehouseId: zod_1.z.string().optional().nullable(),
    lines: zod_1.z.array(lineSchema).min(1),
});
exports.purchaseOrdersRoutes = new hono_1.Hono();
exports.purchaseOrdersRoutes.get('/', async (c) => {
    const status = c.req.query('status');
    const search = c.req.query('search');
    const page = Math.max(1, Number(c.req.query('page') ?? 1));
    const limit = Math.min(100, Number(c.req.query('limit') ?? 50));
    const offset = (page - 1) * limit;
    const filters = [
        status ? (0, drizzle_orm_1.eq)(schema_1.purchaseOrders.status, status) : undefined,
        search ? (0, drizzle_orm_1.ilike)(schema_1.purchaseOrders.supplier, `%${search}%`) : undefined,
    ].filter(Boolean);
    const [items, lines, countResult] = await Promise.all([
        client_1.db
            .select()
            .from(schema_1.purchaseOrders)
            .where(filters.length ? (0, drizzle_orm_1.and)(...filters) : undefined)
            .limit(limit)
            .offset(offset),
        client_1.db.select().from(schema_1.purchaseOrderLines),
        client_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.purchaseOrders)
            .where(filters.length ? (0, drizzle_orm_1.and)(...filters) : undefined),
    ]);
    const total = Number(countResult[0]?.count ?? 0);
    return (0, http_1.ok)(c, items.map((item) => ({
        ...item,
        lines: lines
            .filter((line) => line.purchaseOrderId === item.id)
            .sort((a, b) => a.lineOrder - b.lineOrder)
            .map((line) => ({
            id: line.id,
            productId: line.productId,
            product: line.product,
            qty: Number(line.quantity),
            unitPrice: Number(line.unitPrice),
            taxRate: Number(line.taxRate),
            receivedQty: Number(line.receivedQty ?? 0),
        })),
    })), { total, page, limit, pages: Math.ceil(total / limit) });
});
exports.purchaseOrdersRoutes.get('/:id', async (c) => {
    const id = c.req.param('id');
    const [purchase] = await client_1.db.select().from(schema_1.purchaseOrders).where((0, drizzle_orm_1.eq)(schema_1.purchaseOrders.id, id));
    if (!purchase)
        return (0, http_1.fail)(c, 404, 'Purchase order not found');
    const lines = await client_1.db.select().from(schema_1.purchaseOrderLines).where((0, drizzle_orm_1.eq)(schema_1.purchaseOrderLines.purchaseOrderId, id));
    return (0, http_1.ok)(c, {
        ...purchase,
        lines: lines
            .sort((a, b) => a.lineOrder - b.lineOrder)
            .map((line) => ({
            id: line.id,
            productId: line.productId,
            product: line.product,
            qty: Number(line.quantity),
            unitPrice: Number(line.unitPrice),
            taxRate: Number(line.taxRate),
            receivedQty: Number(line.receivedQty ?? 0),
        })),
    });
});
exports.purchaseOrdersRoutes.post('/', (0, validate_1.validate)(purchaseSchema), async (c) => {
    const body = c.get('validatedBody');
    const ids = await client_1.db.select({ id: schema_1.purchaseOrders.id }).from(schema_1.purchaseOrders);
    const id = (0, ids_1.nextDocumentId)(ids.map((item) => item.id), 'SPA');
    await client_1.db.insert(schema_1.purchaseOrders).values({
        id,
        currentAccountId: body.currentAccountId,
        supplier: body.supplier,
        orderDate: body.orderDate,
        expectedDate: body.expectedDate,
        status: body.status,
        note: body.note,
        warehouseId: body.warehouseId,
    });
    await client_1.db.insert(schema_1.purchaseOrderLines).values(body.lines.map((line, index) => ({
        purchaseOrderId: id,
        productId: line.productId,
        product: line.product,
        quantity: String(line.quantity),
        unitPrice: String(line.unitPrice),
        taxRate: String(line.taxRate),
        receivedQty: String(line.receivedQty ?? 0),
        lineOrder: index,
    })));
    return (0, http_1.created)(c, { id });
});
exports.purchaseOrdersRoutes.put('/:id/status', (0, auth_1.requireRole)('admin', 'manager'), (0, validate_1.validate)(zod_1.z.object({ status: zod_1.z.string() })), async (c) => {
    const id = c.req.param('id');
    const body = c.get('validatedBody');
    await client_1.db
        .update(schema_1.purchaseOrders)
        .set({ status: body.status, updatedAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_1.purchaseOrders.id, id));
    return (0, http_1.ok)(c, { id, status: body.status });
});
exports.purchaseOrdersRoutes.post('/:id/receive', (0, validate_1.validate)(zod_1.z.object({
    lines: zod_1.z.array(zod_1.z.object({ lineId: zod_1.z.string(), receivedQty: zod_1.z.coerce.number() })),
})), async (c) => {
    const id = c.req.param('id');
    const body = c.get('validatedBody');
    const existingLines = await client_1.db
        .select()
        .from(schema_1.purchaseOrderLines)
        .where((0, drizzle_orm_1.eq)(schema_1.purchaseOrderLines.purchaseOrderId, id));
    for (const line of body.lines) {
        await client_1.db
            .update(schema_1.purchaseOrderLines)
            .set({ receivedQty: String(line.receivedQty) })
            .where((0, drizzle_orm_1.eq)(schema_1.purchaseOrderLines.id, line.lineId));
    }
    const fullyReceived = existingLines.every((line) => {
        const payload = body.lines.find((item) => item.lineId === line.id);
        return payload && payload.receivedQty >= Number(line.quantity);
    });
    await client_1.db
        .update(schema_1.purchaseOrders)
        .set({ status: fullyReceived ? 'received' : 'partial', updatedAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_1.purchaseOrders.id, id));
    await (0, rules_1.createStockInForPurchaseOrder)(id);
    return (0, http_1.ok)(c, { id, status: fullyReceived ? 'received' : 'partial' });
});
