import { Hono } from 'hono'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client'
import { products, stockMovements, warehouses } from '../db/schema'
import { getProductStock } from '../lib/rules'
import { created, fail, ok } from '../lib/http'
import { validate } from '../middleware/validate'

const movementSchema = z.object({
  productId: z.string(),
  warehouseId: z.string().optional().nullable(),
  type: z.enum(['in', 'out', 'transfer', 'adjustment']),
  qty: z.coerce.number().positive(),
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
  const productId = c.req.query('productId')
  const warehouseId = c.req.query('warehouseId')
  const type = c.req.query('type')

  const filters = [
    productId ? eq(stockMovements.productId, productId) : undefined,
    warehouseId ? eq(stockMovements.warehouseId, warehouseId) : undefined,
    type ? eq(stockMovements.type, type) : undefined,
  ].filter(Boolean)

  const result = await db
    .select()
    .from(stockMovements)
    .where(filters.length ? and(...filters) : undefined)

  return ok(c, result)
})

stockRoutes.post('/movements', validate(movementSchema), async (c) => {
  const body = c.get('validatedBody') as z.infer<typeof movementSchema>
  if (body.type === 'out') {
    const currentStock = await getProductStock(body.productId)
    if (currentStock < body.qty) {
      return fail(c, 422, 'Insufficient stock')
    }
  }

  await db.insert(stockMovements).values({
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

  return created(c, movement)
})

stockRoutes.get('/summary', async (c) => {
  const items = await db.select().from(products)
  const summary = await Promise.all(
    items.map(async (item) => ({
      ...item,
      totalStock: await getProductStock(item.id),
    })),
  )
  return ok(c, summary)
})

stockRoutes.get('/warehouses', async (c) => {
  return ok(c, await db.select().from(warehouses))
})

stockRoutes.post('/warehouses', validate(warehouseSchema), async (c) => {
  const body = c.get('validatedBody') as z.infer<typeof warehouseSchema>
  await db.insert(warehouses).values({
    id: body.id ?? `WH-${Date.now()}`,
    name: body.name,
    location: body.location,
    manager: body.manager,
    capacity: body.capacity,
  })
  return created(c, body)
})
