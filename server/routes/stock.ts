import { Hono } from 'hono'
import { and, eq, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client'
import { productCategories, products, stockMovements, warehouses } from '../db/schema'
import { cached, invalidate, tenantCacheKey, tenantCachePattern } from '../lib/cache'
import { eventBus } from '../lib/event-bus'
import { getProductStock } from '../lib/rules'
import { created, fail, ok } from '../lib/http'
import { validate } from '../middleware/validate'

const movementSchema = z.object({
  productId: z.string(),
  warehouseId: z.string().optional().nullable(),
  type: z.enum(['in', 'out', 'transfer', 'adjustment']),
  qty: z.coerce.number().refine((value) => value !== 0, 'Qty must not be zero'),
  note: z.string().optional().nullable(),
  unitCost: z.coerce.number().optional(),
})

const warehouseSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  location: z.string().optional().nullable(),
  manager: z.string().optional().nullable(),
  capacity: z.coerce.number().optional(),
})

export const stockRoutes = new Hono()

stockRoutes.get('/movements', async (c) => {
  const tenantId = c.get('tenantId')
  const productId = c.req.query('productId')
  const warehouseId = c.req.query('warehouseId')
  const type = c.req.query('type')

  const filters: SQL[] = [
    tenantId ? eq(stockMovements.tenantId, tenantId) : undefined,
    productId ? eq(stockMovements.productId, productId) : undefined,
    warehouseId ? eq(stockMovements.warehouseId, warehouseId) : undefined,
    type ? eq(stockMovements.type, type) : undefined,
  ].filter((filter): filter is SQL => filter !== undefined)

  const result = await db
    .select()
    .from(stockMovements)
    .where(filters.length ? and(...filters) : undefined)
  const [productItems, warehouseItems] = await Promise.all([
    db.select().from(products).where(tenantId ? eq(products.tenantId, tenantId) : undefined),
    db.select().from(warehouses).where(tenantId ? eq(warehouses.tenantId, tenantId) : undefined),
  ])
  const productMap = new Map(productItems.map((product) => [product.id, product]))
  const warehouseMap = new Map(warehouseItems.map((warehouse) => [warehouse.id, warehouse.name]))

  return ok(
    c,
    result.map((movement) => {
      const product = productMap.get(movement.productId)
      return {
        ...movement,
        qty: Number(movement.qty),
        product: product?.name ?? movement.productId,
        sku: product?.sku ?? '',
        warehouse: movement.warehouseId ? warehouseMap.get(movement.warehouseId) ?? movement.warehouseId : 'Merkez Depo',
        relatedDoc: movement.relatedDocId,
        user: 'ERP Lite',
        date: movement.createdAt.toISOString().slice(0, 10),
      }
    }),
  )
})

stockRoutes.post('/movements', validate(movementSchema), async (c) => {
  const body = c.get('validatedBody') as z.infer<typeof movementSchema>
  const tenantId = c.get('tenantId')
  if (tenantId) {
    const [product] = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.id, body.productId), eq(products.tenantId, tenantId)))

    if (!product) {
      return fail(c, 404, 'Product not found')
    }
  }
  if (body.type === 'out') {
    const currentStock = await getProductStock(body.productId)
    if (currentStock < Math.abs(body.qty)) {
      return fail(c, 422, 'Insufficient stock')
    }
  }

  await db.insert(stockMovements).values({
    tenantId,
    productId: body.productId,
    warehouseId: body.warehouseId ?? 'WH-01',
    type: body.type,
    qty: String(body.qty),
    note: body.note,
    unitCost: body.unitCost != null ? String(body.unitCost) : undefined,
  })

  const [movement] = await db
    .select()
    .from(stockMovements)
    .orderBy(sql`${stockMovements.createdAt} desc`)
    .limit(1)
  const [product] = await db.select().from(products).where(eq(products.id, body.productId))
  const currentStock = await getProductStock(body.productId)
  if (product && currentStock <= Number(product.reorderPoint)) {
    eventBus.emit('stock.low', {
      productId: product.id,
      qty: currentStock,
      threshold: Number(product.reorderPoint),
    })
  }
  await invalidate(tenantCachePattern('products:list', tenantId))
  await invalidate(tenantCachePattern('stock:summary', tenantId))

  return created(c, movement)
})

stockRoutes.get('/summary', async (c) => {
  const tenantId = c.get('tenantId')
  const summary = await cached(tenantCacheKey('stock:summary', tenantId), 60, async () => {
    const [items, categories] = await Promise.all([
      db.select().from(products).where(tenantId ? eq(products.tenantId, tenantId) : undefined),
      db.select().from(productCategories).where(tenantId ? eq(productCategories.tenantId, tenantId) : undefined),
    ])
    const categoryMap = new Map(categories.map((category) => [category.id, category.name]))

    return Promise.all(
      items.map(async (item) => ({
        ...item,
        category: item.categoryId ? categoryMap.get(item.categoryId) ?? '' : '',
        supplierPrice: Number(item.costPrice ?? 0),
        stock: await getProductStock(item.id),
        totalStock: await getProductStock(item.id),
      })),
    )
  })
  return ok(c, summary)
})

stockRoutes.get('/warehouses', async (c) => {
  const tenantId = c.get('tenantId')
  return ok(
    c,
    await db.select().from(warehouses).where(tenantId ? eq(warehouses.tenantId, tenantId) : undefined),
  )
})

stockRoutes.post('/warehouses', validate(warehouseSchema), async (c) => {
  const body = c.get('validatedBody') as z.infer<typeof warehouseSchema>
  const tenantId = c.get('tenantId')
  await db.insert(warehouses).values({
    id: body.id ?? `WH-${Date.now()}`,
    tenantId,
    name: body.name,
    location: body.location,
    manager: body.manager,
    capacity: body.capacity,
  })
  await invalidate(tenantCachePattern('stock:summary', tenantId))
  return created(c, body)
})
