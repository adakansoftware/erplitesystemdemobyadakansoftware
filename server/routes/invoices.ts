import { Hono } from 'hono'
import { and, eq, ilike, inArray, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client'
import { currentAccounts, invoiceLines, invoices } from '../db/schema'
import { audit } from '../lib/audit'
import { invalidate, tenantCachePattern } from '../lib/cache'
import { eventBus } from '../lib/event-bus'
import { nextDocumentId } from '../lib/ids'
import {
  createInvoicePaymentTransaction,
  createStockOutForInvoice,
  ensureStockAvailable,
  getProductStock,
} from '../lib/rules'
import { created, fail, ok } from '../lib/http'
import { sendMail } from '../lib/mailer'
import { requireRole } from '../middleware/auth'
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
  const tenantId = c.get('tenantId')
  const status = c.req.query('status')
  const search = c.req.query('search')
  const page = Math.max(1, Number(c.req.query('page') ?? 1))
  const limit = Math.min(100, Number(c.req.query('limit') ?? 50))
  const offset = (page - 1) * limit
  const filters: SQL[] = [
    tenantId ? eq(invoices.tenantId, tenantId) : undefined,
    status ? eq(invoices.status, status) : undefined,
    search ? ilike(invoices.customer, `%${search}%`) : undefined,
  ].filter((filter): filter is SQL => filter !== undefined)
  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(invoices)
      .where(filters.length ? and(...filters) : undefined)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<string>`count(*)` })
      .from(invoices)
      .where(filters.length ? and(...filters) : undefined),
  ])
  const lines = items.length
    ? await db.select().from(invoiceLines).where(inArray(invoiceLines.invoiceId, items.map((item) => item.id)))
    : []
  const now = new Date().toISOString().slice(0, 10)
  const normalized = items.map((item) => ({
    ...item,
    status: item.status === 'sent' && item.dueDate < now ? 'overdue' : item.status,
    relatedQuotation: item.relatedQuotationId,
    lines: lines
      .filter((line) => line.invoiceId === item.id)
      .sort((a, b) => a.lineOrder - b.lineOrder)
      .map((line) => ({
        productId: line.productId,
        product: line.product,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
        taxRate: Number(line.taxRate),
      })),
  }))
  const total = Number(countResult[0]?.count ?? 0)
  return ok(c, normalized, { total, page, limit, pages: Math.ceil(total / limit) })
})

invoicesRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  const tenantId = c.get('tenantId')
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.id, id),
        ...(tenantId ? [eq(invoices.tenantId, tenantId)] : []),
      ),
    )
  if (!invoice) return fail(c, 404, 'Invoice not found')
  const lines = await db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, id))
  return ok(c, {
    ...invoice,
    relatedQuotation: invoice.relatedQuotationId,
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

invoicesRoutes.post('/', validate(invoiceSchema), async (c) => {
  const body = c.get('validatedBody') as z.infer<typeof invoiceSchema>
  const user = c.get('user') as { id?: string } | undefined
  const tenantId = c.get('tenantId')
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
    tenantId,
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
  await invalidate(tenantCachePattern('reports:sales', tenantId))
  await invalidate(tenantCachePattern('reports:cashflow', tenantId))
  await invalidate(tenantCachePattern('products:list', tenantId))
  await audit({
    userId: user?.id,
    action: 'create',
    entity: 'invoice',
    entityId: id,
    newValues: body,
    ip: c.req.header('x-forwarded-for'),
    userAgent: c.req.header('user-agent'),
  })
  eventBus.emit('invoice.created', { invoiceId: id, userId: user?.id })
  return created(c, { id })
})

invoicesRoutes.put('/:id/status', validate(z.object({ status: z.string() })), async (c) => {
  const id = c.req.param('id')
  const body = c.get('validatedBody') as { status: string }
  const tenantId = c.get('tenantId')
  await db
    .update(invoices)
    .set({ status: body.status, updatedAt: new Date() })
    .where(
      and(
        eq(invoices.id, id),
        ...(tenantId ? [eq(invoices.tenantId, tenantId)] : []),
      ),
    )
  if (body.status === 'paid') {
    const total = await createInvoicePaymentTransaction(
      id,
      (c.get('user') as { id?: string } | undefined)?.id,
    )
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.id, id),
          ...(tenantId ? [eq(invoices.tenantId, tenantId)] : []),
        ),
      )
    const [account] = invoice?.currentAccountId
      ? await db
          .select()
          .from(currentAccounts)
          .where(
            and(
              eq(currentAccounts.id, invoice.currentAccountId),
              ...(tenantId ? [eq(currentAccounts.tenantId, tenantId)] : []),
            ),
          )
      : [null]

    eventBus.emit('invoice.paid', {
      invoiceId: id,
      amount: total,
      userId: (c.get('user') as { id?: string } | undefined)?.id,
    })

    if (invoice && account?.email) {
      await sendMail(
        account.email,
        `Tahsilat Makbuzu - ${invoice.id}`,
        `<p>Sayin ${invoice.customer}, ${invoice.id} numarali faturanin odemesi tahsil edildi.</p>`,
      )
    }
  }
  await invalidate(tenantCachePattern('reports:cashflow', tenantId))
  await invalidate(tenantCachePattern('finance:summary', tenantId))
  return ok(c, { id, status: body.status })
})

