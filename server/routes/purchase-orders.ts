import { Hono } from 'hono'
import { and, eq, ilike } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client'
import { purchaseOrderLines, purchaseOrders } from '../db/schema'
import { nextDocumentId } from '../lib/ids'
import { createStockInForPurchaseOrder } from '../lib/rules'
import { created, fail, ok } from '../lib/http'
import { validate } from '../middleware/validate'

const lineSchema = z.object({
  id: z.string().optional(),
  productId: z.string().optional().nullable(),
  product: z.string(),
  quantity: z.coerce.number(),
  unitPrice: z.coerce.number(),
  taxRate: z.coerce.number().default(20),
  receivedQty: z.coerce.number().optional(),
})

const purchaseSchema = z.object({
  currentAccountId: z.string().optional().nullable(),
  supplier: z.string(),
  orderDate: z.string(),
  expectedDate: z.string().optional().nullable(),
  status: z.string().default('draft'),
  note: z.string().optional().nullable(),
  warehouseId: z.string().optional().nullable(),
  lines: z.array(lineSchema).min(1),
})

export const purchaseOrdersRoutes = new Hono()

purchaseOrdersRoutes.get('/', async (c) => {
  const status = c.req.query('status')
  const search = c.req.query('search')
  const filters = [
    status ? eq(purchaseOrders.status, status) : undefined,
    search ? ilike(purchaseOrders.supplier, `%${search}%`) : undefined,
  ].filter(Boolean)
  return ok(
    c,
    await db.select().from(purchaseOrders).where(filters.length ? and(...filters) : undefined),
  )
})

purchaseOrdersRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  const [purchase] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id))
  if (!purchase) return fail(c, 404, 'Purchase order not found')
  const lines = await db.select().from(purchaseOrderLines).where(eq(purchaseOrderLines.purchaseOrderId, id))
  return ok(c, { ...purchase, lines })
})

purchaseOrdersRoutes.post('/', validate(purchaseSchema), async (c) => {
  const body = c.get('validatedBody') as z.infer<typeof purchaseSchema>
  const ids = await db.select({ id: purchaseOrders.id }).from(purchaseOrders)
  const id = nextDocumentId(ids.map((item) => item.id), 'SPA')
  await db.insert(purchaseOrders).values({
    id,
    currentAccountId: body.currentAccountId,
    supplier: body.supplier,
    orderDate: body.orderDate,
    expectedDate: body.expectedDate,
    status: body.status,
    note: body.note,
    warehouseId: body.warehouseId,
  })
  await db.insert(purchaseOrderLines).values(
    body.lines.map((line, index) => ({
      purchaseOrderId: id,
      productId: line.productId,
      product: line.product,
      quantity: String(line.quantity),
      unitPrice: String(line.unitPrice),
      taxRate: String(line.taxRate),
      receivedQty: String(line.receivedQty ?? 0),
      lineOrder: index,
    })),
  )
  return created(c, { id })
})

purchaseOrdersRoutes.put('/:id/status', validate(z.object({ status: z.string() })), async (c) => {
  const id = c.req.param('id')
  const body = c.get('validatedBody') as { status: string }
  await db
    .update(purchaseOrders)
    .set({ status: body.status, updatedAt: new Date() })
    .where(eq(purchaseOrders.id, id))
  return ok(c, { id, status: body.status })
})

purchaseOrdersRoutes.post('/:id/receive', validate(z.object({
  lines: z.array(z.object({ lineId: z.string(), receivedQty: z.coerce.number() })),
})), async (c) => {
  const id = c.req.param('id')
  const body = c.get('validatedBody') as { lines: Array<{ lineId: string; receivedQty: number }> }
  const existingLines = await db
    .select()
    .from(purchaseOrderLines)
    .where(eq(purchaseOrderLines.purchaseOrderId, id))

  for (const line of body.lines) {
    await db
      .update(purchaseOrderLines)
      .set({ receivedQty: String(line.receivedQty) })
      .where(eq(purchaseOrderLines.id, line.lineId))
  }

  const fullyReceived = existingLines.every((line) => {
    const payload = body.lines.find((item) => item.lineId === line.id)
    return payload && payload.receivedQty >= Number(line.quantity)
  })

  await db
    .update(purchaseOrders)
    .set({ status: fullyReceived ? 'received' : 'partial', updatedAt: new Date() })
    .where(eq(purchaseOrders.id, id))

  await createStockInForPurchaseOrder(id)
  return ok(c, { id, status: fullyReceived ? 'received' : 'partial' })
})
