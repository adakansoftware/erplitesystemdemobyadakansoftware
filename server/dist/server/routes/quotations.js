"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quotationsRoutes = void 0;
const hono_1 = require("hono");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const client_1 = require("../db/client");
const schema_1 = require("../db/schema");
const ids_1 = require("../lib/ids");
const http_1 = require("../lib/http");
const validate_1 = require("../middleware/validate");
const lineSchema = zod_1.z.object({
    productId: zod_1.z.string().optional().nullable(),
    product: zod_1.z.string(),
    quantity: zod_1.z.coerce.number(),
    unitPrice: zod_1.z.coerce.number(),
    taxRate: zod_1.z.coerce.number().default(20),
});
const quotationSchema = zod_1.z.object({
    currentAccountId: zod_1.z.string().optional().nullable(),
    customer: zod_1.z.string(),
    date: zod_1.z.string(),
    validUntil: zod_1.z.string(),
    note: zod_1.z.string().optional().nullable(),
    status: zod_1.z.string().default('draft'),
    lines: zod_1.z.array(lineSchema).min(1),
});
exports.quotationsRoutes = new hono_1.Hono();
exports.quotationsRoutes.get('/', async (c) => {
    const status = c.req.query('status');
    const search = c.req.query('search');
    const filters = [
        status ? (0, drizzle_orm_1.eq)(schema_1.quotations.status, status) : undefined,
        search ? (0, drizzle_orm_1.ilike)(schema_1.quotations.customer, `%${search}%`) : undefined,
    ].filter(Boolean);
    const items = await client_1.db
        .select()
        .from(schema_1.quotations)
        .where(filters.length ? (0, drizzle_orm_1.and)(...filters) : undefined);
    return (0, http_1.ok)(c, items);
});
exports.quotationsRoutes.get('/:id', async (c) => {
    const id = c.req.param('id');
    const [quotation] = await client_1.db.select().from(schema_1.quotations).where((0, drizzle_orm_1.eq)(schema_1.quotations.id, id));
    if (!quotation)
        return (0, http_1.fail)(c, 404, 'Quotation not found');
    const lines = await client_1.db.select().from(schema_1.quotationLines).where((0, drizzle_orm_1.eq)(schema_1.quotationLines.quotationId, id));
    return (0, http_1.ok)(c, { ...quotation, lines });
});
exports.quotationsRoutes.post('/', (0, validate_1.validate)(quotationSchema), async (c) => {
    const body = c.get('validatedBody');
    const ids = await client_1.db.select({ id: schema_1.quotations.id }).from(schema_1.quotations);
    const id = (0, ids_1.nextDocumentId)(ids.map((item) => item.id), 'TKL');
    await client_1.db.insert(schema_1.quotations).values({
        id,
        currentAccountId: body.currentAccountId,
        customer: body.customer,
        date: body.date,
        validUntil: body.validUntil,
        note: body.note,
        status: body.status,
    });
    await client_1.db.insert(schema_1.quotationLines).values(body.lines.map((line, index) => ({
        quotationId: id,
        productId: line.productId,
        product: line.product,
        quantity: String(line.quantity),
        unitPrice: String(line.unitPrice),
        taxRate: String(line.taxRate),
        lineOrder: index,
    })));
    return (0, http_1.created)(c, { id });
});
exports.quotationsRoutes.put('/:id', (0, validate_1.validate)(quotationSchema.partial()), async (c) => {
    const id = c.req.param('id');
    const body = c.get('validatedBody');
    await client_1.db.update(schema_1.quotations).set({ ...body, updatedAt: new Date() }).where((0, drizzle_orm_1.eq)(schema_1.quotations.id, id));
    return (0, http_1.ok)(c, { id });
});
exports.quotationsRoutes.delete('/:id', async (c) => {
    const id = c.req.param('id');
    await client_1.db.delete(schema_1.quotationLines).where((0, drizzle_orm_1.eq)(schema_1.quotationLines.quotationId, id));
    await client_1.db.delete(schema_1.quotations).where((0, drizzle_orm_1.eq)(schema_1.quotations.id, id));
    return (0, http_1.ok)(c, { id });
});
exports.quotationsRoutes.post('/:id/convert-to-invoice', async (c) => {
    const id = c.req.param('id');
    const [quotation] = await client_1.db.select().from(schema_1.quotations).where((0, drizzle_orm_1.eq)(schema_1.quotations.id, id));
    if (!quotation)
        return (0, http_1.fail)(c, 404, 'Quotation not found');
    const lines = await client_1.db.select().from(schema_1.quotationLines).where((0, drizzle_orm_1.eq)(schema_1.quotationLines.quotationId, id));
    const invoiceIds = await client_1.db.select({ id: schema_1.invoices.id }).from(schema_1.invoices);
    const invoiceId = (0, ids_1.nextDocumentId)(invoiceIds.map((item) => item.id), 'FT');
    await client_1.db.insert(schema_1.invoices).values({
        id: invoiceId,
        currentAccountId: quotation.currentAccountId,
        customer: quotation.customer,
        issueDate: quotation.date,
        dueDate: quotation.validUntil,
        status: 'draft',
        note: quotation.note,
        relatedQuotationId: quotation.id,
    });
    await client_1.db.insert(schema_1.invoiceLines).values(lines.map((line, index) => ({
        invoiceId,
        productId: line.productId,
        product: line.product,
        quantity: String(line.quantity),
        unitPrice: String(line.unitPrice),
        taxRate: String(line.taxRate),
        lineOrder: index,
    })));
    await client_1.db
        .update(schema_1.quotations)
        .set({ status: 'accepted', convertedToInvoiceId: invoiceId, updatedAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_1.quotations.id, id));
    return (0, http_1.ok)(c, { invoiceId });
});
