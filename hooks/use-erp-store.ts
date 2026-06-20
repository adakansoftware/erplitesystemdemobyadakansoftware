'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  accountStatements,
  currentAccounts as initialCurrentAccounts,
  defaultStatement,
  type CurrentAccount,
} from '@/lib/data/accounts'
import {
  companies,
  contacts,
  deals,
  leads,
  tasks as initialTasks,
  type Task,
} from '@/lib/data/crm'
import { financeAccounts, transactions } from '@/lib/data/finance'
import {
  stockMovements as initialStockMovements,
  type MovementType,
  type StockMovement,
} from '@/lib/data/inventory'
import {
  invoices as initialInvoices,
  invoiceStatusMeta,
  invoiceTotals,
  type Invoice,
  type InvoiceLine,
} from '@/lib/data/invoices'
import {
  products as initialProducts,
  productStatusMeta,
  getStockStatus,
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
  quotations as initialQuotations,
  quotationStatusMeta,
  quotationTotals,
  type Quotation,
  type QuotationLine,
  type QuotationStatus,
} from '@/lib/data/quotations'
import { formatCurrency } from '@/lib/ui-meta'

type StoredCollections = {
  products: Product[]
  invoices: Invoice[]
  quotations: Quotation[]
  purchases: PurchaseOrder[]
  currentAccounts: CurrentAccount[]
  tasks: Task[]
  stockMovements: StockMovement[]
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

const STORAGE_KEYS = {
  products: 'adakan-erp-products',
  invoices: 'adakan-erp-invoices',
  quotations: 'adakan-erp-quotations',
  purchases: 'adakan-erp-purchases',
  currentAccounts: 'adakan-erp-current-accounts',
  tasks: 'adakan-erp-tasks',
  stockMovements: 'adakan-erp-stock-movements',
} as const

function loadCollection<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback
  }

  const raw = window.localStorage.getItem(key)
  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
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

function nextSequenceId(ids: string[], prefix: string) {
  const nextValue =
    ids
      .map((id) => Number(id.replace(`${prefix}-`, '')))
      .filter((value) => Number.isFinite(value))
      .reduce((max, value) => Math.max(max, value), 0) + 1

  return `${prefix}-${String(nextValue).padStart(4, '0')}`
}

function nextDocumentId(ids: string[], prefix: string) {
  const nextValue =
    ids
      .map((id) => {
        const parts = id.split('-')
        return Number(parts[parts.length - 1])
      })
      .filter((value) => Number.isFinite(value))
      .reduce((max, value) => Math.max(max, value), 0) + 1

  return `${prefix}-2024-${String(nextValue).padStart(4, '0')}`
}

function productIdByName(products: Product[], productName: string) {
  return products.find((product) => product.name === productName)?.id ?? ''
}

function productSkuByName(products: Product[], productName: string) {
  return products.find((product) => product.name === productName)?.sku ?? ''
}

function saveCollection<K extends keyof StoredCollections>(
  key: K,
  value: StoredCollections[K],
) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value))
}

