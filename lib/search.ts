import { currentAccounts } from '@/lib/data/accounts'
import { companies, contacts, deals, leads, tasks } from '@/lib/data/crm'
import { transactions } from '@/lib/data/finance'
import { invoices, invoiceStatusMeta, invoiceTotals } from '@/lib/data/invoices'
import {
  quotations,
  quotationStatusMeta,
  quotationTotals,
} from '@/lib/data/quotations'
import { getStockStatus, products } from '@/lib/data/products'
import type { BadgeVariant } from '@/lib/ui-meta'
import { formatCurrency } from '@/lib/ui-meta'

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
  badgeVariant?: BadgeVariant
  score: number
  searchableText: string
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

function buildSearchIndex(): SearchResult[] {
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
    moduleKey: 'crm',
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
    moduleKey: 'crm',
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

  return [
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
}

const searchIndex = buildSearchIndex()

export function searchGlobalRecords(query: string) {
  const normalizedQuery = normalize(query)

  if (!normalizedQuery) {
    return []
  }

  return searchIndex
    .map((item) => ({
      ...item,
      score: scoreMatch(normalizedQuery, item.searchableText),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'tr'))
}
