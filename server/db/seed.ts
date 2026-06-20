import 'dotenv/config'
import { db, sql as postgresClient } from './client'
import {
  companies as companiesTable,
  companySettings,
  contacts as contactsTable,
  currentAccounts as currentAccountsTable,
  deals as dealsTable,
  financeAccounts as financeAccountsTable,
  invoiceLines as invoiceLinesTable,
  invoices as invoicesTable,
  leads as leadsTable,
  productCategories,
  products as productsTable,
  purchaseOrderLines as purchaseOrderLinesTable,
  purchaseOrders as purchaseOrdersTable,
  quotationLines as quotationLinesTable,
  quotations as quotationsTable,
  stockMovements as stockMovementsTable,
  tasks as tasksTable,
  transactions as transactionsTable,
  users,
  warehouses as warehousesTable,
} from './schema'
import { hashPassword } from '../lib/auth'
import { currentAccounts } from '../../lib/data/accounts'
import { companies, contacts, deals, leads, tasks } from '../../lib/data/crm'
import { financeAccounts, transactions } from '../../lib/data/finance'
import { stockMovements as mockStockMovements, warehouses } from '../../lib/data/inventory'
import { invoiceTotals, invoices } from '../../lib/data/invoices'
import { productCategories as mockCategories, products } from '../../lib/data/products'
import { purchases } from '../../lib/data/purchases'
import { quotations } from '../../lib/data/quotations'
import { sql } from 'drizzle-orm'

