import type { BadgeVariant } from '@/lib/ui-meta'

export type Warehouse = {
  id: string
  name: string
  location: string
  manager: string
  capacity: number
  used: number
  itemCount: number
  status: 'active' | 'passive'
}

export const warehouses: Warehouse[] = [
  {
    id: 'WH-01',
    name: 'Merkez Depo',
    location: 'Ikitelli OSB, Istanbul',
    manager: 'Ahmet Yilmaz',
    capacity: 5000,
    used: 3820,
    itemCount: 642,
    status: 'active',
  },
  {
    id: 'WH-02',
    name: 'Anadolu Yakasi Depo',
    location: 'Tuzla, Istanbul',
    manager: 'Selin Kaya',
    capacity: 3000,
    used: 1640,
    itemCount: 318,
    status: 'active',
  },
  {
    id: 'WH-03',
    name: 'Magaza Stok',
    location: 'Bayrampasa, Istanbul',
    manager: 'Burak Demir',
    capacity: 1200,
    used: 980,
    itemCount: 204,
    status: 'active',
  },
  {
    id: 'WH-04',
    name: 'Ankara Sube Depo',
    location: 'Ostim, Ankara',
    manager: 'Elif Sahin',
    capacity: 2000,
    used: 410,
    itemCount: 96,
    status: 'passive',
  },
]

export type MovementType = 'in' | 'out' | 'transfer' | 'adjustment'

export const movementMeta: Record<
  MovementType,
  { label: string; variant: BadgeVariant }
> = {
  in: { label: 'Giris', variant: 'success' },
  out: { label: 'Cikis', variant: 'destructive' },
  transfer: { label: 'Transfer', variant: 'info' },
  adjustment: { label: 'Duzeltme', variant: 'warning' },
}

export type StockMovement = {
  id: string
  date: string
  product: string
  sku: string
  type: MovementType
  quantity: number
  warehouse: string
  reference: string
  user: string
}

export const stockMovements: StockMovement[] = [
  {
    id: 'MOV-2048',
    date: '2024-04-18',
    product: 'Makita HR2470 Kirici Delici',
    sku: 'MKT-HR2470',
    type: 'in',
    quantity: 20,
    warehouse: 'Merkez Depo',
    reference: 'ALIS-2024-0091',
    user: 'Ahmet Yilmaz',
  },
  {
    id: 'MOV-2047',
    date: '2024-04-18',
    product: 'Bosch GSR 12V-15 Akulu Vidalama',
    sku: 'BSH-GSR-12V',
    type: 'out',
    quantity: 4,
    warehouse: 'Magaza Stok',
    reference: 'FT-2024-0148',
    user: 'Burak Demir',
  },
  {
    id: 'MOV-2046',
    date: '2024-04-17',
    product: 'Stanley FatMax Serit Metre 8m',
    sku: 'STN-FM-8M',
    type: 'transfer',
    quantity: 30,
    warehouse: 'Merkez Depo -> Anadolu Yakasi',
    reference: 'TRF-2024-0033',
    user: 'Selin Kaya',
  },
  {
    id: 'MOV-2045',
    date: '2024-04-17',
    product: 'Marshall Maxi Plus Ic Cephe Boyasi 15L',
    sku: 'MRS-MX-15L',
    type: 'out',
    quantity: 12,
    warehouse: 'Merkez Depo',
    reference: 'FT-2024-0147',
    user: 'Ahmet Yilmaz',
  },
  {
    id: 'MOV-2044',
    date: '2024-04-16',
    product: 'DeWalt DCD709 Akulu Darbeli Matkap',
    sku: 'DWT-DCD709',
    type: 'out',
    quantity: 6,
    warehouse: 'Merkez Depo',
    reference: 'FT-2024-0145',
    user: 'Burak Demir',
  },
  {
    id: 'MOV-2043',
    date: '2024-04-16',
    product: 'Ozkan Galvaniz Vida Seti 500 Parca',
    sku: 'OZK-VS-500',
    type: 'in',
    quantity: 150,
    warehouse: 'Merkez Depo',
    reference: 'ALIS-2024-0090',
    user: 'Ahmet Yilmaz',
  },
  {
    id: 'MOV-2042',
    date: '2024-04-15',
    product: 'Marshall Maxi Plus Ic Cephe Boyasi 15L',
    sku: 'MRS-MX-15L',
    type: 'adjustment',
    quantity: -2,
    warehouse: 'Merkez Depo',
    reference: 'SAYIM-2024-04',
    user: 'Selin Kaya',
  },
  {
    id: 'MOV-2041',
    date: '2024-04-15',
    product: 'Karcher K5 Premium Yuksek Basincli Yikama',
    sku: 'KRC-K5-PRM',
    type: 'out',
    quantity: 2,
    warehouse: 'Magaza Stok',
    reference: 'FT-2024-0142',
    user: 'Burak Demir',
  },
]
