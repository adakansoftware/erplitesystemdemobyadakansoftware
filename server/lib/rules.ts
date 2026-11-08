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
  warehouses,
} from '../db/schema'
import { insertWithGeneratedId, nextTransactionId } from './ids'
import { toNumber } from './serializers'

type DbExecutor = Pick<typeof db, 'select' | 'insert' | 'update' | 'delete'>

/**
 * Resolve the tenant's default warehouse instead of falling back to a
 * globally hardcoded id that may belong to another tenant.
 */
export async function resolveDefaultWarehouseId(tenantId?: string | null, exec: DbExecutor = db) {
  if (!tenantId) {
    return null
  }
  const [warehouse] = await exec
    .select({ id: warehouses.id })
    .from(warehouses)
    .where(eq(warehouses.tenantId, tenantId))
    .limit(1)
  return warehouse?.id ?? null
}

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

export async function createStockOutForInvoice(
  invoiceId: string,
  userId?: string,
  exec: DbExecutor = db,
) {
  const [invoice] = await exec.select().from(invoices).where(eq(invoices.id, invoiceId))
  if (!invoice) {
    return
  }

  await exec
    .delete(stockMovements)
    .where(
      and(
        eq(stockMovements.relatedDocType, 'invoice'),
        eq(stockMovements.relatedDocId, invoiceId),
        ...(invoice.tenantId ? [eq(stockMovements.tenantId, invoice.tenantId)] : []),
      ),
    )

  const lines = await exec
    .select()
    .from(invoiceLines)
    .where(eq(invoiceLines.invoiceId, invoiceId))

  const defaultWarehouseId = await resolveDefaultWarehouseId(invoice.tenantId, exec)

  for (const line of lines) {
    if (!line.productId) {
      continue
    }
    await exec.insert(stockMovements).values({
      tenantId: invoice.tenantId,
      productId: line.productId,
      warehouseId: defaultWarehouseId,
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
  exec: DbExecutor = db,
) {
  const [purchaseOrder] = await exec
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.id, purchaseOrderId))
  if (!purchaseOrder) {
    return
  }

  await exec
    .delete(stockMovements)
    .where(
      and(
        eq(stockMovements.relatedDocType, 'purchase_order'),
        eq(stockMovements.relatedDocId, purchaseOrderId),
        ...(purchaseOrder.tenantId ? [eq(stockMovements.tenantId, purchaseOrder.tenantId)] : []),
      ),
    )

  const lines = await exec
    .select()
    .from(purchaseOrderLines)
    .where(eq(purchaseOrderLines.purchaseOrderId, purchaseOrderId))

  const defaultWarehouseId =
    purchaseOrder.warehouseId ?? (await resolveDefaultWarehouseId(purchaseOrder.tenantId, exec))

  for (const line of lines) {
    if (!line.productId) {
      continue
    }
    await exec.insert(stockMovements).values({
      tenantId: purchaseOrder.tenantId,
      productId: line.productId,
      warehouseId: defaultWarehouseId,
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

  if (!account) {
    return total
  }

  await insertWithGeneratedId(
    async () =>
      (await db
        .select({ id: transactions.id })
        .from(transactions)
        .where(invoice.tenantId ? eq(transactions.tenantId, invoice.tenantId) : undefined)).map(
        (item) => item.id,
      ),
    (ids) => nextTransactionId(ids, invoice.tenantId),
    (nextId) =>
      db.insert(transactions).values({
        id: nextId,
        tenantId: invoice.tenantId,
        date: invoice.dueDate,
        description: `${invoice.customer} - Fatura tahsilati`,
        category: 'Tahsilat',
        financeAccountId: account.id,
        type: 'income',
        amount: String(total.toFixed(2)),
        relatedDocType: 'invoice',
        relatedDocId: invoice.id,
        currentAccountId: invoice.currentAccountId,
        createdBy: userId,
      }),
  )

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