async function main() {
  await db.execute(sql`truncate table
    transactions,
    finance_accounts,
    purchase_order_lines,
    purchase_orders,
    invoice_lines,
    invoices,
    quotation_lines,
    quotations,
    tasks,
    deals,
    contacts,
    companies,
    leads,
    stock_movements,
    warehouses,
    products,
    product_categories,
    current_accounts,
    company_settings,
    users
    restart identity cascade`)

  const categoryMap = new Map<string, string>()
  for (const category of mockCategories) {
    const [row] = await db
      .insert(productCategories)
      .values({ name: category })
      .returning()
    categoryMap.set(category, row.id)
  }

  const [adminUser] = await db
    .insert(users)
    .values({
      email: 'admin@demo.com',
      passwordHash: hashPassword('demo123'),
      name: 'Mehmet Adakan',
      role: 'admin',
    })
    .returning()

  await db.insert(companySettings).values({
    id: 1,
    name: 'Adakan Endustriyel Cozumler Ltd. Sti.',
    taxNumber: '1234567890',
    taxOffice: 'Ikitelli',
    address: 'Ikitelli OSB Mah. Demirciler Cad. No:18 Basaksehir / Istanbul',
    city: 'Istanbul',
    phone: '0212 555 00 55',
    email: 'info@adakan.com.tr',
    website: 'www.adakan.com.tr',
    logoUrl: 'https://dummyimage.com/160x48/e9eef8/1f3b63&text=Adakan+ERP',
    currency: 'TRY',
  })

  await db.insert(currentAccountsTable).values(
    currentAccounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      taxNumber: account.taxNumber,
      city: account.city,
      phone: account.phone,
      email: account.email,
      creditLimit: String(account.creditLimit),
    })),
  )

  await db.insert(productsTable).values(
    products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      categoryId: categoryMap.get(product.category),
      brand: product.brand,
      unit: product.unit,
      costPrice: String(product.costPrice),
      salePrice: String(product.salePrice),
      taxRate: String(product.taxRate),
      reorderPoint: product.reorderPoint,
      status: product.status,
      description: product.description,
      createdAt: new Date(product.createdAt),
      updatedAt: new Date(product.createdAt),
    })),
  )

  await db.insert(warehousesTable).values(warehouses)
  await db.insert(stockMovementsTable).values(
    products
      .map((product) => {
        const netRecentMovements = mockStockMovements
          .filter((movement) => movement.productId === product.id)
          .reduce((sum, movement) => {
            const qty = Math.abs(movement.qty)
            return sum + (movement.type === 'out' ? -qty : qty)
          }, 0)

        const openingQty = Math.max(product.stock - netRecentMovements, 0)

        return {
          productId: product.id,
          warehouseId: 'WH-01',
          type: 'adjustment',
          qty: String(openingQty),
          unitCost: String(product.costPrice),
          relatedDocType: 'opening_balance',
          relatedDocId: product.id,
          note: 'Acilis stok bakiyesi',
          createdBy: adminUser.id,
          createdAt: new Date(`${product.createdAt}T08:00:00.000Z`),
        }
      })
      .filter((movement) => Number(movement.qty) > 0),
  )
  await db.insert(stockMovementsTable).values(
    mockStockMovements.map((movement) => ({
      productId: movement.productId,
      warehouseId: movement.warehouseId,
      type: movement.type,
      qty: String(Math.abs(movement.qty)),
      relatedDocType: movement.relatedDoc?.startsWith('FT-')
        ? 'invoice'
        : movement.relatedDoc?.startsWith('ALIS-')
          ? 'purchase_order'
          : movement.relatedDoc?.startsWith('TRF-')
            ? 'transfer'
            : movement.relatedDoc?.startsWith('SAYIM-')
              ? 'adjustment'
              : undefined,
      relatedDocId: movement.relatedDoc,
      note: movement.note,
      createdBy: adminUser.id,
      createdAt: new Date(`${movement.date}T10:00:00.000Z`),
    })),
  )
  await db.insert(leadsTable).values(
    leads.map((lead) => ({
      ...lead,
      value: String(lead.value),
      createdAt: new Date(lead.createdAt),
      updatedAt: new Date(lead.createdAt),
    })),
  )
  await db.insert(companiesTable).values(companies)
  await db.insert(contactsTable).values(
    contacts.map((contact) => {
      const company = companies.find((item) => item.name === contact.company)
      return { ...contact, companyId: company?.id }
    }),
  )
  await db.insert(dealsTable).values(
    deals.map((deal) => {
      const account = currentAccounts.find((item) => item.name === deal.customer)
      return { ...deal, currentAccountId: account?.id, value: String(deal.value) }
    }),
  )
  await db.insert(tasksTable).values(tasks)
  await db.insert(financeAccountsTable).values(financeAccounts)
  await db.insert(transactionsTable).values(
    transactions.map((transaction) => {
      const account = financeAccounts.find((item) => item.name === transaction.account)
      const currentAccount = currentAccounts.find((item) =>
        transaction.description.includes(item.name.split(' ')[0]),
      )
      return {
        id: transaction.id,
        date: transaction.date,
        description: transaction.description,
        category: transaction.category,
        financeAccountId: account?.id ?? financeAccounts[0].id,
        type: transaction.type,
        amount: String(transaction.amount),
        currentAccountId: currentAccount?.id,
      }
    }),
  )

  for (const quotation of quotations) {
    const account = currentAccounts.find((item) => item.name === quotation.customer)
    await db.insert(quotationsTable).values({
      id: quotation.id,
      currentAccountId: account?.id,
      customer: quotation.customer,
      date: quotation.date,
      validUntil: quotation.validUntil,
      status: quotation.status,
      note: quotation.note,
    })
    await db.insert(quotationLinesTable).values(
      quotation.lines.map((line, index) => ({
        quotationId: quotation.id,
        productId: products.find((item) => item.name === line.product)?.id,
        product: line.product,
        quantity: String(line.quantity),
        unitPrice: String(line.unitPrice),
        taxRate: String(line.taxRate),
        lineOrder: index,
      })),
    )
  }

  for (const invoice of invoices) {
    const account = currentAccounts.find((item) => item.name === invoice.customer)
    await db.insert(invoicesTable).values({
      id: invoice.id,
      currentAccountId: account?.id,
      customer: invoice.customer,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      note: invoice.note,
      relatedQuotationId: invoice.relatedQuotation,
    })
    await db.insert(invoiceLinesTable).values(
      invoice.lines.map((line, index) => ({
        invoiceId: invoice.id,
        productId: products.find((item) => item.name === line.product)?.id,
        product: line.product,
        quantity: String(line.quantity),
        unitPrice: String(line.unitPrice),
        taxRate: String(line.taxRate),
        lineOrder: index,
      })),
    )
  }

  for (const purchase of purchases) {
    const account = currentAccounts.find((item) => item.name === purchase.supplier)
    await db.insert(purchaseOrdersTable).values({
      id: purchase.id,
      currentAccountId: account?.id,
      supplier: purchase.supplier,
      orderDate: purchase.orderDate,
      expectedDate: purchase.expectedDate,
      status: purchase.status,
      note: purchase.note,
      warehouseId: warehouses[0].id,
    })
    await db.insert(purchaseOrderLinesTable).values(
      purchase.lines.map((line, index) => ({
        purchaseOrderId: purchase.id,
        productId: products.find((item) => item.name === line.product)?.id,
        product: line.product,
        quantity: String(line.qty),
        unitPrice: String(line.unitPrice),
        taxRate: String(line.taxRate),
        receivedQty: String(purchase.status === 'received' ? line.qty : 0),
        lineOrder: index,
      })),
    )
  }

  console.log('Seed tamamlandi')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
}).finally(async () => {
  await postgresClient.end({ timeout: 5 })
})
