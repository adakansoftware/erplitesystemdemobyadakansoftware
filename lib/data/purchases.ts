import type { BadgeVariant } from '@/lib/ui-meta'

export type PurchaseOrderStatus =
  | 'draft'
  | 'ordered'
  | 'partial'
  | 'received'
  | 'cancelled'

export const purchaseStatusMeta: Record<
  PurchaseOrderStatus,
  { label: string; variant: BadgeVariant }
> = {
  draft: { label: 'Taslak', variant: 'secondary' },
  ordered: { label: 'Siparis Gecildi', variant: 'info' },
  partial: { label: 'Kismi Kabul', variant: 'warning' },
  received: { label: 'Teslim Alindi', variant: 'success' },
  cancelled: { label: 'Iptal', variant: 'destructive' },
}

export type PurchaseOrderLine = {
  product: string
  qty: number
  unitPrice: number
  taxRate: number
}

export type PurchaseOrder = {
  id: string
  supplier: string
  orderDate: string
  expectedDate: string
  status: PurchaseOrderStatus
  lines: PurchaseOrderLine[]
  note: string
}

export function purchaseTotals(lines: PurchaseOrderLine[]) {
  const subtotal = lines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0)
  const tax = lines.reduce(
    (sum, line) => sum + line.qty * line.unitPrice * (line.taxRate / 100),
    0,
  )
  return { subtotal, tax, total: subtotal + tax }
}

export const purchases: PurchaseOrder[] = [
  {
    id: 'SPA-2024-0001',
    supplier: 'Bosch Turkiye Dagitim',
    orderDate: '2024-04-12',
    expectedDate: '2024-04-20',
    status: 'ordered',
    note: 'Merkez depo icin sezon oncesi alim planlandi.',
    lines: [
      { product: 'Bosch GSR 12V-15 Akulu Vidalama', qty: 20, unitPrice: 2385, taxRate: 20 },
      { product: 'Bosch Profesyonel Tornavida Seti 40 Parca', qty: 40, unitPrice: 405, taxRate: 20 },
    ],
  },
  {
    id: 'SPA-2024-0002',
    supplier: 'Marshall Boya Bolge Bayi',
    orderDate: '2024-04-14',
    expectedDate: '2024-04-18',
    status: 'received',
    note: 'Yildiz Insaat santiyesi icin hizli sevkiyat.',
    lines: [
      { product: 'Marshall Maxi Plus Ic Cephe Boyasi 15L', qty: 60, unitPrice: 612, taxRate: 20 },
      { product: 'Marshall Dis Cephe Boyasi 20L', qty: 24, unitPrice: 1142, taxRate: 20 },
    ],
  },
  {
    id: 'SPA-2024-0003',
    supplier: 'Makita Endustri Tic.',
    orderDate: '2024-04-17',
    expectedDate: '2024-04-25',
    status: 'partial',
    note: 'Ankara sube icin karmali ekipman alim paketi.',
    lines: [
      { product: 'Makita HR2470 Kirici Delici', qty: 12, unitPrice: 3010, taxRate: 20 },
      { product: 'Makita DUH523 Akulu Cit Bicme', qty: 10, unitPrice: 2805, taxRate: 20 },
    ],
  },
]
