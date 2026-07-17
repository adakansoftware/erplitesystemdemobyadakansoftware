import { Hono } from 'hono'
import { and, eq, ilike, inArray, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client'
import { purchaseOrderLines, purchaseOrders } from '../db/schema'
import { invalidate, tenantCachePattern } from '../lib/cache'
import { eventBus } from '../lib/event-bus'
import { nextDocumentId } from '../lib/ids'
import { createStockInForPurchaseOrder } from '../lib/rules'
import { created, fail, ok } from '../lib/http'
import { requireRole } from '../middleware/auth'
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
  const tenantId = c.get('tenantId')
  const status = c.req.query('status')
  const search = c.req.query('search')
  const page = Math.max(1, Number(c.req.query('page') ?? 1))
  const limit = Math.min(100, Number(c.req.query('limit') ?? 50))
  const offset = (page - 1) * limit
  const filters: SQL[] = [
    tenantId ? eq(purchaseOrders.tenantId, tenantId) : undefined,
    status ? eq(purchaseOrders.status, status) : undefined,
    search ? ilike(purchaseOrders.supplier, `%${search}%`) : undefined,
  ].filter((filter): filter is SQL => filter !== undefined)
  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(purchaseOrders)
      .where(filters.length ? and(...filters) : undefined)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<string>`count(*)` })
      .from(purchaseOrders)
      .where(filters.length ? and(...filters) : undefined),
  ])
  const lines = items.length
    ? await db
        .select()
        .from(purchaseOrderLines)
        .where(inArray(purchaseOrderLines.purchaseOrderId, items.map((item) => item.id)))
    : []
  const total = Number(countResult[0]?.count ?? 0)
  return ok(
    c,
    items.map((item) => ({
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
    })),
    { total, page, limit, pages: Math.ceil(total / limit) },
  )
})

purchaseOrdersRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  const tenantId = c.get('tenantId')
  const [purchase] = await db
    .select()
    .from(purchaseOrders)
    .where(
      and(
        eq(purchaseOrders.id, id),
        ...(tenantId ? [eq(purchaseOrders.tenantId, tenantId)] : []),
      ),
    )
  if (!purchase) return fail(c, 404, 'Purchase order not found')
  const lines = await db.select().from(purchaseOrderLines).where(eq(purchaseOrderLines.purchaseOrderId, id))
  return ok(c, {
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
  })
})

purchaseOrdersRoutes.post('/', validate(purchaseSchema), async (c) => {
  const body = c.get('validatedBody') as z.infer<typeof purchaseSchema>
  const tenantId = c.get('tenantId')
  const ids = await db.select({ id: purchaseOrders.id }).from(purchaseOrders)
  const id = nextDocumentId(ids.map((item) => item.id), 'SPA')
  await db.insert(purchaseOrders).values({
    id,
    tenantId,
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

purchaseOrdersRoutes.put('/:id/status', requireRole('admin', 'manager'), validate(z.object({ status: z.string() })), async (c) => {
  const id = c.req.param('id')
  const body = c.get('validatedBody') as { status: string }
  const tenantId = c.get('tenantId')
  await db
    .update(purchaseOrders)
    .set({ status: body.status, updatedAt: new Date() })
    .where(
      and(
        eq(purchaseOrders.id, id),
        ...(tenantId ? [eq(purchaseOrders.tenantId, tenantId)] : []),
      ),
    )
  return ok(c, { id, status: body.status })
})

purchaseOrdersRoutes.post('/:id/receive', validate(z.object({
  lines: z.array(z.object({ lineId: z.string(), receivedQty: z.coerce.number() })),
})), async (c) => {
  const id = c.req.param('id')
  const body = c.get('validatedBody') as { lines: Array<{ lineId: string; receivedQty: number }> }
  const tenantId = c.get('tenantId')
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
    .where(
      and(
        eq(purchaseOrders.id, id),
        ...(tenantId ? [eq(purchaseOrders.tenantId, tenantId)] : []),
      ),
    )

  await createStockInForPurchaseOrder(id)
  await invalidate(tenantCachePattern('products:list', tenantId))
  await invalidate(tenantCachePattern('stock:summary', tenantId))
  eventBus.emit('purchase.received', {
    purchaseId: id,
    userId: (c.get('user') as { id?: string } | undefined)?.id,
  })
  return ok(c, { id, status: fullyReceived ? 'received' : 'partial' })
})
