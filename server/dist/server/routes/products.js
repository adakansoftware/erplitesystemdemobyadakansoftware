"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsRoutes = void 0;
const hono_1 = require("hono");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const client_1 = require("../db/client");
const schema_1 = require("../db/schema");
const rules_1 = require("../lib/rules");
const http_1 = require("../lib/http");
const validate_1 = require("../middleware/validate");
const createSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    name: zod_1.z.string().min(2),
    sku: zod_1.z.string().min(2),
    barcode: zod_1.z.string().optional().nullable(),
    categoryId: zod_1.z.string().uuid().optional().nullable(),
    brand: zod_1.z.string().optional().nullable(),
    unit: zod_1.z.string().default('Adet'),
    costPrice: zod_1.z.coerce.number().default(0),
    salePrice: zod_1.z.coerce.number().default(0),
    taxRate: zod_1.z.coerce.number().default(20),
    reorderPoint: zod_1.z.coerce.number().int().default(0),
    status: zod_1.z.string().default('active'),
    description: zod_1.z.string().optional().nullable(),
});
const updateSchema = createSchema.partial();
exports.productsRoutes = new hono_1.Hono();
exports.productsRoutes.get('/', async (c) => {
    const search = c.req.query('search');
    const category = c.req.query('category');
    const status = c.req.query('status');
    const filters = [
        search
            ? (0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.products.name, `%${search}%`), (0, drizzle_orm_1.ilike)(schema_1.products.sku, `%${search}%`))
            : undefined,
        category ? (0, drizzle_orm_1.eq)(schema_1.products.categoryId, category) : undefined,
        status ? (0, drizzle_orm_1.eq)(schema_1.products.status, status) : undefined,
    ].filter(Boolean);
    const result = await client_1.db
        .select()
        .from(schema_1.products)
        .where(filters.length ? (0, drizzle_orm_1.and)(...filters) : undefined);
    return (0, http_1.ok)(c, await (0, rules_1.attachProductStocks)(result));
});
exports.productsRoutes.get('/low-stock', async (c) => {
    const result = await client_1.db.select().from(schema_1.products);
    const withStocks = await (0, rules_1.attachProductStocks)(result);
    return (0, http_1.ok)(c, withStocks.filter((item) => item.totalStock <= Number(item.reorderPoint)));
});
exports.productsRoutes.get('/:id', async (c) => {
    const id = c.req.param('id');
    const [product] = await client_1.db.select().from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.id, id));
    if (!product) {
        return (0, http_1.fail)(c, 404, 'Product not found');
    }
    const totalStock = await (0, rules_1.getProductStock)(product.id);
    const movements = await client_1.db
        .select()
        .from(schema_1.stockMovements)
        .where((0, drizzle_orm_1.eq)(schema_1.stockMovements.productId, product.id));
    return (0, http_1.ok)(c, { ...product, totalStock, stockMovements: movements });
});
exports.productsRoutes.get('/:id/stock', async (c) => {
    const id = c.req.param('id');
    const rows = await client_1.db
        .select({
        warehouseId: schema_1.stockMovements.warehouseId,
        qty: (0, drizzle_orm_1.sql) `coalesce(sum(case when ${schema_1.stockMovements.type} = 'out' then -${schema_1.stockMovements.qty} else ${schema_1.stockMovements.qty} end), 0)`,
    })
        .from(schema_1.stockMovements)
        .where((0, drizzle_orm_1.eq)(schema_1.stockMovements.productId, id))
        .groupBy(schema_1.stockMovements.warehouseId);
    return (0, http_1.ok)(c, rows);
});
exports.productsRoutes.post('/', (0, validate_1.validate)(createSchema), async (c) => {
    const body = c.get('validatedBody');
    await client_1.db.insert(schema_1.products).values({
        id: body.id ?? `PRD-${Date.now()}`,
        ...body,
        costPrice: String(body.costPrice),
        salePrice: String(body.salePrice),
        taxRate: String(body.taxRate),
    });
    const [product] = await client_1.db.select().from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.sku, body.sku));
    return (0, http_1.created)(c, product);
});
exports.productsRoutes.put('/:id', (0, validate_1.validate)(updateSchema), async (c) => {
    const id = c.req.param('id');
    const body = c.get('validatedBody');
    await client_1.db
        .update(schema_1.products)
        .set({
        ...body,
        costPrice: body.costPrice != null ? String(body.costPrice) : undefined,
        salePrice: body.salePrice != null ? String(body.salePrice) : undefined,
        taxRate: body.taxRate != null ? String(body.taxRate) : undefined,
        updatedAt: new Date(),
    })
        .where((0, drizzle_orm_1.eq)(schema_1.products.id, id));
    const [product] = await client_1.db.select().from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.id, id));
    return (0, http_1.ok)(c, product);
});
exports.productsRoutes.delete('/:id', async (c) => {
    const id = c.req.param('id');
    await client_1.db
        .update(schema_1.products)
        .set({ status: 'archived', updatedAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_1.products.id, id));
    return (0, http_1.ok)(c, { id, status: 'archived' });
});
