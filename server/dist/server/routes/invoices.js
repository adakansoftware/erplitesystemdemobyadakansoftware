"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoicesRoutes = void 0;
const hono_1 = require("hono");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const client_1 = require("../db/client");
const schema_1 = require("../db/schema");
const ids_1 = require("../lib/ids");
const rules_1 = require("../lib/rules");
const http_1 = require("../lib/http");
const validate_1 = require("../middleware/validate");
const lineSchema = zod_1.z.object({
    productId: zod_1.z.string().optional().nullable(),
    product: zod_1.z.string(),
    quantity: zod_1.z.coerce.number(),
    unitPrice: zod_1.z.coerce.number(),
    taxRate: zod_1.z.coerce.number().default(20),
});
const invoiceSchema = zod_1.z.object({
    currentAccountId: zod_1.z.string().optional().nullable(),
    customer: zod_1.z.string(),
    issueDate: zod_1.z.string(),
    dueDate: zod_1.z.string(),
    note: zod_1.z.string().optional().nullable(),
    status: zod_1.z.string().default('draft'),
    relatedQuotationId: zod_1.z.string().optional().nullable(),
    lines: zod_1.z.array(lineSchema).min(1),
});
exports.invoicesRoutes = new hono_1.Hono();
exports.invoicesRoutes.get('/', async (c) => {
    const status = c.req.query('status');
    const search = c.req.query('search');
    const filters = [
        status ? (0, drizzle_orm_1.eq)(schema_1.invoices.status, status) : undefined,
        search ? (0, drizzle_orm_1.ilike)(schema_1.invoices.customer, `%${search}%`) : undefined,
    ].filter(Boolean);
    const items = await client_1.db
        .select()
        .from(schema_1.invoices)
        .where(filters.length ? (0, drizzle_orm_1.and)(...filters) : undefined);
    const lines = await client_1.db.select().from(schema_1.invoiceLines);
    const now = new Date().toISOString().slice(0, 10);
    const normalized = items.map((item) => ({
        ...item,
        status: item.status === 'sent' && item.dueDate < now ? 'overdue' : item.status,
        relatedQuotation: item.relatedQuotationId,
        lines: lines
            .filter((line) => line.invoiceId === item.id)
            .sort((a, b) => a.lineOrder - b.lineOrder)
            .map((line) => ({
            productId: line.productId,
            product: line.product,
            quantity: Number(line.quantity),
            unitPrice: Number(line.unitPrice),
            taxRate: Number(line.taxRate),
        })),
    }));
    return (0, http_1.ok)(c, normalized);
});
exports.invoicesRoutes.get('/:id', async (c) => {
    const id = c.req.param('id');
    const [invoice] = await client_1.db.select().from(schema_1.invoices).where((0, drizzle_orm_1.eq)(schema_1.invoices.id, id));
    if (!invoice)
        return (0, http_1.fail)(c, 404, 'Invoice not found');
    const lines = await client_1.db.select().from(schema_1.invoiceLines).where((0, drizzle_orm_1.eq)(schema_1.invoiceLines.invoiceId, id));
    return (0, http_1.ok)(c, {
        ...invoice,
        relatedQuotation: invoice.relatedQuotationId,
        lines: lines
            .sort((a, b) => a.lineOrder - b.lineOrder)
            .map((line) => ({
            productId: line.productId,
            product: line.product,
            quantity: Number(line.quantity),
            unitPrice: Number(line.unitPrice),
            taxRate: Number(line.taxRate),
        })),
    });
});
exports.invoicesRoutes.post('/', (0, validate_1.validate)(invoiceSchema), async (c) => {
    const body = c.get('validatedBody');
    const stockCheck = await (0, rules_1.ensureStockAvailable)(body.lines.map((line) => ({
        productId: line.productId ?? null,
        quantity: line.quantity,
    })));
    if (!stockCheck.ok) {
        return (0, http_1.fail)(c, 422, 'Insufficient stock', stockCheck);
    }
    const ids = await client_1.db.select({ id: schema_1.invoices.id }).from(schema_1.invoices);
    const id = (0, ids_1.nextDocumentId)(ids.map((item) => item.id), 'FT');
    await client_1.db.insert(schema_1.invoices).values({
        id,
        currentAccountId: body.currentAccountId,
        customer: body.customer,
        issueDate: body.issueDate,
        dueDate: body.dueDate,
        status: body.status,
        note: body.note,
        relatedQuotationId: body.relatedQuotationId,
    });
    await client_1.db.insert(schema_1.invoiceLines).values(body.lines.map((line, index) => ({
        invoiceId: id,
        productId: line.productId,
        product: line.product,
        quantity: String(line.quantity),
        unitPrice: String(line.unitPrice),
        taxRate: String(line.taxRate),
        lineOrder: index,
    })));
    await (0, rules_1.createStockOutForInvoice)(id);
    return (0, http_1.created)(c, { id });
});
exports.invoicesRoutes.put('/:id/status', (0, validate_1.validate)(zod_1.z.object({ status: zod_1.z.string() })), async (c) => {
    const id = c.req.param('id');
    const body = c.get('validatedBody');
    await client_1.db.update(schema_1.invoices).set({ status: body.status, updatedAt: new Date() }).where((0, drizzle_orm_1.eq)(schema_1.invoices.id, id));
    if (body.status === 'paid') {
        await (0, rules_1.createInvoicePaymentTransaction)(id);
    }
    return (0, http_1.ok)(c, { id, status: body.status });
});
exports.invoicesRoutes.put('/:id', (0, validate_1.validate)(invoiceSchema), async (c) => {
    const id = c.req.param('id');
    const body = c.get('validatedBody');
    const [invoice] = await client_1.db.select().from(schema_1.invoices).where((0, drizzle_orm_1.eq)(schema_1.invoices.id, id));
    if (!invoice) {
        return (0, http_1.fail)(c, 404, 'Invoice not found');
    }
    if (invoice.status !== 'draft') {
        return (0, http_1.fail)(c, 422, 'Only draft invoices can be updated');
    }
    const existingLines = await client_1.db
        .select()
        .from(schema_1.invoiceLines)
        .where((0, drizzle_orm_1.eq)(schema_1.invoiceLines.invoiceId, id));
    const reservedQuantities = existingLines.reduce((accumulator, line) => {
        if (!line.productId) {
            return accumulator;
        }
        accumulator[line.productId] =
            (accumulator[line.productId] ?? 0) + Number(line.quantity);
        return accumulator;
    }, {});
    for (const line of body.lines) {
        if (!line.productId) {
            continue;
        }
        const stock = await (0, rules_1.getProductStock)(line.productId);
        const available = stock + (reservedQuantities[line.productId] ?? 0);
        if (available < line.quantity) {
            return (0, http_1.fail)(c, 422, 'Insufficient stock', {
                ok: false,
                productId: line.productId,
                available,
            });
        }
    }
    await client_1.db
        .update(schema_1.invoices)
        .set({
        currentAccountId: body.currentAccountId,
        customer: body.customer,
        issueDate: body.issueDate,
        dueDate: body.dueDate,
        status: body.status,
        note: body.note,
        relatedQuotationId: body.relatedQuotationId,
        updatedAt: new Date(),
    })
        .where((0, drizzle_orm_1.eq)(schema_1.invoices.id, id));
    await client_1.db.delete(schema_1.invoiceLines).where((0, drizzle_orm_1.eq)(schema_1.invoiceLines.invoiceId, id));
    await client_1.db.insert(schema_1.invoiceLines).values(body.lines.map((line, index) => ({
        invoiceId: id,
        productId: line.productId,
        product: line.product,
        quantity: String(line.quantity),
        unitPrice: String(line.unitPrice),
        taxRate: String(line.taxRate),
        lineOrder: index,
    })));
    await (0, rules_1.createStockOutForInvoice)(id);
    return (0, http_1.ok)(c, { id });
});
exports.invoicesRoutes.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const [invoice] = await client_1.db.select().from(schema_1.invoices).where((0, drizzle_orm_1.eq)(schema_1.invoices.id, id));
    if (invoice?.status !== 'draft') {
        return (0, http_1.fail)(c, 422, 'Only draft invoices can be deleted');
    }
    await client_1.db.delete(schema_1.invoiceLines).where((0, drizzle_orm_1.eq)(schema_1.invoiceLines.invoiceId, id));
    await client_1.db.delete(schema_1.invoices).where((0, drizzle_orm_1.eq)(schema_1.invoices.id, id));
    return (0, http_1.ok)(c, { id });
});
