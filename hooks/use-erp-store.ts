'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Invoice, InvoiceLine } from '@/lib/data/invoices'
import { invoices as initialInvoices } from '@/lib/data/invoices'
import type { Product, ProductStatus } from '@/lib/data/products'
import { products as initialProducts } from '@/lib/data/products'
import type { Quotation, QuotationLine, QuotationStatus } from '@/lib/data/quotations'
import { quotations as initialQuotations } from '@/lib/data/quotations'
import { currentAccounts } from '@/lib/data/accounts'
import { companies, contacts, deals, leads, tasks } from '@/lib/data/crm'
import { transactions } from '@/lib/data/finance'
import { formatCurrency } from '@/lib/ui-meta'
import { getStockStatus } from '@/lib/data/products'
import { invoiceStatusMeta, invoiceTotals } from '@/lib/data/invoices'
import { quotationStatusMeta, quotationTotals } from '@/lib/data/quotations'

type StoredCollections = {
  products: Product[]
  invoices: Invoice[]
  quotations: Quotation[]
}

type SearchModuleKey =
  | 'urunler'
  | 'faturalar'
  | 'teklifler'
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

function joinMeta(...parts: Array<string | number>) {
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

export function useErpCollections() {
  const [collections, setCollections] = useState<StoredCollections>({
    products: initialProducts,
    invoices: initialInvoices,
    quotations: initialQuotations,
  })
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const nextCollections = {
      products: loadCollection(STORAGE_KEYS.products, initialProducts),
      invoices: loadCollection(STORAGE_KEYS.invoices, initialInvoices),
      quotations: loadCollection(STORAGE_KEYS.quotations, initialQuotations),
    }

    setCollections(nextCollections)
    setHydrated(true)
  }, [])

  const api = useMemo(
    () => ({
      hydrated,
      products: collections.products,
      invoices: collections.invoices,
      quotations: collections.quotations,
      getProductById: (id: string) =>
        collections.products.find((product) => product.id === id),
      getInvoiceById: (id: string) =>
        collections.invoices.find((invoice) => invoice.id === id),
      getQuotationById: (id: string) =>
        collections.quotations.find((quotation) => quotation.id === id),
      createProduct: (payload: {
        name: string
        sku: string
        barcode: string
        category: string
        brand: string
        unit: string
        costPrice: number
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

        const nextProducts = [nextProduct, ...collections.products]
        window.localStorage.setItem(
          STORAGE_KEYS.products,
          JSON.stringify(nextProducts),
        )
        setCollections((current) => ({ ...current, products: nextProducts }))
        return nextProduct
      },
      createInvoice: (payload: {
        customer: string
        issueDate: string
        dueDate: string
        note: string
        status?: Invoice['status']
        lines: InvoiceLine[]
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
        window.localStorage.setItem(
          STORAGE_KEYS.invoices,
          JSON.stringify(nextInvoices),
        )
        setCollections((current) => ({ ...current, invoices: nextInvoices }))
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

        const nextQuotations = [nextQuotation, ...collections.quotations]
        window.localStorage.setItem(
          STORAGE_KEYS.quotations,
          JSON.stringify(nextQuotations),
        )
        setCollections((current) => ({
          ...current,
          quotations: nextQuotations,
        }))
        return nextQuotation
      },
    }),
    [collections, hydrated],
  )

  return api
}

export function useErpSearchResults(query: string) {
  const { products, invoices, quotations } = useErpCollections()

  return useMemo(() => {
    const productResults: SearchResult[] = products.map((product) => {
      const stockMeta = getStockStatus(product)

      return {
        id: product.id,
        title: product.name,
        subtitle: joinMeta(product.sku, product.brand, product.category),
        href: `/urunler/${product.id}`,
        module: 'Urunler',
        moduleKey: 'urunler',
        badge: stockMeta.label,
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
          ...quotation.lines.map((line) => line.product),
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
        moduleKey: 'cari' as const,
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
        moduleKey: 'crm' as const,
        badge: 'Lead',
        badgeVariant: 'info',
        score: 0,
        searchableText: [
          lead.id,
          lead.name,
          lead.company,
          lead.source,
          lead.owner,
        ].join(' '),
      }))

    const dealResults: SearchResult[] = deals.map((deal) => ({
        id: deal.id,
        title: deal.title,
        subtitle: joinMeta(deal.customer, formatCurrency(deal.value)),
        href: `/anlasmalar#${deal.id}`,
        module: 'CRM',
        moduleKey: 'crm' as const,
        badge: 'Anlasma',
        badgeVariant: 'success',
        score: 0,
        searchableText: [
          deal.id,
          deal.title,
          deal.customer,
          deal.owner,
          deal.stage,
        ].join(' '),
      }))

    const companyResults: SearchResult[] = companies.map((company) => ({
        id: company.id,
        title: company.name,
        subtitle: joinMeta(company.sector, company.city),
        href: `/firmalar#${company.id}`,
        module: 'CRM',
        moduleKey: 'crm' as const,
        badge: 'Firma',
        badgeVariant: 'secondary',
        score: 0,
        searchableText: [
          company.id,
          company.name,
          company.sector,
          company.city,
        ].join(' '),
      }))

    const contactResults: SearchResult[] = contacts.map((contact) => ({
        id: contact.id,
        title: contact.name,
        subtitle: joinMeta(contact.company, contact.title),
        href: `/musteriler#${contact.id}`,
        module: 'CRM',
        moduleKey: 'crm' as const,
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
        moduleKey: 'crm' as const,
        badge: task.done ? 'Tamamlandi' : 'Acik',
        badgeVariant: task.done ? 'success' : 'warning',
        score: 0,
        searchableText: [
          task.id,
          task.title,
          task.related,
          task.owner,
          task.priority,
        ].join(' '),
      }))

    const transactionResults: SearchResult[] = transactions.map((transaction) => ({
        id: transaction.id,
        title: transaction.description,
        subtitle: joinMeta(
          transaction.account,
          formatCurrency(transaction.amount),
        ),
        href: `/kasa-banka#${transaction.id}`,
        module: 'Finans',
        moduleKey: 'finans' as const,
        badge: transaction.type === 'income' ? 'Gelir' : 'Gider',
        badgeVariant:
          transaction.type === 'income' ? 'success' : 'destructive',
        score: 0,
        searchableText: [
          transaction.id,
          transaction.description,
          transaction.account,
          transaction.category,
        ].join(' '),
      }))

    const allResults = [
      ...productResults,
      ...invoiceResults,
      ...quotationResults,
      ...accountResults,
      ...leadResults,
      ...dealResults,
      ...companyResults,
      ...contactResults,
      ...taskResults,
      ...transactionResults,
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
  }, [invoices, products, query, quotations])
}
