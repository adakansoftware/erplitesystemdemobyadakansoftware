'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api/client'
import {
  accountStatements,
  currentAccounts as initialCurrentAccounts,
  defaultStatement,
  type AccountStatementRow,
  type CurrentAccount,
} from '@/lib/data/accounts'
import {
  companies as initialCompanies,
  contacts as initialContacts,
  deals as initialDeals,
  leads as initialLeads,
  tasks as initialTasks,
  type Company,
  type Contact,
  type Deal,
  type Lead,
  type Task,
} from '@/lib/data/crm'
import {
  financeAccounts as initialFinanceAccounts,
  transactions as initialTransactions,
  type FinanceAccount,
  type Transaction,
} from '@/lib/data/finance'
import {
  stockMovements as initialStockMovements,
  warehouses as initialWarehouses,
  type MovementType,
  type StockMovement,
  type Warehouse,
} from '@/lib/data/inventory'
import {
  invoices as initialInvoices,
  invoiceStatusMeta,
  invoiceTotals,
  type Invoice,
  type InvoiceLine,
} from '@/lib/data/invoices'
import {
  getStockStatus,
  productCategories as initialProductCategories,
  products as initialProducts,
  productStatusMeta,
  type Product,
  type ProductStatus,
} from '@/lib/data/products'
import {
  purchases as initialPurchases,
  purchaseStatusMeta,
  purchaseTotals,
  type PurchaseOrder,
  type PurchaseOrderLine,
  type PurchaseOrderStatus,
} from '@/lib/data/purchases'
import {
  quotationStatusMeta,
  quotationTotals,
  quotations as initialQuotations,
  type Quotation,
  type QuotationLine,
  type QuotationStatus,
} from '@/lib/data/quotations'
import { formatCurrency } from '@/lib/ui-meta'

type FinanceTransaction = Transaction & {
  currentAccountId?: string | null
  financeAccountId?: string | null
}

type StoreState = {
  hydrated: boolean
  error: string | null
  products: Product[]
  productCategories: string[]
  invoices: Invoice[]
  quotations: Quotation[]
  purchases: PurchaseOrder[]
  currentAccounts: CurrentAccount[]
  tasks: Task[]
  stockMovements: StockMovement[]
  leads: Lead[]
  deals: Deal[]
  companies: Company[]
  contacts: Contact[]
  financeAccounts: FinanceAccount[]
  transactions: FinanceTransaction[]
  warehouses: Warehouse[]
}

type SearchModuleKey =
  | 'urunler'
  | 'faturalar'
  | 'teklifler'
  | 'satin-alma'
  | 'cari'
  | 'crm'
  | 'finans'

export type SearchResult = {
  id: string
  title: string
  subtitle: string
  href: string
  module: string
  moduleKey: SearchModuleKey
  badge?: string
  badgeVariant?:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'success'
    | 'warning'
    | 'info'
    | 'outline'
    | 'ghost'
  score: number
  searchableText: string
}

const initialState: StoreState = {
  hydrated: false,
  error: null,
  products: initialProducts,
  productCategories: initialProductCategories,
  invoices: initialInvoices,
  quotations: initialQuotations,
  purchases: initialPurchases,
  currentAccounts: initialCurrentAccounts,
  tasks: initialTasks,
  stockMovements: initialStockMovements,
  leads: initialLeads,
  deals: initialDeals,
  companies: initialCompanies,
  contacts: initialContacts,
  financeAccounts: initialFinanceAccounts,
  transactions: initialTransactions,
  warehouses: initialWarehouses,
}

let storeState = initialState
let pendingRefresh: Promise<void> | null = null
const listeners = new Set<(state: StoreState) => void>()

function emit(nextState: StoreState) {
  storeState = nextState
  listeners.forEach((listener) => listener(storeState))
}

function setStoreState(nextState: StoreState | ((state: StoreState) => StoreState)) {
  emit(typeof nextState === 'function' ? nextState(storeState) : nextState)
}

