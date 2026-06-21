import { Hono } from 'hono'
import { and, eq, ilike, or, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client'
import { productCategories, products, stockMovements, warehouses } from '../db/schema'
import { attachProductStocks, getProductStock } from '../lib/rules'
import { created, fail, ok } from '../lib/http'
import { requireRole } from '../middleware/auth'
import { validate } from '../middleware/validate'

const createSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  sku: z.string().min(2),
  barcode: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  brand: z.string().optional().nullable(),
  unit: z.string().default('Adet'),
  costPrice: z.coerce.number().default(0),
  salePrice: z.coerce.number().default(0),
  taxRate: z.coerce.number().default(20),
  reorderPoint: z.coerce.number().int().default(0),
  status: z.string().default('active'),
  description: z.string().optional().nullable(),
})

const updateSchema = createSchema.partial()
const categorySchema = z.object({
  name: z.string().min(2),
})

export const productsRoutes = new Hono()

async function resolveCategoryId(input?: string | null, existingId?: string | null) {
  if (existingId) {
    return existingId
  }

  if (!input) {
    return undefined
  }

  const [existing] = await db.select().from(productCategories).where(eq(productCategories.name, input))
  if (existing) {
    return existing.id
  }

  const [createdCategory] = await db.insert(productCategories).values({ name: input }).returning()
  return createdCategory.id
}

productsRoutes.get('/', async (c) => {
  const search = c.req.query('search')
  const category = c.req.query('category')
  const status = c.req.query('status')
  const page = Math.max(1, Number(c.req.query('page') ?? 1))
  const limit = Math.min(100, Number(c.req.query('limit') ?? 50))
  const offset = (page - 1) * limit

  const filters: SQL[] = [
    search
      ? or(ilike(products.name, `%${search}%`), ilike(products.sku, `%${search}%`))
      : undefined,
    category ? eq(products.categoryId, category) : undefined,
    status ? eq(products.status, status) : undefined,
  ].filter((filter): filter is SQL => filter !== undefined)

  const [result, countResult] = await Promise.all([
    db
      .select()
      .from(products)
      .where(filters.length ? and(...filters) : undefined)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<string>`count(*)` })
      .from(products)
      .where(filters.length ? and(...filters) : undefined),
  ])

  const categories = await db.select().from(productCategories)
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]))
  const withStocks = await attachProductStocks(result)
  const total = Number(countResult[0]?.count ?? 0)

  return ok(
    c,
    withStocks.map((item) => ({
      ...item,
      category: item.categoryId ? categoryMap.get(item.categoryId) ?? '' : '',
      stock: item.totalStock,
      supplierPrice: Number(item.costPrice ?? 0),
    })),
    { total, page, limit, pages: Math.ceil(total / limit) },
  )
})

productsRoutes.get('/low-stock', async (c) => {
  const result = await db.select().from(products)
  const withStocks = await attachProductStocks(result)
  return ok(c, withStocks.filter((item) => item.totalStock <= Number(item.reorderPoint)))
})

productsRoutes.get('/categories', async (c) => {
  return ok(c, await db.select().from(productCategories))
})

productsRoutes.post('/categories', validate(categorySchema), async (c) => {
  const body = c.get('validatedBody') as z.infer<typeof categorySchema>
  const [existing] = await db.select().from(productCategories).where(eq(productCategories.name, body.name))
  if (existing) {
    return ok(c, existing)
  }

  const [createdCategory] = await db.insert(productCategories).values({ name: body.name }).returning()
  return created(c, createdCategory)
})

productsRoutes.delete('/categories/:id', requireRole('admin'), async (c) => {
  const id = c.req.param('id')
  await db.delete(productCategories).where(eq(productCategories.id, id))
  return ok(c, { id })
})

productsRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  const [product] = await db.select().from(products).where(eq(products.id, id))
  if (!product) {
    return fail(c, 404, 'Product not found')
  }

  const totalStock = await getProductStock(product.id)
  const [category] = product.categoryId
    ? await db.select().from(productCategories).where(eq(productCategories.id, product.categoryId))
    : [null]
  const warehouseItems = await db.select().from(warehouses)
  const warehouseMap = new Map(warehouseItems.map((warehouse) => [warehouse.id, warehouse.name]))
  const movements = await db
    .select()
    .from(stockMovements)
    .where(eq(stockMovements.productId, product.id))

  return ok(c, {
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
  })
})

productsRoutes.get('/:id/stock', async (c) => {
  const id = c.req.param('id')
  const rows = await db
    .select({
      warehouseId: stockMovements.warehouseId,
      qty: sql<string>`coalesce(sum(case when ${stockMovements.type} = 'out' then -${stockMovements.qty} else ${stockMovements.qty} end), 0)`,
    })
    .from(stockMovements)
    .where(eq(stockMovements.productId, id))
    .groupBy(stockMovements.warehouseId)

  return ok(c, rows)
})

productsRoutes.post('/', validate(createSchema), async (c) => {
  const body = c.get('validatedBody') as z.infer<typeof createSchema>
  const categoryId = await resolveCategoryId(body.category, body.categoryId)
  await db.insert(products).values({
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
  })

  const [product] = await db.select().from(products).where(eq(products.sku, body.sku))
  return created(c, product)
})

productsRoutes.put('/:id', validate(updateSchema), async (c) => {
  const id = c.req.param('id')
  const body = c.get('validatedBody') as z.infer<typeof updateSchema>
  const categoryId = await resolveCategoryId(body.category, body.categoryId)
  await db
    .update(products)
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
    .where(eq(products.id, id))

  const [product] = await db.select().from(products).where(eq(products.id, id))
  return ok(c, product)
})

productsRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await db
    .update(products)
    .set({ status: 'archived', updatedAt: new Date() })
    .where(eq(products.id, id))
  return ok(c, { id, status: 'archived' })
})
