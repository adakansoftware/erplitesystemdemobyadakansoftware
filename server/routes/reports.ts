import { Hono } from 'hono'
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
import { ok } from '../lib/http'
import { toNumber } from '../lib/serializers'

export const reportsRoutes = new Hono()

reportsRoutes.get('/sales-summary', async (c) => {
  const [invoiceItems, lineItems] = await Promise.all([
    db.select().from(invoices),
    db.select().from(invoiceLines),
  ])
  const totalRevenue = lineItems.reduce((sum, line) => {
    const base = toNumber(line.quantity) * toNumber(line.unitPrice)
    return sum + base + base * (toNumber(line.taxRate) / 100)
  }, 0)
  return ok(c, {
    totalRevenue,
    invoiceCount: invoiceItems.length,
    avgOrderValue: invoiceItems.length ? totalRevenue / invoiceItems.length : 0,
  })
})

reportsRoutes.get('/stock-value', async (c) => {
  const [productItems, movementItems] = await Promise.all([
    db.select().from(products),
    db.select().from(stockMovements),
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
  const items = await db.select().from(transactions)
  const dailySeries = items.map((item) => ({
    date: item.date,
    income: item.type === 'income' ? toNumber(item.amount) : 0,
    expense: item.type === 'expense' ? toNumber(item.amount) : 0,
    net: item.type === 'income' ? toNumber(item.amount) : -toNumber(item.amount),
  }))
  return ok(c, {
    dailySeries,
    totalIncome: dailySeries.reduce((sum, item) => sum + item.income, 0),
    totalExpense: dailySeries.reduce((sum, item) => sum + item.expense, 0),
  })
})

reportsRoutes.get('/crm-funnel', async (c) => {
  const [leadItems, dealItems] = await Promise.all([
    db.select().from(leads),
    db.select().from(deals),
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