function nextSequenceId(ids: string[], prefix: string) {
  const nextValue =
    ids
      .map((id) => Number(id.replace(`${prefix}-`, '')))
      .filter((value) => Number.isFinite(value))
      .reduce((max, value) => Math.max(max, value), 0) + 1

  return `${prefix}-${String(nextValue).padStart(3, '0')}`
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function joinMeta(...parts: Array<string | number | undefined>) {
  return parts.filter(Boolean).join(' - ')
}

function scoreMatch(query: string, searchableText: string) {
  if (!query) return 0

  const normalizedQuery = normalize(query)
  const normalizedText = normalize(searchableText)

  if (!normalizedText.includes(normalizedQuery)) {
    return 0
  }

  let score = normalizedQuery.length

  if (normalizedText.startsWith(normalizedQuery)) {
    score += 10
  }

  if (normalizedText.includes(` ${normalizedQuery}`)) {
    score += 4
  }

  return score
}

function productIdByName(products: Product[], productName: string) {
  return products.find((product) => product.name === productName)?.id ?? ''
}

function mapProduct(item: any): Product {
  return {
    id: item.id,
    name: item.name ?? '',
    sku: item.sku ?? '',
    barcode: item.barcode ?? '',
    category: item.category ?? '',
    brand: item.brand ?? '',
    unit: item.unit ?? 'Adet',
    costPrice: Number(item.costPrice ?? 0),
    supplierPrice: Number(item.supplierPrice ?? item.costPrice ?? 0),
    salePrice: Number(item.salePrice ?? 0),
    taxRate: Number(item.taxRate ?? 0),
    stock: Number(item.stock ?? item.totalStock ?? 0),
    reorderPoint: Number(item.reorderPoint ?? 0),
    status: (item.status ?? 'active') as ProductStatus,
    description: item.description ?? '',
    createdAt: String(item.createdAt ?? new Date().toISOString()).slice(0, 10),
  }
}

function mapInvoiceLine(line: any): InvoiceLine {
  return {
    product: line.product ?? '',
    quantity: Number(line.quantity ?? 0),
    unitPrice: Number(line.unitPrice ?? 0),
    taxRate: Number(line.taxRate ?? 0),
  }
}

function mapInvoice(item: any): Invoice {
  return {
    id: item.id,
    customer: item.customer ?? '',
    issueDate: item.issueDate ?? '',
    dueDate: item.dueDate ?? '',
    status: item.status ?? 'draft',
    lines: Array.isArray(item.lines) ? item.lines.map(mapInvoiceLine) : [],
    note: item.note ?? '',
    relatedQuotation: item.relatedQuotation ?? item.relatedQuotationId ?? undefined,
  }
}

function mapQuotationLine(line: any): QuotationLine {
  return {
    product: line.product ?? '',
    quantity: Number(line.quantity ?? 0),
    unitPrice: Number(line.unitPrice ?? 0),
    taxRate: Number(line.taxRate ?? 0),
  }
}

function mapQuotation(item: any): Quotation {
  return {
    id: item.id,
    customer: item.customer ?? '',
    date: item.date ?? '',
    validUntil: item.validUntil ?? '',
    status: item.status ?? 'draft',
    lines: Array.isArray(item.lines) ? item.lines.map(mapQuotationLine) : [],
    note: item.note ?? '',
    relatedInvoice: item.relatedInvoice ?? item.convertedToInvoiceId ?? undefined,
  }
}

function mapPurchaseLine(line: any): PurchaseOrderLine {
  return {
    id: line.id ?? undefined,
    product: line.product ?? '',
    qty: Number(line.qty ?? line.quantity ?? 0),
    unitPrice: Number(line.unitPrice ?? 0),
    taxRate: Number(line.taxRate ?? 0),
    receivedQty: Number(line.receivedQty ?? 0),
  }
}

function mapPurchase(item: any): PurchaseOrder {
  return {
    id: item.id,
    supplier: item.supplier ?? '',
    orderDate: item.orderDate ?? '',
    expectedDate: item.expectedDate ?? '',
    status: item.status ?? 'draft',
    note: item.note ?? '',
    lines: Array.isArray(item.lines) ? item.lines.map(mapPurchaseLine) : [],
  }
}

function mapCurrentAccount(item: any): CurrentAccount {
  return {
    id: item.id,
    name: item.name ?? '',
    type: item.type === 'supplier' ? 'supplier' : 'customer',
    taxNumber: item.taxNumber ?? '',
    city: item.city ?? '',
    phone: item.phone ?? '',
    email: item.email ?? '',
    balance: Number(item.balance ?? 0),
    creditLimit: Number(item.creditLimit ?? 0),
  }
}

function mapTask(item: any): Task {
  return {
    id: item.id,
    title: item.title ?? '',
    related: item.related ?? '',
    due: item.due ?? '',
    priority: (item.priority ?? 'medium') as Task['priority'],
    done: Boolean(item.done),
    owner: item.owner ?? '',
  }
}

function mapMovement(item: any): StockMovement {
  return {
    id: item.id,
    productId: item.productId ?? '',
    warehouseId: item.warehouseId ?? 'WH-01',
    date:
      typeof item.date === 'string'
        ? item.date.slice(0, 10)
        : String(item.createdAt ?? '').slice(0, 10),
    qty: Number(item.qty ?? 0),
    note: item.note ?? '',
    relatedDoc: item.relatedDoc ?? item.relatedDocId ?? undefined,
    product: item.product ?? '',
    sku: item.sku ?? '',
    type: (item.type ?? 'in') as MovementType,
    warehouse: item.warehouse ?? 'Merkez Depo',
    user: item.user ?? 'ERP Lite',
  }
}

function mapLead(item: any): Lead {
  return {
    id: item.id,
    name: item.name ?? '',
    company: item.company ?? '',
    source: item.source ?? '',
    status: (item.status ?? 'new') as Lead['status'],
    value: Number(item.value ?? 0),
    owner: item.owner ?? '',
    createdAt: String(item.createdAt ?? '').slice(0, 10),
  }
}

function mapFinanceAccount(item: any): FinanceAccount {
  return {
    id: item.id,
    name: item.name ?? '',
    type: item.type === 'cash' ? 'cash' : 'bank',
    bankName: item.bankName ?? undefined,
    iban: item.iban ?? undefined,
    currency: item.currency ?? 'TRY',
    balance: Number(item.balance ?? 0),
  }
}

function mapTransaction(item: any): FinanceTransaction {
  return {
    id: item.id,
    date: item.date ?? '',
    description: item.description ?? '',
    category: item.category ?? '',
    account: item.account ?? '',
    type: item.type === 'expense' ? 'expense' : 'income',
    amount: Number(item.amount ?? 0),
    currentAccountId: item.currentAccountId ?? undefined,
    financeAccountId: item.financeAccountId ?? undefined,
  }
}

function mapWarehouse(item: any): Warehouse {
  return {
    id: item.id,
    name: item.name ?? '',
    location: item.location ?? '',
    manager: item.manager ?? '',
    capacity: Number(item.capacity ?? 0),
    used: Number(item.used ?? 0),
    itemCount: Number(item.itemCount ?? 0),
    status: item.active === false ? 'passive' : 'active',
  }
}

type CollectionResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string }

