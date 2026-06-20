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
    category: zod_1.z.string().optional().nullable(),
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
async function resolveCategoryId(input, existingId) {
    if (existingId) {
        return existingId;
    }
    if (!input) {
        return undefined;
    }
    const [existing] = await client_1.db.select().from(schema_1.productCategories).where((0, drizzle_orm_1.eq)(schema_1.productCategories.name, input));
    if (existing) {
        return existing.id;
    }
    const [createdCategory] = await client_1.db.insert(schema_1.productCategories).values({ name: input }).returning();
    return createdCategory.id;
}
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
    const categories = await client_1.db.select().from(schema_1.productCategories);
    const categoryMap = new Map(categories.map((category) => [category.id, category.name]));
    const withStocks = await (0, rules_1.attachProductStocks)(result);
    return (0, http_1.ok)(c, withStocks.map((item) => ({
        ...item,
        category: item.categoryId ? categoryMap.get(item.categoryId) ?? '' : '',
        stock: item.totalStock,
        supplierPrice: Number(item.costPrice ?? 0),
    })));
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
    const [category] = product.categoryId
        ? await client_1.db.select().from(schema_1.productCategories).where((0, drizzle_orm_1.eq)(schema_1.productCategories.id, product.categoryId))
        : [null];
    const warehouseItems = await client_1.db.select().from(schema_1.warehouses);
    const warehouseMap = new Map(warehouseItems.map((warehouse) => [warehouse.id, warehouse.name]));
    const movements = await client_1.db
        .select()
        .from(schema_1.stockMovements)
        .where((0, drizzle_orm_1.eq)(schema_1.stockMovements.productId, product.id));
    return (0, http_1.ok)(c, {
        ...product,
        category: category?.name ?? '',
        stock: totalStock,
        totalStock,
        supplierPrice: Number(product.costPrice ?? 0),
        stockMovements: movements.map((movement) => ({
            ...movement,
            qty: Number(movement.qty),
            product: product.name,
            sku: product.sku,
            warehouse: movement.warehouseId ? warehouseMap.get(movement.warehouseId) ?? movement.warehouseId : 'Merkez Depo',
            relatedDoc: movement.relatedDocId,
            user: 'ERP Lite',
            date: movement.createdAt.toISOString().slice(0, 10),
        })),
    });
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
    const categoryId = await resolveCategoryId(body.category, body.categoryId);
    await client_1.db.insert(schema_1.products).values({
        id: body.id ?? `PRD-${Date.now()}`,
        name: body.name,
        sku: body.sku,
        barcode: body.barcode,
        categoryId,
        brand: body.brand,
        unit: body.unit,
        costPrice: String(body.costPrice),
        salePrice: String(body.salePrice),
        taxRate: String(body.taxRate),
        reorderPoint: body.reorderPoint,
        status: body.status,
        description: body.description,
    });
    const [product] = await client_1.db.select().from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.sku, body.sku));
    return (0, http_1.created)(c, product);
});
exports.productsRoutes.put('/:id', (0, validate_1.validate)(updateSchema), async (c) => {
    const id = c.req.param('id');
    const body = c.get('validatedBody');
    const categoryId = await resolveCategoryId(body.category, body.categoryId);
    await client_1.db
        .update(schema_1.products)
        .set({
        name: body.name,
        sku: body.sku,
        barcode: body.barcode,
        categoryId,
        brand: body.brand,
        unit: body.unit,
        costPrice: body.costPrice != null ? String(body.costPrice) : undefined,
        salePrice: body.salePrice != null ? String(body.salePrice) : undefined,
        taxRate: body.taxRate != null ? String(body.taxRate) : undefined,
        reorderPoint: body.reorderPoint,
        status: body.status,
        description: body.description,
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
