import type { BadgeVariant } from '@/lib/ui-meta'

export type ProductStatus = 'active' | 'passive' | 'draft' | 'archived'

export const productStatusMeta: Record<
  ProductStatus,
  { label: string; variant: BadgeVariant }
> = {
  active: { label: 'Aktif', variant: 'success' },
  passive: { label: 'Pasif', variant: 'secondary' },
  draft: { label: 'Taslak', variant: 'warning' },
  archived: { label: 'Arsiv', variant: 'outline' },
}

export type Product = {
  id: string
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
  status: ProductStatus
  description: string
  createdAt: string
}

export const productCategories = [
  'El Aletleri',
  'Elektrikli Aletler',
  'Hirdavat',
  'Bahce',
  'Boya & Kimyasal',
  'Is Guvenligi',
]

export const productBrands = [
  'Bosch',
  'Makita',
  'DeWalt',
  'Stanley',
  'Karcher',
  'Marshall',
  'Ozkan',
]

export const products: Product[] = [
  {
    id: 'PRD-1001',
    name: 'Bosch GSR 12V-15 Akulu Vidalama',
    sku: 'BSH-GSR-12V',
    barcode: '8690000010012',
    category: 'Elektrikli Aletler',
    brand: 'Bosch',
    unit: 'Adet',
    costPrice: 2450,
    supplierPrice: 2385,
    salePrice: 3290,
    taxRate: 20,
    stock: 8,
    reorderPoint: 12,
    status: 'active',
    description:
      'Profesyonel kullanima uygun, kompakt akulu vidalama makinesi. 2 adet 2.0Ah aku dahil.',
    createdAt: '2024-01-12',
  },
  {
    id: 'PRD-1002',
    name: 'Makita HR2470 Kirici Delici',
    sku: 'MKT-HR2470',
    barcode: '8690000010029',
    category: 'Elektrikli Aletler',
    brand: 'Makita',
    unit: 'Adet',
    costPrice: 3100,
    supplierPrice: 3010,
    salePrice: 4150,
    taxRate: 20,
    stock: 15,
    reorderPoint: 8,
    status: 'active',
    description: '780W gucunde SDS-Plus kirici delici. Beton ve duvar uygulamalari icin ideal.',
    createdAt: '2024-02-03',
  },
  {
    id: 'PRD-1003',
    name: 'Stanley FatMax Serit Metre 8m',
    sku: 'STN-FM-8M',
    barcode: '8690000010036',
    category: 'El Aletleri',
    brand: 'Stanley',
    unit: 'Adet',
    costPrice: 185,
    supplierPrice: 179,
    salePrice: 289,
    taxRate: 20,
    stock: 124,
    reorderPoint: 40,
    status: 'active',
    description: 'Darbeye dayanikli FatMax serit metre. 8 metre olcum uzunlugu.',
    createdAt: '2024-01-28',
  },
  {
    id: 'PRD-1004',
    name: 'Karcher K5 Premium Yuksek Basincli Yikama',
    sku: 'KRC-K5-PRM',
    barcode: '8690000010043',
    category: 'Bahce',
    brand: 'Karcher',
    unit: 'Adet',
    costPrice: 5400,
    supplierPrice: 5280,
    salePrice: 7290,
    taxRate: 20,
    stock: 6,
    reorderPoint: 5,
    status: 'active',
    description: '145 bar basinc, su sogutmali motor. Bahce ve arac yikama icin.',
    createdAt: '2024-03-15',
  },
  {
    id: 'PRD-1005',
    name: 'Marshall Maxi Plus Ic Cephe Boyasi 15L',
    sku: 'MRS-MX-15L',
    barcode: '8690000010050',
    category: 'Boya & Kimyasal',
    brand: 'Marshall',
    unit: 'Kova',
    costPrice: 640,
    supplierPrice: 612,
    salePrice: 920,
    taxRate: 20,
    stock: 3,
    reorderPoint: 20,
    status: 'active',
    description: 'Silinebilir ic cephe plastik boyasi. Yuksek ortucu, mat beyaz.',
    createdAt: '2024-02-20',
  },
  {
    id: 'PRD-1006',
    name: 'DeWalt DCD709 Akulu Darbeli Matkap',
    sku: 'DWT-DCD709',
    barcode: '8690000010067',
    category: 'Elektrikli Aletler',
    brand: 'DeWalt',
    unit: 'Adet',
    costPrice: 3850,
    supplierPrice: 3725,
    salePrice: 5190,
    taxRate: 20,
    stock: 0,
    reorderPoint: 6,
    status: 'active',
    description: '18V XR serisi fircasiz motorlu darbeli matkap. Kompakt govde.',
    createdAt: '2024-03-01',
  },
  {
    id: 'PRD-1007',
    name: 'Ozkan Galvaniz Vida Seti 500 Parca',
    sku: 'OZK-VS-500',
    barcode: '8690000010074',
    category: 'Hirdavat',
    brand: 'Ozkan',
    unit: 'Kutu',
    costPrice: 95,
    supplierPrice: 92,
    salePrice: 159,
    taxRate: 20,
    stock: 210,
    reorderPoint: 50,
    status: 'active',
    description: 'Karisik olcu galvaniz kaplama ahsap vida seti. Organizer kutu dahil.',
    createdAt: '2024-01-05',
  },
  {
    id: 'PRD-1008',
    name: 'Is Guvenligi Baret Beyaz',
    sku: 'ISG-BRT-BYZ',
    barcode: '8690000010081',
    category: 'Is Guvenligi',
    brand: 'Ozkan',
    unit: 'Adet',
    costPrice: 78,
    supplierPrice: 74,
    salePrice: 135,
    taxRate: 20,
    stock: 48,
    reorderPoint: 30,
    status: 'active',
    description: 'CE sertifikali, ayarlanabilir kafa bandi. Insaat sahasi icin.',
    createdAt: '2024-02-11',
  },
  {
    id: 'PRD-1009',
    name: 'Makita DUH523 Akulu Cit Bicme',
    sku: 'MKT-DUH523',
    barcode: '8690000010098',
    category: 'Bahce',
    brand: 'Makita',
    unit: 'Adet',
    costPrice: 2890,
    supplierPrice: 2805,
    salePrice: 3990,
    taxRate: 20,
    stock: 11,
    reorderPoint: 6,
    status: 'active',
    description: '18V LXT akulu cit bicme makinesi. 52cm bicak uzunlugu.',
    createdAt: '2024-03-22',
  },
  {
    id: 'PRD-1010',
    name: 'Bosch Profesyonel Tornavida Seti 40 Parca',
    sku: 'BSH-TVS-40',
    barcode: '8690000010104',
    category: 'El Aletleri',
    brand: 'Bosch',
    unit: 'Set',
    costPrice: 420,
    supplierPrice: 405,
    salePrice: 649,
    taxRate: 20,
    stock: 67,
    reorderPoint: 25,
    status: 'active',
    description: 'Manyetik uclu profesyonel tornavida ve bits seti.',
    createdAt: '2024-01-18',
  },
  {
    id: 'PRD-1011',
    name: 'Marshall Dis Cephe Boyasi 20L',
    sku: 'MRS-DC-20L',
    barcode: '8690000010111',
    category: 'Boya & Kimyasal',
    brand: 'Marshall',
    unit: 'Kova',
    costPrice: 1180,
    supplierPrice: 1142,
    salePrice: 1650,
    taxRate: 20,
    stock: 22,
    reorderPoint: 15,
    status: 'passive',
    description: 'Su itici dis cephe akrilik boyasi. UV dayanimli.',
    createdAt: '2024-02-28',
  },
  {
    id: 'PRD-1012',
    name: 'DeWalt Elmas Testere Disk 230mm',
    sku: 'DWT-DSK-230',
    barcode: '8690000010128',
    category: 'Hirdavat',
    brand: 'DeWalt',
    unit: 'Adet',
    costPrice: 310,
    supplierPrice: 298,
    salePrice: 459,
    taxRate: 20,
    stock: 0,
    reorderPoint: 10,
    status: 'draft',
    description: 'Beton ve granit kesim icin elmas uclu testere diski.',
    createdAt: '2024-03-30',
  },
]

export function getProductById(id: string) {
  return products.find((product) => product.id === id)
}

export function getStockStatus(product: Product): {
  label: string
  variant: BadgeVariant
} {
  if (product.stock === 0) {
    return { label: 'Stok Yok', variant: 'destructive' }
  }
  if (product.stock <= product.reorderPoint) {
    return { label: 'Dusuk Stok', variant: 'warning' }
  }
  return { label: 'Yeterli', variant: 'success' }
}