async function requestCollection<T>(
  label: string,
  promise: Promise<T>,
): Promise<CollectionResult<T>> {
  try {
    const resolved = await promise
    const data =
      resolved &&
      typeof resolved === 'object' &&
      'data' in (resolved as Record<string, unknown>)
        ? ((resolved as unknown as { data: T }).data as T)
        : resolved

    return { ok: true, data }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? `${label}: ${error.message}` : `${label}: Veri alinamadi`,
    }
  }
}

async function refreshStore() {
  if (pendingRefresh) {
    return pendingRefresh
  }

  pendingRefresh = (async () => {
    const [
      rawProducts,
      rawProductCategories,
      rawInvoices,
      rawQuotations,
      rawPurchases,
      rawCurrentAccounts,
      rawTasks,
      rawMovements,
      rawLeads,
      rawDeals,
      rawCompanies,
      rawContacts,
      rawFinanceAccounts,
      rawTransactions,
      rawWarehouses,
    ] = await Promise.all([
      requestCollection('Urunler', api.get<any[]>('/products')),
      requestCollection('Urun kategorileri', api.get<any[]>('/products/categories')),
      requestCollection('Faturalar', api.get<any[]>('/invoices')),
      requestCollection('Teklifler', api.get<any[]>('/quotations')),
      requestCollection('Satin alma', api.get<any[]>('/purchase-orders')),
      requestCollection('Cari hesaplar', api.get<any[]>('/current-accounts')),
      requestCollection('Gorevler', api.get<any[]>('/crm/tasks')),
      requestCollection('Stok hareketleri', api.get<any[]>('/stock/movements')),
      requestCollection('Leads', api.get<any[]>('/crm/leads')),
      requestCollection('Anlasmalar', api.get<any[]>('/crm/deals')),
      requestCollection('Firmalar', api.get<any[]>('/crm/companies')),
      requestCollection('Kontaklar', api.get<any[]>('/crm/contacts')),
      requestCollection('Kasa banka hesaplari', api.get<any[]>('/finance/accounts')),
      requestCollection('Finans hareketleri', api.get<any[]>('/finance/transactions')),
      requestCollection('Depolar', api.get<any[]>('/stock/warehouses')),
    ])

    const collectionErrors = [
      rawProducts,
      rawProductCategories,
      rawInvoices,
      rawQuotations,
      rawPurchases,
      rawCurrentAccounts,
      rawTasks,
      rawMovements,
      rawLeads,
      rawDeals,
      rawCompanies,
      rawContacts,
      rawFinanceAccounts,
      rawTransactions,
      rawWarehouses,
    ]
      .filter((result) => !result.ok)
      .map((result) => result.message)

    const currentAccounts = rawCurrentAccounts.ok
      ? rawCurrentAccounts.data.map(mapCurrentAccount)
      : storeState.currentAccounts
    const currentAccountMap = new Map(currentAccounts.map((account) => [account.id, account.name]))

    const financeAccounts = rawFinanceAccounts.ok
      ? rawFinanceAccounts.data.map(mapFinanceAccount)
      : storeState.financeAccounts

    const warehouses = rawWarehouses.ok
      ? rawWarehouses.data.map(mapWarehouse)
      : storeState.warehouses

    const warehouseMap = new Map(warehouses.map((warehouse) => [warehouse.id, warehouse]))
    const products = rawProducts.ok ? rawProducts.data.map(mapProduct) : storeState.products
    const productCategories = rawProductCategories.ok
      ? Array.from(
          new Set(
            rawProductCategories.data
              .map((item: any) => item.name ?? '')
              .filter(Boolean)
              .concat(products.map((product) => product.category).filter(Boolean)),
          ),
        ).sort((a, b) => a.localeCompare(b, 'tr'))
      : Array.from(
          new Set(
            storeState.productCategories.concat(
              products.map((product) => product.category).filter(Boolean),
            ),
          ),
        ).sort((a, b) => a.localeCompare(b, 'tr'))
    const transactions = rawTransactions.ok
      ? rawTransactions.data.map(mapTransaction)
      : storeState.transactions

    const companyRows = rawCompanies.ok ? rawCompanies.data : []
    const contactRows = rawContacts.ok ? rawContacts.data : []
    const dealRows = rawDeals.ok ? rawDeals.data : []
    const leadRows = rawLeads.ok ? rawLeads.data : []
    const movementRows = rawMovements.ok ? rawMovements.data : []
    const purchaseRows = rawPurchases.ok ? rawPurchases.data : []
    const invoiceRows = rawInvoices.ok ? rawInvoices.data : []
    const quotationRows = rawQuotations.ok ? rawQuotations.data : []
    const taskRows = rawTasks.ok ? rawTasks.data : []

    const deals = rawDeals.ok
      ? dealRows.map((item: any) => ({
      id: item.id,
      title: item.title ?? '',
      customer:
        item.customer ??
        (item.currentAccountId ? currentAccountMap.get(item.currentAccountId) ?? '' : ''),
      stage: (item.stage ?? 'lead') as Deal['stage'],
      value: Number(item.value ?? 0),
      owner: item.owner ?? '',
      closeDate: item.closeDate ?? '',
    }))
      : storeState.deals

    const contacts = rawContacts.ok
      ? contactRows.map((item: any) => ({
      id: item.id,
      name: item.name ?? '',
      title: item.title ?? '',
      company:
        item.company ??
        (item.companyId
          ? (companyRows.find((company: any) => company.id === item.companyId)?.name ?? '')
          : ''),
      email: item.email ?? '',
      phone: item.phone ?? '',
    }))
      : storeState.contacts

    const companies = rawCompanies.ok
      ? companyRows.map((item: any) => ({
      id: item.id,
      name: item.name ?? '',
      sector: item.sector ?? '',
      city: item.city ?? '',
      contacts: contacts.filter((contact) => contact.company === item.name).length,
      openDeals: deals.filter(
        (deal) => deal.customer === item.name && !['won', 'lost'].includes(deal.stage),
      ).length,
    }))
      : storeState.companies

    setStoreState({
      hydrated: true,
      error: collectionErrors.length ? collectionErrors.join(' | ') : null,
      products,
      productCategories,
      invoices: rawInvoices.ok ? invoiceRows.map(mapInvoice) : storeState.invoices,
      quotations: rawQuotations.ok
        ? quotationRows.map(mapQuotation)
        : storeState.quotations,
      purchases: rawPurchases.ok ? purchaseRows.map(mapPurchase) : storeState.purchases,
      currentAccounts,
      tasks: rawTasks.ok ? taskRows.map(mapTask) : storeState.tasks,
      stockMovements: rawMovements.ok
        ? movementRows.map((item: any) => ({
            ...mapMovement(item),
            warehouse:
              item.warehouse ??
              warehouseMap.get(item.warehouseId)?.name ??
              'Merkez Depo',
          }))
        : storeState.stockMovements,
      leads: rawLeads.ok ? leadRows.map(mapLead) : storeState.leads,
      deals,
      companies,
      contacts,
      financeAccounts,
      transactions,
      warehouses,
    })
  })()
    .catch((error) => {
      setStoreState((current) => ({
        ...current,
        hydrated: true,
        error: error instanceof Error ? error.message : 'Veri alinamadi',
      }))
    })
    .finally(() => {
      pendingRefresh = null
    })

  return pendingRefresh
}