invoicesRoutes.put('/:id', validate(invoiceSchema), async (c) => {
  const id = c.req.param('id')
  const body = c.get('validatedBody') as z.infer<typeof invoiceSchema>
  const tenantId = c.get('tenantId')
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.id, id),
        ...(tenantId ? [eq(invoices.tenantId, tenantId)] : []),
      ),
    )

  if (!invoice) {
    return fail(c, 404, 'Invoice not found')
  }

  if (invoice.status !== 'draft') {
    return fail(c, 422, 'Only draft invoices can be updated')
  }

  const existingLines = await db
    .select()
    .from(invoiceLines)
    .where(eq(invoiceLines.invoiceId, id))

  const reservedQuantities = existingLines.reduce<Record<string, number>>((accumulator, line) => {
    if (!line.productId) {
      return accumulator
    }

    accumulator[line.productId] =
      (accumulator[line.productId] ?? 0) + Number(line.quantity)
    return accumulator
  }, {})

  for (const line of body.lines) {
    if (!line.productId) {
      continue
    }

    const stock = await getProductStock(line.productId)
    const available = stock + (reservedQuantities[line.productId] ?? 0)
    if (available < line.quantity) {
      return fail(c, 422, 'Insufficient stock', {
        ok: false,
        productId: line.productId,
        available,
      })
    }
  }

  await db
    .update(invoices)
    .set({
      currentAccountId: body.currentAccountId,
      customer: body.customer,
      issueDate: body.issueDate,
      dueDate: body.dueDate,
      status: body.status,
      note: body.note,
      relatedQuotationId: body.relatedQuotationId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(invoices.id, id),
        ...(tenantId ? [eq(invoices.tenantId, tenantId)] : []),
      ),
    )

  await db.delete(invoiceLines).where(eq(invoiceLines.invoiceId, id))
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
  await invalidate(tenantCachePattern('reports:sales', tenantId))
  await invalidate(tenantCachePattern('reports:cashflow', tenantId))
  await invalidate(tenantCachePattern('products:list', tenantId))
  return ok(c, { id })
})

invoicesRoutes.delete('/:id', requireRole('admin', 'manager'), async (c) => {
  const id = c.req.param('id')
  const tenantId = c.get('tenantId')
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.id, id),
        ...(tenantId ? [eq(invoices.tenantId, tenantId)] : []),
      ),
    )
  if (invoice?.status !== 'draft') {
    return fail(c, 422, 'Only draft invoices can be deleted')
  }
  await db.delete(invoiceLines).where(eq(invoiceLines.invoiceId, id))
  await db
    .delete(invoices)
    .where(
      and(
        eq(invoices.id, id),
        ...(tenantId ? [eq(invoices.tenantId, tenantId)] : []),
      ),
    )
  await invalidate(tenantCachePattern('reports:sales', tenantId))
  await invalidate(tenantCachePattern('reports:cashflow', tenantId))
  return ok(c, { id })
})
