import { Hono } from 'hono'
import { and, eq, ilike } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client'
import { invoiceLines, invoices } from '../db/schema'
import { nextDocumentId } from '../lib/ids'
import { createInvoicePaymentTransaction, createStockOutForInvoice, ensureStockAvailable } from '../lib/rules'
import { created, fail, ok } from '../lib/http'
import { validate } from '../middleware/validate'

const lineSchema = z.object({
  productId: z.string().optional().nullable(),
  product: z.string(),
  quantity: z.coerce.number(),
  unitPrice: z.coerce.number(),
  taxRate: z.coerce.number().default(20),
})

const invoiceSchema = z.object({
  currentAccountId: z.string().optional().nullable(),
  customer: z.string(),
  issueDate: z.string(),
  dueDate: z.string(),
  note: z.string().optional().nullable(),
  status: z.string().default('draft'),
  relatedQuotationId: z.string().optional().nullable(),
  lines: z.array(lineSchema).min(1),
})

export const invoicesRoutes = new Hono()

invoicesRoutes.get('/', async (c) => {
  const status = c.req.query('status')
  const search = c.req.query('search')
  const filters = [
    status ? eq(invoices.status, status) : undefined,
    search ? ilike(invoices.customer, `%${search}%`) : undefined,
  ].filter(Boolean)
  const items = await db
    .select()
    .from(invoices)
    .where(filters.length ? and(...filters) : undefined)
  const now = new Date().toISOString().slice(0, 10)
  const normalized = items.map((item) => ({
    ...item,
    status: item.status === 'sent' && item.dueDate < now ? 'overdue' : item.status,
  }))
  return ok(c, normalized)
})

invoicesRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id))
  if (!invoice) return fail(c, 404, 'Invoice not found')
  const lines = await db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, id))
  return ok(c, { ...invoice, lines })
})

invoicesRoutes.post('/', validate(invoiceSchema), async (c) => {
  const body = c.get('validatedBody') as z.infer<typeof invoiceSchema>
  const stockCheck = await ensureStockAvailable(
    body.lines.map((line) => ({
      productId: line.productId ?? null,
      quantity: line.quantity,
    })),
  )
  if (!stockCheck.ok) {
    return fail(c, 422, 'Insufficient stock', stockCheck)
  }

  const ids = await db.select({ id: invoices.id }).from(invoices)
  const id = nextDocumentId(ids.map((item) => item.id), 'FT')
  await db.insert(invoices).values({
    id,
    currentAccountId: body.currentAccountId,
    customer: body.customer,
    issueDate: body.issueDate,
    dueDate: body.dueDate,
    status: body.status,
    note: body.note,
    relatedQuotationId: body.relatedQuotationId,
  })
  await db.insert(invoiceLines).values(
    body.lines.map((line, index) => ({
      invoiceId: id,
      productId: line.productId,
      product: line.product,
      quantity: String(line.quantity),
      unitPrice: String(line.unitPrice),
      taxRate: String(line.taxRate),
      lineOrder: index,
    })),
  )
  await createStockOutForInvoice(id)
  return created(c, { id })
})

invoicesRoutes.put('/:id/status', validate(z.object({ status: z.string() })), async (c) => {
  const id = c.req.param('id')
  const body = c.get('validatedBody') as { status: string }
  await db.update(invoices).set({ status: body.status, updatedAt: new Date() }).where(eq(invoices.id, id))
  if (body.status === 'paid') {
    await createInvoicePaymentTransaction(id)
  }
  return ok(c, { id, status: body.status })
})

invoicesRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id))
  if (invoice?.status !== 'draft') {
    return fail(c, 422, 'Only draft invoices can be deleted')
  }
  await db.delete(invoiceLines).where(eq(invoiceLines.invoiceId, id))
  await db.delete(invoices).where(eq(invoices.id, id))
  return ok(c, { id })
})