function subscribe(listener: (state: StoreState) => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

async function createProductAction(payload: {
  name: string
  sku: string
  barcode: string
  category: string
  brand: string
  unit: string
  costPrice: number
  supplierPrice: number
  salePrice: number
  taxRate: number
  stock: number
  reorderPoint: number
  description: string
  status?: ProductStatus
}) {
  const created = await api.post<any>('/products', {
    name: payload.name,
    sku: payload.sku,
    barcode: payload.barcode,
    category: payload.category,
    brand: payload.brand,
    unit: payload.unit,
    costPrice: payload.costPrice,
    salePrice: payload.salePrice,
    taxRate: payload.taxRate,
    reorderPoint: payload.reorderPoint,
    description: payload.description,
    status: payload.status ?? 'active',
  })

  if (payload.stock > 0) {
    await api.post('/stock/movements', {
      productId: created.id,
      type: 'in',
      qty: payload.stock,
      note: 'Acilis stok bakiyesi',
      unitCost: payload.costPrice,
    })
  }

  await refreshStore()
  return storeState.products.find((product) => product.id === created.id) ?? mapProduct(created)
}

async function updateProductAction(
  id: string,
  payload: Partial<Omit<Product, 'id' | 'createdAt'> & { status: ProductStatus }>,
) {
  const current = storeState.products.find((product) => product.id === id)

  await api.put(`/products/${id}`, {
    name: payload.name,
    sku: payload.sku,
    barcode: payload.barcode,
    category: payload.category,
    brand: payload.brand,
    unit: payload.unit,
    costPrice: payload.costPrice,
    salePrice: payload.salePrice,
    taxRate: payload.taxRate,
    reorderPoint: payload.reorderPoint,
    description: payload.description,
    status: payload.status,
  })

  if (current && payload.stock != null && payload.stock !== current.stock) {
    const delta = payload.stock - current.stock
    await api.post('/stock/movements', {
      productId: id,
      type: delta > 0 ? 'in' : 'out',
      qty: Math.abs(delta),
      note: 'Urun karti stok duzeltmesi',
      unitCost: payload.costPrice ?? current.costPrice,
    })
  }

  await refreshStore()
  return storeState.products.find((product) => product.id === id)
}

async function createProductCategoryAction(name: string) {
  const trimmedName = name.trim()
  if (!trimmedName) {
    return null
  }

  await api.post('/products/categories', { name: trimmedName })
  await refreshStore()
  return (
    storeState.productCategories.find((category) => category === trimmedName) ??
    trimmedName
  )
}

async function addStockMovementAction(payload: {
  productId?: string
  product?: string
  warehouseId?: string
  warehouse?: string
  type: MovementType
  qty: number
  date?: string
  note: string
  relatedDoc?: string
}) {
  const product =
    payload.productId
      ? storeState.products.find((item) => item.id === payload.productId)
      : storeState.products.find((item) => item.name === payload.product)

  if (!product) {
    return null
  }

  const movement = await api.post<any>('/stock/movements', {
    productId: product.id,
    warehouseId: payload.warehouseId ?? 'WH-01',
    type: payload.type,
    qty: payload.qty,
    note: payload.note,
    unitCost: product.costPrice,
  })

  await refreshStore()
  return mapMovement({
    ...movement,
    product: product.name,
    sku: product.sku,
    warehouse: payload.warehouse ?? 'Merkez Depo',
    relatedDoc: payload.relatedDoc,
    date: payload.date,
  })
}

async function createQuotationAction(payload: {
  customer: string
  date: string
  validUntil: string
  note: string
  status?: QuotationStatus
  lines: QuotationLine[]
}) {
  const account = storeState.currentAccounts.find((item) => item.name === payload.customer)
  const created = await api.post<{ id: string }>('/quotations', {
    currentAccountId: account?.id,
    customer: payload.customer,
    date: payload.date,
    validUntil: payload.validUntil,
    note: payload.note,
    status: payload.status ?? 'draft',
    lines: payload.lines.map((line) => ({
      productId: productIdByName(storeState.products, line.product) || undefined,
      product: line.product,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      taxRate: line.taxRate,
    })),
  })

  await refreshStore()
  return storeState.quotations.find((quotation) => quotation.id === created.id)
}

async function updateQuotationAction(
  id: string,
  payload: Partial<{
    customer: string
    date: string
    validUntil: string
    note: string
    status: QuotationStatus
    lines: QuotationLine[]
  }>,
) {
  const requestBody: Record<string, unknown> = {}

  if (payload.customer != null) {
    const account = storeState.currentAccounts.find((item) => item.name === payload.customer)
    requestBody.currentAccountId = account?.id
    requestBody.customer = payload.customer
  }

  if (payload.date != null) requestBody.date = payload.date
  if (payload.validUntil != null) requestBody.validUntil = payload.validUntil
  if (payload.note != null) requestBody.note = payload.note
  if (payload.status != null) requestBody.status = payload.status
  if (payload.lines != null) {
    requestBody.lines = payload.lines.map((line) => ({
      productId: productIdByName(storeState.products, line.product) || undefined,
      product: line.product,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      taxRate: line.taxRate,
    }))
  }

  await api.put(`/quotations/${id}`, requestBody)
  await refreshStore()
  return storeState.quotations.find((quotation) => quotation.id === id) ?? null
}

async function updateQuotationStatusAction(id: string, status: QuotationStatus) {
  return updateQuotationAction(id, { status })
}

async function convertQuotationToInvoiceAction(quotationId: string) {
  const result = await api.post<{ invoiceId: string }>(`/quotations/${quotationId}/convert-to-invoice`, {})
  await refreshStore()
  return storeState.invoices.find((invoice) => invoice.id === result.invoiceId) ?? null
}

async function createInvoiceAction(payload: {
  customer: string
  issueDate: string
  dueDate: string
  note: string
  status?: Invoice['status']
  lines: InvoiceLine[]
  relatedQuotation?: string
}) {
  const account = storeState.currentAccounts.find((item) => item.name === payload.customer)
  const created = await api.post<{ id: string }>('/invoices', {
    currentAccountId: account?.id,
    customer: payload.customer,
    issueDate: payload.issueDate,
    dueDate: payload.dueDate,
    note: payload.note,
    status: payload.status ?? 'draft',
    relatedQuotationId: payload.relatedQuotation,
    lines: payload.lines.map((line) => ({
      productId: productIdByName(storeState.products, line.product) || undefined,
      product: line.product,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      taxRate: line.taxRate,
    })),
  })

  await refreshStore()
  return storeState.invoices.find((invoice) => invoice.id === created.id)
}

async function updateInvoiceAction(
  id: string,
  payload: {
    customer: string
    issueDate: string
    dueDate: string
    note: string
    status?: Invoice['status']
    lines: InvoiceLine[]
    relatedQuotation?: string
  },
) {
  const account = storeState.currentAccounts.find((item) => item.name === payload.customer)
  await api.put(`/invoices/${id}`, {
    currentAccountId: account?.id,
    customer: payload.customer,
    issueDate: payload.issueDate,
    dueDate: payload.dueDate,
    note: payload.note,
    status: payload.status ?? 'draft',
    relatedQuotationId: payload.relatedQuotation,
    lines: payload.lines.map((line) => ({
      productId: productIdByName(storeState.products, line.product) || undefined,
      product: line.product,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      taxRate: line.taxRate,
    })),
  })

  await refreshStore()
  return storeState.invoices.find((invoice) => invoice.id === id) ?? null
}

async function updateInvoiceStatusAction(id: string, status: Invoice['status']) {
  await api.put(`/invoices/${id}/status`, { status })
  await refreshStore()
  return storeState.invoices.find((invoice) => invoice.id === id) ?? null
}

async function createPurchaseOrderAction(payload: {
  supplier: string
  orderDate: string
  expectedDate: string
  note: string
  status?: PurchaseOrderStatus
  lines: PurchaseOrderLine[]
}) {
  const account = storeState.currentAccounts.find((item) => item.name === payload.supplier)
  const created = await api.post<{ id: string }>('/purchase-orders', {
    currentAccountId: account?.id,
    supplier: payload.supplier,
    orderDate: payload.orderDate,
    expectedDate: payload.expectedDate,
    note: payload.note,
    status: payload.status ?? 'draft',
    lines: payload.lines.map((line) => ({
      productId: productIdByName(storeState.products, line.product) || undefined,
      product: line.product,
      quantity: line.qty,
      unitPrice: line.unitPrice,
      taxRate: line.taxRate,
      receivedQty: payload.status === 'received' ? line.qty : 0,
    })),
  })

  await refreshStore()
  return storeState.purchases.find((purchase) => purchase.id === created.id)
}

async function updatePurchaseOrderAction(
  id: string,
  payload: Partial<Omit<PurchaseOrder, 'id'> & { status: PurchaseOrderStatus }>,
) {
  if (payload.status) {
    await api.put(`/purchase-orders/${id}/status`, { status: payload.status })
  }

  await refreshStore()
  return storeState.purchases.find((purchase) => purchase.id === id)
}

async function receivePurchaseOrderAction(
  id: string,
  lines: Array<{ lineId: string; receivedQty: number }>,
) {
  await api.post(`/purchase-orders/${id}/receive`, { lines })
  await refreshStore()
  return storeState.purchases.find((purchase) => purchase.id === id) ?? null
}

async function createCurrentAccountAction(payload: Omit<CurrentAccount, 'id'>) {
  const id = `CARI-${Date.now()}`
  await api.post('/current-accounts', {
    id,
    name: payload.name,
    type: payload.type,
    taxNumber: payload.taxNumber,
    city: payload.city,
    phone: payload.phone,
    email: payload.email,
    creditLimit: payload.creditLimit,
  })

  if (payload.balance !== 0) {
    const defaultAccount = storeState.financeAccounts.find((account) => account.type === 'bank')
    if (defaultAccount) {
      await api.post('/finance/transactions', {
        date: new Date().toISOString().slice(0, 10),
        description: `${payload.name} - Acilis bakiyesi`,
        category: 'Acilis',
        financeAccountId: defaultAccount.id,
        type: payload.balance > 0 ? 'income' : 'expense',
        amount: Math.abs(payload.balance),
        currentAccountId: id,
      })
    }
  }

  await refreshStore()
  return storeState.currentAccounts.find((account) => account.id === id)!
}

async function updateCurrentAccountAction(
  id: string,
  payload: Partial<Omit<CurrentAccount, 'id'>>,
) {
  const current = storeState.currentAccounts.find((account) => account.id === id)

  await api.put(`/current-accounts/${id}`, {
    name: payload.name,
    type: payload.type,
    taxNumber: payload.taxNumber,
    city: payload.city,
    phone: payload.phone,
    email: payload.email,
    creditLimit: payload.creditLimit,
  })

  if (current && payload.balance != null && payload.balance !== current.balance) {
    const delta = payload.balance - current.balance
    const defaultAccount = storeState.financeAccounts.find((account) => account.type === 'bank')
    if (defaultAccount) {
      await api.post('/finance/transactions', {
        date: new Date().toISOString().slice(0, 10),
        description: `${payload.name ?? current.name} - Bakiye duzeltmesi`,
        category: 'Duzeltme',
        financeAccountId: defaultAccount.id,
        type: delta > 0 ? 'income' : 'expense',
        amount: Math.abs(delta),
        currentAccountId: id,
      })
    }
  }

  await refreshStore()
  return storeState.currentAccounts.find((account) => account.id === id)
}

async function deleteCurrentAccountAction(id: string) {
  await api.delete(`/current-accounts/${id}`)
  await refreshStore()
}

async function createTaskAction(payload: Omit<Task, 'id' | 'done'> & { done?: boolean }) {
  const id = nextSequenceId(storeState.tasks.map((task) => task.id), 'TK')
  await api.post('/crm/tasks', {
    id,
    title: payload.title,
    related: payload.related,
    due: payload.due,
    priority: payload.priority,
    owner: payload.owner,
    done: payload.done ?? false,
  })
  await refreshStore()
  return storeState.tasks.find((task) => task.id === id)!
}

async function toggleTaskAction(id: string) {
  await api.patch(`/crm/tasks/${id}/toggle`, {})
  await refreshStore()
  return storeState.tasks.find((task) => task.id === id)
}

async function deleteTaskAction(id: string) {
  await api.delete(`/crm/tasks/${id}`)
  await refreshStore()
}

function getStatementByAccountId(accountId: string) {
  const accountTransactions = storeState.transactions
    .filter((transaction) => transaction.currentAccountId === accountId)
    .sort((a, b) => a.date.localeCompare(b.date))

  if (!accountTransactions.length) {
    return accountStatements[accountId] ?? defaultStatement
  }

  let balance = 0
  return accountTransactions.map<AccountStatementRow>((transaction) => {
    const debit = transaction.type === 'income' ? transaction.amount : 0
    const credit = transaction.type === 'expense' ? transaction.amount : 0
    balance += debit - credit
    return {
      id: transaction.id,
      date: transaction.date,
      description: transaction.description,
      debit,
      credit,
      balance,
    }
  })
}

export function useErpCollections() {
  const [state, setState] = useState(storeState)

  useEffect(() => subscribe(setState), [])

  useEffect(() => {
    if (!storeState.hydrated && !pendingRefresh) {
      void refreshStore()
    }
  }, [])

  return useMemo(
    () => ({
      ...state,
      refresh: refreshStore,
      getProductById: (id: string) =>
        state.products.find((product) => product.id === id),
      getInvoiceById: (id: string) =>
        state.invoices.find((invoice) => invoice.id === id),
      getQuotationById: (id: string) =>
        state.quotations.find((quotation) => quotation.id === id),
      getPurchaseById: (id: string) =>
        state.purchases.find((purchase) => purchase.id === id),
      getCurrentAccountById: (id: string) =>
        state.currentAccounts.find((account) => account.id === id),
      getStatementByAccountId,
      createProduct: createProductAction,
      createProductCategory: createProductCategoryAction,
      updateProduct: updateProductAction,
      addStockMovement: addStockMovementAction,
      createInvoice: createInvoiceAction,
      updateInvoice: updateInvoiceAction,
      updateInvoiceStatus: updateInvoiceStatusAction,
      createQuotation: createQuotationAction,
      updateQuotation: updateQuotationAction,
      updateQuotationStatus: updateQuotationStatusAction,
      convertQuotationToInvoice: convertQuotationToInvoiceAction,
      createPurchaseOrder: createPurchaseOrderAction,
      updatePurchaseOrder: updatePurchaseOrderAction,
      receivePurchaseOrder: receivePurchaseOrderAction,
      createCurrentAccount: createCurrentAccountAction,
      updateCurrentAccount: updateCurrentAccountAction,
      deleteCurrentAccount: deleteCurrentAccountAction,
      createTask: createTaskAction,
      toggleTask: toggleTaskAction,
      deleteTask: deleteTaskAction,
    }),
    [state],
  )
}

export function useErpSearchResults(query: string) {
  const {
    companies,
    contacts,
    currentAccounts,
    deals,
    financeAccounts,
    invoices,
    leads,
    products,
    purchases,
    quotations,
    stockMovements,
    tasks,
    transactions,
  } = useErpCollections()

  return useMemo(() => {
    const productResults: SearchResult[] = products.map((product) => {
      const stockMeta = getStockStatus(product)
      const statusMeta = productStatusMeta[product.status]

      return {
        id: product.id,
        title: product.name,
        subtitle: joinMeta(product.sku, product.brand, product.category),
        href: `/urunler/${product.id}`,
        module: 'Urunler',
        moduleKey: 'urunler',
        badge: `${stockMeta.label} / ${statusMeta.label}`,
        badgeVariant: stockMeta.variant,
        score: 0,
        searchableText: [
          product.id,
          product.name,
          product.sku,
          product.barcode,
          product.brand,
          product.category,
          product.description,
        ].join(' '),
      }
    })

    const invoiceResults: SearchResult[] = invoices.map((invoice) => {
      const total = invoiceTotals(invoice.lines).total
      const meta = invoiceStatusMeta[invoice.status]

      return {
        id: invoice.id,
        title: invoice.id,
        subtitle: joinMeta(invoice.customer, formatCurrency(total)),
        href: `/faturalar/${invoice.id}`,
        module: 'Faturalar',
        moduleKey: 'faturalar',
        badge: meta.label,
        badgeVariant: meta.variant,
        score: 0,
        searchableText: [
          invoice.id,
          invoice.customer,
          invoice.note,
          invoice.relatedQuotation ?? '',
          ...invoice.lines.map((line) => line.product),
        ].join(' '),
      }
    })

    const quotationResults: SearchResult[] = quotations.map((quotation) => {
      const total = quotationTotals(quotation.lines).total
      const meta = quotationStatusMeta[quotation.status]

      return {
        id: quotation.id,
        title: quotation.id,
        subtitle: joinMeta(quotation.customer, formatCurrency(total)),
        href: `/teklifler/${quotation.id}`,
        module: 'Teklifler',
        moduleKey: 'teklifler',
        badge: meta.label,
        badgeVariant: meta.variant,
        score: 0,
        searchableText: [
          quotation.id,
          quotation.customer,
          quotation.note,
          quotation.relatedInvoice ?? '',
          ...quotation.lines.map((line) => line.product),
        ].join(' '),
      }
    })

    const purchaseResults: SearchResult[] = purchases.map((purchase) => {
      const total = purchaseTotals(purchase.lines).total
      const meta = purchaseStatusMeta[purchase.status]

      return {
        id: purchase.id,
        title: purchase.id,
        subtitle: joinMeta(purchase.supplier, formatCurrency(total)),
        href: `/satin-alma/${purchase.id}`,
        module: 'Satin Alma',
        moduleKey: 'satin-alma',
        badge: meta.label,
        badgeVariant: meta.variant,
        score: 0,
        searchableText: [
          purchase.id,
          purchase.supplier,
          purchase.note,
          ...purchase.lines.map((line) => line.product),
        ].join(' '),
      }
    })

    const accountResults: SearchResult[] = currentAccounts.map((account) => ({
      id: account.id,
      title: account.name,
      subtitle: joinMeta(
        account.taxNumber,
        account.city,
        formatCurrency(account.balance),
      ),
      href: `/cari-hesaplar#${account.id}`,
      module: 'Cari Hesaplar',
      moduleKey: 'cari',
      badge: account.type === 'customer' ? 'Musteri' : 'Tedarikci',
      badgeVariant: account.type === 'customer' ? 'success' : 'warning',
      score: 0,
      searchableText: [
        account.id,
        account.name,
        account.taxNumber,
        account.city,
        account.phone,
        account.email,
      ].join(' '),
    }))

    const leadResults: SearchResult[] = leads.map((lead) => ({
      id: lead.id,
      title: lead.name,
      subtitle: joinMeta(lead.company, formatCurrency(lead.value)),
      href: `/leads#${lead.id}`,
      module: 'CRM',
      moduleKey: 'crm',
      badge: 'Lead',
      badgeVariant: 'info',
      score: 0,
      searchableText: [lead.id, lead.name, lead.company, lead.source, lead.owner].join(
        ' ',
      ),
    }))

    const dealResults: SearchResult[] = deals.map((deal) => ({
      id: deal.id,
      title: deal.title,
      subtitle: joinMeta(deal.customer, formatCurrency(deal.value)),
      href: `/anlasmalar#${deal.id}`,
      module: 'CRM',
      moduleKey: 'crm',
      badge: 'Anlasma',
      badgeVariant: 'success',
      score: 0,
      searchableText: [deal.id, deal.title, deal.customer, deal.owner, deal.stage].join(
        ' ',
      ),
    }))

    const companyResults: SearchResult[] = companies.map((company) => ({
      id: company.id,
      title: company.name,
      subtitle: joinMeta(company.sector, company.city),
      href: `/firmalar#${company.id}`,
      module: 'CRM',
      moduleKey: 'crm',
      badge: 'Firma',
      badgeVariant: 'secondary',
      score: 0,
      searchableText: [company.id, company.name, company.sector, company.city].join(
        ' ',
      ),
    }))

    const contactResults: SearchResult[] = contacts.map((contact) => ({
      id: contact.id,
      title: contact.name,
      subtitle: joinMeta(contact.company, contact.title),
      href: `/musteriler#${contact.id}`,
      module: 'CRM',
      moduleKey: 'crm',
      badge: 'Kontak',
      badgeVariant: 'outline',
      score: 0,
      searchableText: [
        contact.id,
        contact.name,
        contact.company,
        contact.title,
        contact.email,
        contact.phone,
      ].join(' '),
    }))

    const taskResults: SearchResult[] = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      subtitle: joinMeta(task.related, task.owner),
      href: `/gorevler#${task.id}`,
      module: 'CRM',
      moduleKey: 'crm',
      badge: task.done ? 'Tamamlandi' : 'Acik',
      badgeVariant: task.done ? 'success' : 'warning',
      score: 0,
      searchableText: [task.id, task.title, task.related, task.owner, task.priority].join(
        ' ',
      ),
    }))

    const transactionResults: SearchResult[] = transactions.map((transaction) => ({
      id: transaction.id,
      title: transaction.description,
      subtitle: joinMeta(transaction.account, formatCurrency(transaction.amount)),
      href: `/kasa-banka#${transaction.id}`,
      module: 'Finans',
      moduleKey: 'finans',
      badge: transaction.type === 'income' ? 'Gelir' : 'Gider',
      badgeVariant: transaction.type === 'income' ? 'success' : 'destructive',
      score: 0,
      searchableText: [
        transaction.id,
        transaction.description,
        transaction.account,
        transaction.category,
      ].join(' '),
    }))

    const movementResults: SearchResult[] = stockMovements.map((movement) => ({
      id: movement.id,
      title: movement.product,
      subtitle: joinMeta(movement.relatedDoc ?? movement.note, `${movement.qty} adet`),
      href: `/stok#${movement.id}`,
      module: 'Stok',
      moduleKey: 'urunler',
      badge: movement.type,
      badgeVariant:
        movement.type === 'in'
          ? 'success'
          : movement.type === 'out'
            ? 'destructive'
            : movement.type === 'transfer'
              ? 'info'
              : 'warning',
      score: 0,
      searchableText: [
        movement.id,
        movement.product,
        movement.sku,
        movement.note,
        movement.relatedDoc ?? '',
      ].join(' '),
    }))

    const allResults = [
      ...productResults,
      ...invoiceResults,
      ...quotationResults,
      ...purchaseResults,
      ...accountResults,
      ...leadResults,
      ...dealResults,
      ...companyResults,
      ...contactResults,
      ...taskResults,
      ...transactionResults,
      ...movementResults,
    ]
    const normalizedQuery = normalize(query)

    if (!normalizedQuery) {
      return []
    }

    return allResults
      .map((item) => ({
        ...item,
        score: scoreMatch(normalizedQuery, item.searchableText),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'tr'))
  }, [
    companies,
    contacts,
    currentAccounts,
    deals,
    financeAccounts,
    invoices,
    leads,
    products,
    purchases,
    query,
    quotations,
    stockMovements,
    tasks,
    transactions,
  ])
}
