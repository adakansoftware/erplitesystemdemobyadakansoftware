import type { BadgeVariant } from '@/lib/ui-meta'

export type InvoiceStatus = 'draft' | 'paid' | 'overdue' | 'cancelled' | 'sent'

export const invoiceStatusMeta: Record<
  InvoiceStatus,
  { label: string; variant: BadgeVariant }
> = {
  draft: { label: 'Taslak', variant: 'secondary' },
  sent: { label: 'Gonderildi', variant: 'info' },
  paid: { label: 'Odendi', variant: 'success' },
  overdue: { label: 'Gecikmis', variant: 'destructive' },
  cancelled: { label: 'Iptal', variant: 'warning' },
}

export type InvoiceLine = {
  product: string
  quantity: number
  unitPrice: number
  taxRate: number
}

export type Invoice = {
  id: string
  customer: string
  issueDate: string
  dueDate: string
  status: InvoiceStatus
  lines: InvoiceLine[]
  note: string
}

export function invoiceTotals(lines: InvoiceLine[]) {
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
  const tax = lines.reduce(
    (s, l) => s + l.quantity * l.unitPrice * (l.taxRate / 100),
    0,
  )
  return { subtotal, tax, total: subtotal + tax }
}

export const invoices: Invoice[] = [
  {
    id: 'FT-2024-0148',
    customer: 'Demir Tadilat & Dekorasyon',
    issueDate: '2024-04-18',
    dueDate: '2024-05-18',
    status: 'paid',
    note: 'Pesin odeme.',
    lines: [
      { product: 'Bosch GSR 12V-15 Akulu Vidalama', quantity: 4, unitPrice: 3290, taxRate: 20 },
    ],
  },
  {
    id: 'FT-2024-0147',
    customer: 'Yildiz Insaat Ltd. Sti.',
    issueDate: '2024-04-16',
    dueDate: '2024-05-16',
    status: 'sent',
    note: '30 gun vadeli.',
    lines: [
      { product: 'Marshall Maxi Plus Ic Cephe Boyasi 15L', quantity: 12, unitPrice: 920, taxRate: 20 },
      { product: 'Marshall Dis Cephe Boyasi 20L', quantity: 4, unitPrice: 1650, taxRate: 20 },
    ],
  },
  {
    id: 'FT-2024-0145',
    customer: 'Kaya Muhendislik A.S.',
    issueDate: '2024-04-14',
    dueDate: '2024-04-28',
    status: 'overdue',
    note: 'Vade gecmis, hatirlatma gonderildi.',
    lines: [
      { product: 'DeWalt DCD709 Akulu Darbeli Matkap', quantity: 6, unitPrice: 5190, taxRate: 20 },
    ],
  },
  {
    id: 'FT-2024-0144',
    customer: 'Anadolu Yapi Market',
    issueDate: '2024-04-11',
    dueDate: '2024-05-11',
    status: 'paid',
    note: '',
    lines: [
      { product: 'Stanley FatMax Serit Metre 8m', quantity: 40, unitPrice: 289, taxRate: 20 },
      { product: 'Ozkan Galvaniz Vida Seti 500 Parca', quantity: 60, unitPrice: 159, taxRate: 20 },
    ],
  },
  {
    id: 'FT-2024-0143',
    customer: 'Ercan Nalbur',
    issueDate: '2024-04-09',
    dueDate: '2024-04-24',
    status: 'overdue',
    note: '',
    lines: [
      { product: 'Bosch Profesyonel Tornavida Seti 40 Parca', quantity: 10, unitPrice: 649, taxRate: 20 },
    ],
  },
  {
    id: 'FT-2024-0142',
    customer: 'Demir Tadilat & Dekorasyon',
    issueDate: '2024-04-08',
    dueDate: '2024-05-08',
    status: 'paid',
    note: '',
    lines: [
      { product: 'Karcher K5 Premium Yuksek Basincli Yikama', quantity: 2, unitPrice: 7290, taxRate: 20 },
    ],
  },
  {
    id: 'FT-2024-0141',
    customer: 'Yildiz Insaat Ltd. Sti.',
    issueDate: '2024-04-04',
    dueDate: '2024-05-04',
    status: 'cancelled',
    note: 'Musteri talebiyle iptal edildi.',
    lines: [
      { product: 'Makita HR2470 Kirici Delici', quantity: 3, unitPrice: 4150, taxRate: 20 },
    ],
  },
  {
    id: 'FT-2024-0140',
    customer: 'Yildiz Insaat Ltd. Sti.',
    issueDate: '2024-04-01',
    dueDate: '2024-05-01',
    status: 'paid',
    note: '',
    lines: [
      { product: 'Makita DUH523 Akulu Cit Bicme', quantity: 6, unitPrice: 3990, taxRate: 20 },
      { product: 'Is Guvenligi Baret Beyaz', quantity: 30, unitPrice: 135, taxRate: 20 },
    ],
  },
  {
    id: 'FT-2024-0139',
    customer: 'Kaya Muhendislik A.S.',
    issueDate: '2024-03-29',
    dueDate: '2024-04-28',
    status: 'draft',
    note: 'Onay bekliyor.',
    lines: [
      { product: 'DeWalt Elmas Testere Disk 230mm', quantity: 25, unitPrice: 459, taxRate: 20 },
    ],
  },
]

export function getInvoiceById(id: string) {
  return invoices.find((i) => i.id === id)
}
