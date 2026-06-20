import { Hono } from 'hono'
import { and, eq, ilike, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client'
import { productCategories, products, stockMovements } from '../db/schema'
import { attachProductStocks, getProductStock } from '../lib/rules'
import { created, fail, ok } from '../lib/http'
import { validate } from '../middleware/validate'

const createSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  sku: z.string().min(2),
  barcode: z.string().optional().nullable(),
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

export const productsRoutes = new Hono()

productsRoutes.get('/', async (c) => {
  const search = c.req.query('search')
  const category = c.req.query('category')
  const status = c.req.query('status')

  const filters = [
    search
      ? or(ilike(products.name, `%${search}%`), ilike(products.sku, `%${search}%`))
      : undefined,
    category ? eq(products.categoryId, category) : undefined,
    status ? eq(products.status, status) : undefined,
  ].filter(Boolean)

  const result = await db
    .select()
    .from(products)
    .where(filters.length ? and(...filters) : undefined)

  return ok(c, await attachProductStocks(result))
})

productsRoutes.get('/low-stock', async (c) => {
  const result = await db.select().from(products)
  const withStocks = await attachProductStocks(result)
  return ok(c, withStocks.filter((item) => item.totalStock <= Number(item.reorderPoint)))
})

productsRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  const [product] = await db.select().from(products).where(eq(products.id, id))
  if (!product) {
    return fail(c, 404, 'Product not found')
  }

  const totalStock = await getProductStock(product.id)
  const movements = await db
    .select()
    .from(stockMovements)
    .where(eq(stockMovements.productId, product.id))

  return ok(c, { ...product, totalStock, stockMovements: movements })
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
  await db.insert(products).values({
    id: body.id ?? `PRD-${Date.now()}`,
    ...body,
    costPrice: String(body.costPrice),
    salePrice: String(body.salePrice),
    taxRate: String(body.taxRate),
  })

  const [product] = await db.select().from(products).where(eq(products.sku, body.sku))
  return created(c, product)
})

productsRoutes.put('/:id', validate(updateSchema), async (c) => {
  const id = c.req.param('id')
  const body = c.get('validatedBody') as z.infer<typeof updateSchema>
  await db
    .update(products)
    .set({
      ...body,
      costPrice: body.costPrice != null ? String(body.costPrice) : undefined,
      salePrice: body.salePrice != null ? String(body.salePrice) : undefined,
      taxRate: body.taxRate != null ? String(body.taxRate) : undefined,
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
