import { Hono } from 'hono'
import { and, eq, ilike } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client'
import { invoiceLines, invoices, quotationLines, quotations } from '../db/schema'
import { nextDocumentId } from '../lib/ids'
import { created, fail, ok } from '../lib/http'
import { validate } from '../middleware/validate'

const lineSchema = z.object({
  productId: z.string().optional().nullable(),
  product: z.string(),
  quantity: z.coerce.number(),
  unitPrice: z.coerce.number(),
  taxRate: z.coerce.number().default(20),
})

const quotationSchema = z.object({
  currentAccountId: z.string().optional().nullable(),
  customer: z.string(),
  date: z.string(),
  validUntil: z.string(),
  note: z.string().optional().nullable(),
  status: z.string().default('draft'),
  lines: z.array(lineSchema).min(1),
})

export const quotationsRoutes = new Hono()

quotationsRoutes.get('/', async (c) => {
  const status = c.req.query('status')
  const search = c.req.query('search')
  const filters = [
    status ? eq(quotations.status, status) : undefined,
    search ? ilike(quotations.customer, `%${search}%`) : undefined,
  ].filter(Boolean)
  const items = await db
    .select()
    .from(quotations)
    .where(filters.length ? and(...filters) : undefined)
  const lines = await db.select().from(quotationLines)
  return ok(
    c,
    items.map((item) => ({
      ...item,
      relatedInvoice: item.convertedToInvoiceId,
      lines: lines
        .filter((line) => line.quotationId === item.id)
        .sort((a, b) => a.lineOrder - b.lineOrder)
        .map((line) => ({
          productId: line.productId,
          product: line.product,
          quantity: Number(line.quantity),
          unitPrice: Number(line.unitPrice),
          taxRate: Number(line.taxRate),
        })),
    })),
  )
})

quotationsRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  const [quotation] = await db.select().from(quotations).where(eq(quotations.id, id))
  if (!quotation) return fail(c, 404, 'Quotation not found')
  const lines = await db.select().from(quotationLines).where(eq(quotationLines.quotationId, id))
  return ok(c, {
    ...quotation,
    relatedInvoice: quotation.convertedToInvoiceId,
    lines: lines
      .sort((a, b) => a.lineOrder - b.lineOrder)
      .map((line) => ({
        productId: line.productId,
        product: line.product,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
        taxRate: Number(line.taxRate),
      })),
  })
})

quotationsRoutes.post('/', validate(quotationSchema), async (c) => {
  const body = c.get('validatedBody') as z.infer<typeof quotationSchema>
  const ids = await db.select({ id: quotations.id }).from(quotations)
  const id = nextDocumentId(ids.map((item) => item.id), 'TKL')
  await db.insert(quotations).values({
    id,
    currentAccountId: body.currentAccountId,
    customer: body.customer,
    date: body.date,
    validUntil: body.validUntil,
    note: body.note,
    status: body.status,
  })
  await db.insert(quotationLines).values(
    body.lines.map((line, index) => ({
      quotationId: id,
      productId: line.productId,
      product: line.product,
      quantity: String(line.quantity),
      unitPrice: String(line.unitPrice),
      taxRate: String(line.taxRate),
      lineOrder: index,
    })),
  )
  return created(c, { id })
})

quotationsRoutes.put('/:id', validate(quotationSchema.partial()), async (c) => {
  const id = c.req.param('id')
  const body = c.get('validatedBody') as Partial<z.infer<typeof quotationSchema>>
  await db.update(quotations).set({ ...body, updatedAt: new Date() }).where(eq(quotations.id, id))
  return ok(c, { id })
})

quotationsRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await db.delete(quotationLines).where(eq(quotationLines.quotationId, id))
  await db.delete(quotations).where(eq(quotations.id, id))
  return ok(c, { id })
})

quotationsRoutes.post('/:id/convert-to-invoice', async (c) => {
  const id = c.req.param('id')
  const [quotation] = await db.select().from(quotations).where(eq(quotations.id, id))
  if (!quotation) return fail(c, 404, 'Quotation not found')
  const lines = await db.select().from(quotationLines).where(eq(quotationLines.quotationId, id))
  const invoiceIds = await db.select({ id: invoices.id }).from(invoices)
  const invoiceId = nextDocumentId(invoiceIds.map((item) => item.id), 'FT')

  await db.insert(invoices).values({
    id: invoiceId,
    currentAccountId: quotation.currentAccountId,
    customer: quotation.customer,
    issueDate: quotation.date,
    dueDate: quotation.validUntil,
    status: 'draft',
    note: quotation.note,
    relatedQuotationId: quotation.id,
  })
  await db.insert(invoiceLines).values(
    lines.map((line, index) => ({
      invoiceId,
      productId: line.productId,
      product: line.product,
      quantity: String(line.quantity),
      unitPrice: String(line.unitPrice),
      taxRate: String(line.taxRate),
      lineOrder: index,
    })),
  )

  await db
    .update(quotations)
    .set({ status: 'accepted', convertedToInvoiceId: invoiceId, updatedAt: new Date() })
    .where(eq(quotations.id, id))

  return ok(c, { invoiceId })
})
