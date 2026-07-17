import { Hono } from 'hono'
import { eq, inArray } from 'drizzle-orm'
import { db } from '../db/client'
import {
  deals,
  invoiceLines,
  invoices,
  leads,
  products,
  stockMovements,
  transactions,
} from '../db/schema'
import { cached, tenantCacheKey } from '../lib/cache'
import { ok } from '../lib/http'
import { toNumber } from '../lib/serializers'

export const reportsRoutes = new Hono()

reportsRoutes.get('/sales-summary', async (c) => {
  const tenantId = c.get('tenantId')
  const period = c.req.query('period') ?? 'month'
  const data = await cached(
    tenantCacheKey('reports:sales', tenantId, period),
    300,
    async () => {
      const invoiceItems = await db
        .select()
        .from(invoices)
        .where(tenantId ? eq(invoices.tenantId, tenantId) : undefined)
      const lineItems = invoiceItems.length
        ? await db
            .select()
            .from(invoiceLines)
            .where(inArray(invoiceLines.invoiceId, invoiceItems.map((item) => item.id)))
        : []
      const totalRevenue = lineItems.reduce((sum, line) => {
        const base = toNumber(line.quantity) * toNumber(line.unitPrice)
        return sum + base + base * (toNumber(line.taxRate) / 100)
      }, 0)

      return {
        totalRevenue,
        invoiceCount: invoiceItems.length,
        avgOrderValue: invoiceItems.length ? totalRevenue / invoiceItems.length : 0,
      }
    },
  )
  return ok(c, data)
})

reportsRoutes.get('/stock-value', async (c) => {
  const tenantId = c.get('tenantId')
  const [productItems, movementItems] = await Promise.all([
    db.select().from(products).where(tenantId ? eq(products.tenantId, tenantId) : undefined),
    db
      .select()
      .from(stockMovements)
      .where(tenantId ? eq(stockMovements.tenantId, tenantId) : undefined),
  ])
  const totalStockValue = productItems.reduce((sum, product) => {
    const stock = movementItems
      .filter((movement) => movement.productId === product.id)
      .reduce(
        (stockSum, movement) =>
          stockSum +
          (movement.type === 'out' ? -toNumber(movement.qty) : toNumber(movement.qty)),
        0,
      )
    return sum + stock * toNumber(product.costPrice)
  }, 0)
  return ok(c, { totalStockValue })
})

reportsRoutes.get('/cash-flow', async (c) => {
  const tenantId = c.get('tenantId')
  const period = c.req.query('period') ?? 'month'
  const data = await cached(
    tenantCacheKey('reports:cashflow', tenantId, period),
    300,
    async () => {
      const items = await db
        .select()
        .from(transactions)
        .where(tenantId ? eq(transactions.tenantId, tenantId) : undefined)

      const dailySeries = items.map((item) => ({
        date: item.date,
        income: item.type === 'income' ? toNumber(item.amount) : 0,
        expense: item.type === 'expense' ? toNumber(item.amount) : 0,
        net: item.type === 'income' ? toNumber(item.amount) : -toNumber(item.amount),
      }))

      return {
        dailySeries,
        totalIncome: dailySeries.reduce((sum, item) => sum + item.income, 0),
        totalExpense: dailySeries.reduce((sum, item) => sum + item.expense, 0),
      }
    },
  )
  return ok(c, data)
})

reportsRoutes.get('/crm-funnel', async (c) => {
  const tenantId = c.get('tenantId')
  const [leadItems, dealItems] = await Promise.all([
    db.select().from(leads).where(tenantId ? eq(leads.tenantId, tenantId) : undefined),
    db.select().from(deals).where(tenantId ? eq(deals.tenantId, tenantId) : undefined),
  ])
  const qualifiedCount = leadItems.filter((item) => item.status === 'qualified').length
  const wonDeals = dealItems.filter((item) => item.stage === 'won')
  return ok(c, {
    leadCount: leadItems.length,
    qualifiedCount,
    dealCount: dealItems.length,
    wonCount: wonDeals.length,
    totalWonValue: wonDeals.reduce((sum, item) => sum + toNumber(item.value), 0),
    conversionRate: leadItems.length ? wonDeals.length / leadItems.length : 0,
  })
})
