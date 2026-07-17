import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../db/client'
import {
  currentAccounts,
  financeAccounts,
  invoiceLines,
  invoices,
  products,
  purchaseOrderLines,
  purchaseOrders,
  stockMovements,
  transactions,
} from '../db/schema'
import { nextTransactionId } from './ids'
import { toNumber } from './serializers'

export async function getProductStock(productId: string, tenantId?: string) {
  const [result] = await db
    .select({
      qty: sql<string>`coalesce(sum(case when ${stockMovements.type} = 'out' then -${stockMovements.qty} else ${stockMovements.qty} end), 0)`,
    })
    .from(stockMovements)
    .where(
      and(
        eq(stockMovements.productId, productId),
        ...(tenantId ? [eq(stockMovements.tenantId, tenantId)] : []),
      ),
    )

  return toNumber(result?.qty)
}

export async function ensureStockAvailable(
  lines: Array<{ productId: string | null; quantity: number }>,
  tenantId?: string,
) {
  for (const line of lines) {
    if (!line.productId) {
      continue
    }

    const stock = await getProductStock(line.productId, tenantId)
    if (stock < line.quantity) {
      return {
        ok: false as const,
        productId: line.productId,
        available: stock,
      }
    }
  }

  return { ok: true as const }
}

export async function createStockOutForInvoice(invoiceId: string, userId?: string) {
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId))
  if (!invoice) {
    return
  }

  await db
    .delete(stockMovements)
    .where(
      and(
        eq(stockMovements.relatedDocType, 'invoice'),
        eq(stockMovements.relatedDocId, invoiceId),
        ...(invoice.tenantId ? [eq(stockMovements.tenantId, invoice.tenantId)] : []),
      ),
    )

  const lines = await db
    .select()
    .from(invoiceLines)
    .where(eq(invoiceLines.invoiceId, invoiceId))

  for (const line of lines) {
    if (!line.productId) {
      continue
    }
    await db.insert(stockMovements).values({
      tenantId: invoice.tenantId,
      productId: line.productId,
      warehouseId: 'WH-01',
      type: 'out',
      qty: String(line.quantity),
      unitCost: String(line.unitPrice),
      relatedDocType: 'invoice',
      relatedDocId: invoiceId,
      note: 'Fatura kaynakli stok cikisi',
      createdBy: userId,
    })
  }
}

export async function createStockInForPurchaseOrder(
  purchaseOrderId: string,
  userId?: string,
) {
  const [purchaseOrder] = await db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.id, purchaseOrderId))
  if (!purchaseOrder) {
    return
  }

  await db
    .delete(stockMovements)
    .where(
      and(
        eq(stockMovements.relatedDocType, 'purchase_order'),
        eq(stockMovements.relatedDocId, purchaseOrderId),
        ...(purchaseOrder.tenantId ? [eq(stockMovements.tenantId, purchaseOrder.tenantId)] : []),
      ),
    )

  const lines = await db
    .select()
    .from(purchaseOrderLines)
    .where(eq(purchaseOrderLines.purchaseOrderId, purchaseOrderId))

  for (const line of lines) {
    if (!line.productId) {
      continue
    }
    await db.insert(stockMovements).values({
      tenantId: purchaseOrder.tenantId,
      productId: line.productId,
      warehouseId: purchaseOrder.warehouseId ?? 'WH-01',
      type: 'in',
      qty: String(line.receivedQty ?? line.quantity),
      unitCost: String(line.unitPrice),
      relatedDocType: 'purchase_order',
      relatedDocId: purchaseOrderId,
      note: 'Satin alma kaynakli stok girisi',
      createdBy: userId,
    })
  }
}

export async function createInvoicePaymentTransaction(
  invoiceId: string,
  userId?: string,
) {
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId))
  if (!invoice) {
    return 0
  }

  const lines = await db
    .select()
    .from(invoiceLines)
    .where(eq(invoiceLines.invoiceId, invoiceId))

  const total = lines.reduce((sum, line) => {
    const base = toNumber(line.quantity) * toNumber(line.unitPrice)
    return sum + base + base * (toNumber(line.taxRate) / 100)
  }, 0)

  const [account] = await db
    .select()
    .from(financeAccounts)
    .where(
      and(
        eq(financeAccounts.type, 'bank'),
        ...(invoice.tenantId ? [eq(financeAccounts.tenantId, invoice.tenantId)] : []),
      ),
    )

  const ids = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(invoice.tenantId ? eq(transactions.tenantId, invoice.tenantId) : undefined)

  await db.insert(transactions).values({
    id: nextTransactionId(ids.map((item) => item.id), invoice.tenantId),
    tenantId: invoice.tenantId,
    date: invoice.dueDate,
    description: `${invoice.customer} - Fatura tahsilati`,
    category: 'Tahsilat',
    financeAccountId: account?.id ?? 'ACC-BANK-1',
    type: 'income',
    amount: String(total.toFixed(2)),
    relatedDocType: 'invoice',
    relatedDocId: invoice.id,
    currentAccountId: invoice.currentAccountId,
    createdBy: userId,
  })

  return total
}

export async function calculateCurrentAccountBalance(
  currentAccountId: string,
  tenantId?: string,
) {
  const [result] = await db
    .select({
      balance: sql<string>`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.amount} else -${transactions.amount} end), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.currentAccountId, currentAccountId),
        ...(tenantId ? [eq(transactions.tenantId, tenantId)] : []),
      ),
    )

  return toNumber(result?.balance)
}

export async function attachProductStocks<T extends { id: string; tenantId?: string | null }>(items: T[]) {
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      totalStock: await getProductStock(item.id, item.tenantId ?? undefined),
    })),
  )
}