export function useErpCollections() {
  const [collections, setCollections] = useState<StoredCollections>({
    products: initialProducts,
    invoices: initialInvoices,
    quotations: initialQuotations,
    purchases: initialPurchases,
    currentAccounts: initialCurrentAccounts,
    tasks: initialTasks,
    stockMovements: initialStockMovements,
  })
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const nextCollections = {
      products: loadCollection(STORAGE_KEYS.products, initialProducts),
      invoices: loadCollection(STORAGE_KEYS.invoices, initialInvoices),
      quotations: loadCollection(STORAGE_KEYS.quotations, initialQuotations),
      purchases: loadCollection(STORAGE_KEYS.purchases, initialPurchases),
      currentAccounts: loadCollection(
        STORAGE_KEYS.currentAccounts,
        initialCurrentAccounts,
      ),
      tasks: loadCollection(STORAGE_KEYS.tasks, initialTasks),
      stockMovements: loadCollection(
        STORAGE_KEYS.stockMovements,
        initialStockMovements,
      ),
    }

    setCollections(nextCollections)
    setHydrated(true)
  }, [])

  const api = useMemo(() => {
    const persist = <K extends keyof StoredCollections>(
      key: K,
      value: StoredCollections[K],
    ) => {
      saveCollection(key, value)
      setCollections((current) => ({ ...current, [key]: value }))
      return value
    }

    const updateProductStock = (
      currentProducts: Product[],
      productName: string,
      delta: number,
    ) => {
      return currentProducts.map((product) =>
        product.name === productName
          ? { ...product, stock: Math.max(product.stock + delta, 0) }
          : product,
      )
    }

    const buildStockMovement = (payload: {
      type: MovementType
      product: string
      qty: number
      warehouse?: string
      warehouseId?: string
      note: string
      relatedDoc?: string
      user?: string
      date?: string
    }): StockMovement => ({
      id: nextSequenceId(
        collections.stockMovements.map((movement) => movement.id),
        'MOV',
      ),
      productId: productIdByName(collections.products, payload.product),
      warehouseId: payload.warehouseId ?? 'WH-01',
      date: payload.date ?? new Date().toISOString().slice(0, 10),
      qty: payload.qty,
      note: payload.note,
      relatedDoc: payload.relatedDoc,
      product: payload.product,
      sku: productSkuByName(collections.products, payload.product),
      type: payload.type,
      warehouse: payload.warehouse ?? 'Merkez Depo',
      user: payload.user ?? 'ERP Lite',
    })

    return {
      hydrated,
      products: collections.products,
      invoices: collections.invoices,
      quotations: collections.quotations,
      purchases: collections.purchases,
      currentAccounts: collections.currentAccounts,
      tasks: collections.tasks,
      stockMovements: collections.stockMovements,
      getProductById: (id: string) =>
        collections.products.find((product) => product.id === id),
      getInvoiceById: (id: string) =>
        collections.invoices.find((invoice) => invoice.id === id),
      getQuotationById: (id: string) =>
        collections.quotations.find((quotation) => quotation.id === id),
      getPurchaseById: (id: string) =>
        collections.purchases.find((purchase) => purchase.id === id),
      getCurrentAccountById: (id: string) =>
        collections.currentAccounts.find((account) => account.id === id),
      getStatementByAccountId: (id: string) =>
        accountStatements[id] ?? defaultStatement,
      createProduct: (payload: {
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
      }) => {
        const nextProduct: Product = {
          id: nextSequenceId(
            collections.products.map((product) => product.id),
            'PRD',
          ),
          createdAt: new Date().toISOString().slice(0, 10),
          status: payload.status ?? 'active',
          ...payload,
        }

        persist('products', [nextProduct, ...collections.products])
        return nextProduct
      },
      updateProduct: (
        id: string,
        payload: Partial<
          Omit<Product, 'id' | 'createdAt'> & { status: ProductStatus }
        >,
      ) => {
        const nextProducts = collections.products.map((product) =>
          product.id === id ? { ...product, ...payload } : product,
        )
        persist('products', nextProducts)
        return nextProducts.find((product) => product.id === id)
      },
      addStockMovement: (payload: {
        productId?: string
        product?: string
        warehouseId?: string
        warehouse?: string
        type: MovementType
        qty: number
        date?: string
        note: string
        relatedDoc?: string
      }) => {
        const targetProduct =
          payload.productId
            ? collections.products.find((item) => item.id === payload.productId)
            : collections.products.find((item) => item.name === payload.product)

        if (!targetProduct) {
          return null
        }

        const nextMovement = buildStockMovement({
          type: payload.type,
          product: targetProduct.name,
          qty: payload.qty,
          warehouse: payload.warehouse,
          warehouseId: payload.warehouseId,
          note: payload.note,
          relatedDoc: payload.relatedDoc,
          date: payload.date,
        })

        const stockDelta =
          payload.type === 'in'
            ? payload.qty
            : payload.type === 'out'
              ? -payload.qty
              : payload.type === 'adjustment'
                ? payload.qty
                : 0

        const nextProducts = updateProductStock(
          collections.products,
          targetProduct.name,
          stockDelta,
        )
        const nextMovements = [nextMovement, ...collections.stockMovements]

        persist('products', nextProducts)
        persist('stockMovements', nextMovements)
        return nextMovement
      },
      createInvoice: (payload: {
        customer: string
        issueDate: string
        dueDate: string
        note: string
        status?: Invoice['status']
        lines: InvoiceLine[]
        relatedQuotation?: string
      }) => {
        const nextInvoice: Invoice = {
          id: nextDocumentId(
            collections.invoices.map((invoice) => invoice.id),
            'FT',
          ),
          status: payload.status ?? 'draft',
          ...payload,
        }

        const nextInvoices = [nextInvoice, ...collections.invoices]
        let nextProducts = collections.products
        let nextMovements = collections.stockMovements

        if (nextInvoice.status !== 'cancelled') {
          payload.lines.forEach((line) => {
            nextProducts = updateProductStock(nextProducts, line.product, -line.quantity)

            nextMovements = [
              {
                id: nextSequenceId(
                  nextMovements.map((movement) => movement.id),
                  'MOV',
                ),
                productId: productIdByName(nextProducts, line.product),
                warehouseId: 'WH-01',
                date: nextInvoice.issueDate,
                qty: line.quantity,
                note: 'Fatura kaynakli stok cikisi',
                relatedDoc: nextInvoice.id,
                product: line.product,
                sku: productSkuByName(nextProducts, line.product),
                type: 'out',
                warehouse: 'Merkez Depo',
                user: 'ERP Lite',
              },
              ...nextMovements,
            ]
          })
        }

        persist('invoices', nextInvoices)
        persist('products', nextProducts)
        persist('stockMovements', nextMovements)
        return nextInvoice
      },
      createQuotation: (payload: {
        customer: string
        date: string
        validUntil: string
        note: string
        status?: QuotationStatus
        lines: QuotationLine[]
      }) => {
        const nextQuotation: Quotation = {
          id: nextDocumentId(
            collections.quotations.map((quotation) => quotation.id),
            'TKL',
          ),
          status: payload.status ?? 'draft',
          ...payload,
        }

        persist('quotations', [nextQuotation, ...collections.quotations])
        return nextQuotation
      },
      convertQuotationToInvoice: (quotationId: string) => {
        const quotation = collections.quotations.find((item) => item.id === quotationId)
        if (!quotation) {
          return null
        }

        const nextInvoice: Invoice = {
          id: nextDocumentId(
            collections.invoices.map((invoice) => invoice.id),
            'FT',
          ),
          customer: quotation.customer,
          issueDate: new Date().toISOString().slice(0, 10),
          dueDate: quotation.validUntil,
          status: 'draft',
          note: quotation.note,
          relatedQuotation: quotation.id,
          lines: quotation.lines.map((line) => ({
            product: line.product,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            taxRate: line.taxRate,
          })),
        }

        const nextQuotations = collections.quotations.map((item) =>
          item.id === quotationId
            ? ({ ...item, status: 'accepted', relatedInvoice: nextInvoice.id } as Quotation)
            : item,
        )

        let nextProducts = collections.products
        let nextMovements = collections.stockMovements

        nextInvoice.lines.forEach((line) => {
          nextProducts = updateProductStock(nextProducts, line.product, -line.quantity)
          nextMovements = [
            {
              id: nextSequenceId(
                nextMovements.map((movement) => movement.id),
                'MOV',
              ),
              productId: productIdByName(nextProducts, line.product),
              warehouseId: 'WH-01',
              date: nextInvoice.issueDate,
              qty: line.quantity,
              note: 'Tekliften faturaya donusum stok cikisi',
              relatedDoc: nextInvoice.id,
              product: line.product,
              sku: productSkuByName(nextProducts, line.product),
              type: 'out',
              warehouse: 'Merkez Depo',
              user: 'ERP Lite',
            },
            ...nextMovements,
          ]
        })

        persist('quotations', nextQuotations)
        persist('invoices', [nextInvoice, ...collections.invoices])
        persist('products', nextProducts)
        persist('stockMovements', nextMovements)
        return nextInvoice
      },
      createPurchaseOrder: (payload: {
        supplier: string
        orderDate: string
        expectedDate: string
        note: string
        status?: PurchaseOrderStatus
        lines: PurchaseOrderLine[]
      }) => {
        const nextPurchase: PurchaseOrder = {
          id: nextDocumentId(
            collections.purchases.map((purchase) => purchase.id),
            'SPA',
          ),
          status: payload.status ?? 'draft',
          ...payload,
        }

        let nextProducts = collections.products
        let nextMovements = collections.stockMovements

        if (nextPurchase.status === 'received' || nextPurchase.status === 'partial') {
          nextPurchase.lines.forEach((line) => {
            nextProducts = updateProductStock(nextProducts, line.product, line.qty)
            nextMovements = [
              {
                id: nextSequenceId(
                  nextMovements.map((movement) => movement.id),
                  'MOV',
                ),
                productId: productIdByName(nextProducts, line.product),
                warehouseId: 'WH-01',
                date: nextPurchase.orderDate,
                qty: line.qty,
                note: 'Satin alma kaynakli stok girisi',
                relatedDoc: nextPurchase.id,
                product: line.product,
                sku: productSkuByName(nextProducts, line.product),
                type: 'in',
                warehouse: 'Merkez Depo',
                user: 'ERP Lite',
              },
              ...nextMovements,
            ]
          })
        }

        persist('purchases', [nextPurchase, ...collections.purchases])
        persist('products', nextProducts)
        persist('stockMovements', nextMovements)
        return nextPurchase
      },
      updatePurchaseOrder: (
        id: string,
        payload: Partial<
          Omit<PurchaseOrder, 'id'> & { status: PurchaseOrderStatus }
        >,
      ) => {
        const nextPurchases = collections.purchases.map((purchase) =>
          purchase.id === id ? { ...purchase, ...payload } : purchase,
        )
        persist('purchases', nextPurchases)
        return nextPurchases.find((purchase) => purchase.id === id)
      },
      createCurrentAccount: (payload: Omit<CurrentAccount, 'id'>) => {
        const nextAccount: CurrentAccount = {
          id: nextSequenceId(
            collections.currentAccounts.map((account) => account.id),
            'CARI',
          ),
          ...payload,
        }

        persist('currentAccounts', [nextAccount, ...collections.currentAccounts])
        return nextAccount
      },
      updateCurrentAccount: (
        id: string,
        payload: Partial<Omit<CurrentAccount, 'id'>>,
      ) => {
        const nextAccounts = collections.currentAccounts.map((account) =>
          account.id === id ? { ...account, ...payload } : account,
        )
        persist('currentAccounts', nextAccounts)
        return nextAccounts.find((account) => account.id === id)
      },
      deleteCurrentAccount: (id: string) => {
        const nextAccounts = collections.currentAccounts.filter(
          (account) => account.id !== id,
        )
        persist('currentAccounts', nextAccounts)
      },
      createTask: (payload: Omit<Task, 'id' | 'done'> & { done?: boolean }) => {
        const nextTask: Task = {
          id: nextSequenceId(collections.tasks.map((task) => task.id), 'TK'),
          done: payload.done ?? false,
          ...payload,
        }

        persist('tasks', [nextTask, ...collections.tasks])
        return nextTask
      },
      toggleTask: (id: string) => {
        const nextTasks = collections.tasks.map((task) =>
          task.id === id ? { ...task, done: !task.done } : task,
        )
        persist('tasks', nextTasks)
        return nextTasks.find((task) => task.id === id)
      },
      deleteTask: (id: string) => {
        persist(
          'tasks',
          collections.tasks.filter((task) => task.id !== id),
        )
      },
    }
  }, [collections, hydrated])

  return api
}

export function useErpSearchResults(query: string) {
  const {
    products,
    invoices,
    quotations,
    purchases,
    currentAccounts,
    tasks,
    stockMovements,
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
    currentAccounts,
    invoices,
    products,
    purchases,
    query,
    quotations,
    stockMovements,
    tasks,
  ])
}
