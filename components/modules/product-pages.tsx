'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeftRight, Package, Pencil, Plus, Warehouse } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import {
  DetailList,
  MetricGrid,
  SectionCard,
} from '@/components/shared/module-primitives'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  getStockStatus,
  productStatusMeta,
  products,
} from '@/lib/data/products'
import { useErpCollections } from '@/hooks/use-erp-store'
import { formatCurrency, formatDate, formatNumber } from '@/lib/ui-meta'

export function ProductsPageClient() {
  const { products } = useErpCollections()
  const lowStockCount = products.filter((item) => item.stock <= item.reorderPoint).length
  const totalStockValue = products.reduce(
    (sum, item) => sum + item.stock * item.costPrice,
    0,
  )

  return (
    <>
      <PageHeader
        title="Urunler"
        description="Satisa acik tum urun kartlari, fiyatlar ve stok durumlari."
      >
        <Button render={<Link href="/urunler/yeni">Yeni Urun</Link>}>
          <Plus data-icon="inline-start" />
        </Button>
      </PageHeader>

      <MetricGrid
        items={[
          { label: 'Toplam Urun', value: formatNumber(products.length) },
          {
            label: 'Aktif Kart',
            value: formatNumber(
              products.filter((item) => item.status === 'active').length,
            ),
            badge: 'Canli',
            badgeVariant: 'success',
          },
          {
            label: 'Dusuk Stok',
            value: formatNumber(lowStockCount),
            badge: 'Takip',
            badgeVariant: 'warning',
          },
          { label: 'Stok Maliyeti', value: formatCurrency(totalStockValue) },
        ]}
      />

      <SectionCard
        title="Urun Listesi"
        description="Katalog, fiyat ve stok bilgileri ayni tabloda takip edilir."
        contentClassName="px-0"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Urun</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Marka</TableHead>
              <TableHead>Stok</TableHead>
              <TableHead className="text-right">Satis Fiyati</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="pr-6 text-right">Kart</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const stockMeta = getStockStatus(product)
              const statusMeta = productStatusMeta[product.status]

              return (
                <TableRow key={product.id}>
                  <TableCell className="pl-6">
                    <div className="flex flex-col">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {product.sku}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.category}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.brand}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {product.stock} {product.unit}
                      </span>
                      <Badge variant={stockMeta.variant}>{stockMeta.label}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(product.salePrice)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      render={<Link href={`/urunler/${product.id}`}>Incele</Link>}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </SectionCard>
    </>
  )
}

export function NewProductPageClient() {
  const router = useRouter()
  const { createProduct, createProductCategory, productCategories } = useErpCollections()
  const sampleProduct = products[0]
  const [newCategoryName, setNewCategoryName] = useState('')
  const [form, setForm] = useState({
    name: sampleProduct.name,
    sku: 'PRD-1013',
    barcode: '8690000010135',
    category: sampleProduct.category,
    brand: 'Bosch',
    description: 'Profesyonel segmentte konumlanan yeni seri icin urun karti.',
    costPrice: '2750',
    salePrice: '3490',
    taxRate: '20',
    unit: 'Adet',
    stock: '18',
    reorderPoint: '8',
    salesNote:
      'Satis ekibinin fiyatlandirma ve konumlandirma notlari bu alanda tutulur.',
  })

  const preview = useMemo(
    () => ({
      name: form.name || 'Yeni urun',
      category: form.category || 'Kategori',
      brand: form.brand || 'Marka',
      salePrice: Number(form.salePrice || 0),
      stock: Number(form.stock || 0),
      unit: form.unit || 'Adet',
    }),
    [form],
  )

  function updateField<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleCreateCategory() {
    const createdCategory = await createProductCategory(newCategoryName)
    if (!createdCategory) {
      toast.error('Kategori adi girin')
      return
    }

    updateField('category', createdCategory)
    setNewCategoryName('')
    toast.success('Kategori eklendi')
  }

  async function handleSave() {
    const nextProduct = await createProduct({
      name: form.name,
      sku: form.sku,
      barcode: form.barcode,
      category: form.category,
      brand: form.brand,
      unit: form.unit,
      costPrice: Number(form.costPrice || 0),
      supplierPrice: Number(form.costPrice || 0),
      salePrice: Number(form.salePrice || 0),
      taxRate: Number(form.taxRate || 0),
      stock: Number(form.stock || 0),
      reorderPoint: Number(form.reorderPoint || 0),
      description: `${form.description}\n\n${form.salesNote}`.trim(),
    })

    toast.success('Urun karti olusturuldu')
    router.push(`/urunler/${nextProduct.id}`)
  }

  return (
    <>
      <PageHeader
        title="Yeni Urun"
        description="Sisteme yeni urun karti eklemek icin urun tanim formu."
      >
        <Button variant="outline" render={<Link href="/urunler">Vazgec</Link>} />
        <Button onClick={() => void handleSave()}>Urunu Kaydet</Button>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Genel Bilgiler"
          description="Temel urun tanimi ve katalog alanlari"
          contentClassName="space-y-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="product-name">Urun Adi</FieldLabel>
              <Input
                id="product-name"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="product-sku">Stok Kodu</FieldLabel>
                <Input
                  id="product-sku"
                  value={form.sku}
                  onChange={(event) => updateField('sku', event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="product-barcode">Barkod</FieldLabel>
                <Input
                  id="product-barcode"
                  value={form.barcode}
                  onChange={(event) =>
                    updateField('barcode', event.target.value)
                  }
                />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="product-category">Kategori</FieldLabel>
                <div className="space-y-3">
                  <Select
                    value={form.category}
                    onValueChange={(value) => updateField('category', value ?? '')}
                  >
                    <SelectTrigger id="product-category" className="w-full">
                      <SelectValue placeholder="Kategori secin" />
                    </SelectTrigger>
                    <SelectContent>
                      {productCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Input
                      value={newCategoryName}
                      onChange={(event) => setNewCategoryName(event.target.value)}
                      placeholder="Yeni kategori ekle"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleCreateCategory()}
                    >
                      Ekle
                    </Button>
                  </div>
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="product-brand">Marka</FieldLabel>
                <Input
                  id="product-brand"
                  value={form.brand}
                  onChange={(event) => updateField('brand', event.target.value)}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="product-description">Aciklama</FieldLabel>
              <Textarea
                id="product-description"
                value={form.description}
                onChange={(event) =>
                  updateField('description', event.target.value)
                }
              />
            </Field>
          </FieldGroup>
        </SectionCard>

        <SectionCard
          title="Fiyat & Stok"
          description="Satis ve maliyet alanlari"
          contentClassName="space-y-4"
        >
          <FieldGroup>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="cost-price">Maliyet</FieldLabel>
                <Input
                  id="cost-price"
                  value={form.costPrice}
                  onChange={(event) =>
                    updateField('costPrice', event.target.value)
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="sale-price">Satis Fiyati</FieldLabel>
                <Input
                  id="sale-price"
                  value={form.salePrice}
                  onChange={(event) =>
                    updateField('salePrice', event.target.value)
                  }
                />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="tax-rate">KDV Orani</FieldLabel>
                <Input
                  id="tax-rate"
                  value={form.taxRate}
                  onChange={(event) =>
                    updateField('taxRate', event.target.value)
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="unit">Birim</FieldLabel>
                <Input
                  id="unit"
                  value={form.unit}
                  onChange={(event) => updateField('unit', event.target.value)}
                />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="stock">Acilis Stogu</FieldLabel>
                <Input
                  id="stock"
                  value={form.stock}
                  onChange={(event) => updateField('stock', event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="reorder-point">Minimum Stok</FieldLabel>
                <Input
                  id="reorder-point"
                  value={form.reorderPoint}
                  onChange={(event) =>
                    updateField('reorderPoint', event.target.value)
                  }
                />
              </Field>
            </div>
          </FieldGroup>
        </SectionCard>

        <SectionCard
          title="Yayin Onizlemesi"
          description="Kart olustugunda gorunecek ozet"
          contentClassName="space-y-4"
        >
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">{preview.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {preview.category} - {preview.brand}
            </p>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Liste Fiyati</span>
                <span className="font-medium">
                  {formatCurrency(preview.salePrice)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Depo Stogu</span>
                <span className="font-medium">
                  {preview.stock} {preview.unit}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Durum</span>
                <span className="font-medium">Aktif</span>
              </div>
            </div>
          </div>
          <Field>
            <FieldLabel htmlFor="sales-note">Satis Notu</FieldLabel>
            <FieldContent>
              <Textarea
                id="sales-note"
                value={form.salesNote}
                onChange={(event) =>
                  updateField('salesNote', event.target.value)
                }
              />
              <FieldDescription>
                Urun kartinda fiyat, stok ve aciklama bilgileri tek yerde
                toplanir.
              </FieldDescription>
            </FieldContent>
          </Field>
        </SectionCard>
      </div>
    </>
  )
}

export function ProductDetailPageClient() {
  const params = useParams<{ id: string }>()
  const {
    getProductById,
    updateProduct,
    addStockMovement,
    createProductCategory,
    productCategories,
    hydrated,
  } = useErpCollections()
  const product = getProductById(params.id)
  const [isEditing, setIsEditing] = useState(false)
  const [stockModeOpen, setStockModeOpen] = useState(false)
  const [movementQty, setMovementQty] = useState('0')
  const [movementNote, setMovementNote] = useState('Sayim ve duzeltme hareketi.')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [form, setForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    brand: '',
    unit: '',
    costPrice: '0',
    supplierPrice: '0',
    salePrice: '0',
    taxRate: '0',
    stock: '0',
    reorderPoint: '0',
    description: '',
    status: 'active',
  })

  useEffect(() => {
    if (!product) {
      return
    }

    setForm({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      category: product.category,
      brand: product.brand,
      unit: product.unit,
      costPrice: String(product.costPrice),
      supplierPrice: String(product.supplierPrice),
      salePrice: String(product.salePrice),
      taxRate: String(product.taxRate),
      stock: String(product.stock),
      reorderPoint: String(product.reorderPoint),
      description: product.description,
      status: product.status,
    })
  }, [product])

  if (hydrated && !product) {
    return (
      <SectionCard
        title="Urun Bulunamadi"
        description="Istenen urun karti mevcut kayitlarda yer almiyor."
      >
        <Button render={<Link href="/urunler">Urun listesine don</Link>} />
      </SectionCard>
    )
  }

  if (!product) {
    return null
  }

  const currentProduct = product
  const stockMeta = getStockStatus(currentProduct)
  const statusMeta = productStatusMeta[currentProduct.status]

  function updateField<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleCreateCategory() {
    const createdCategory = await createProductCategory(newCategoryName)
    if (!createdCategory) {
      toast.error('Kategori adi girin')
      return
    }

    updateField('category', createdCategory)
    setNewCategoryName('')
    toast.success('Kategori eklendi')
  }

  async function handleSave() {
    const updatedProduct = await updateProduct(currentProduct.id, {
      name: form.name,
      sku: form.sku,
      barcode: form.barcode,
      category: form.category,
      brand: form.brand,
      unit: form.unit,
      costPrice: Number(form.costPrice || 0),
      supplierPrice: Number(form.supplierPrice || 0),
      salePrice: Number(form.salePrice || 0),
      taxRate: Number(form.taxRate || 0),
      stock: Number(form.stock || 0),
      reorderPoint: Number(form.reorderPoint || 0),
      description: form.description,
      status: form.status as typeof currentProduct.status,
    })

    if (!updatedProduct) {
      toast.error('Urun guncellenemedi')
      return
    }

    toast.success('Urun karti guncellendi')
    setIsEditing(false)
  }

  async function handleArchive() {
    await updateProduct(currentProduct.id, { status: 'archived' })
    toast.success('Urun arsive alindi')
  }

  async function handleStockAdjustment() {
    const qty = Number(movementQty || 0)
    if (!qty) {
      toast.error('Gecerli bir stok miktari girin')
      return
    }

    const movement = await addStockMovement({
      productId: currentProduct.id,
      type: 'adjustment',
      qty,
      note: movementNote,
      relatedDoc: currentProduct.id,
    })

    if (!movement) {
      toast.error('Stok hareketi olusturulamadi')
      return
    }

    toast.success('Stok hareketi eklendi')
    setMovementQty('0')
    setStockModeOpen(false)
  }

  return (
    <>
      <PageHeader
        title={currentProduct.name}
        description={`${currentProduct.sku} kodlu urun kartinin detay gorunumu.`}
      >
        <Button variant="outline" render={<Link href="/stok">Stok Hareketi</Link>}>
          <Warehouse data-icon="inline-start" />
        </Button>
        <Button variant="outline" onClick={() => setStockModeOpen((current) => !current)}>
          <Warehouse data-icon="inline-start" />
          Stok Hareketi Ekle
        </Button>
        <Button onClick={() => setIsEditing((current) => !current)}>
          <Pencil data-icon="inline-start" />
          {isEditing ? 'Duzenlemeyi Kapat' : 'Duzenle'}
        </Button>
      </PageHeader>

      <MetricGrid
        items={[
          { label: 'Satis Fiyati', value: formatCurrency(currentProduct.salePrice) },
          { label: 'Maliyet', value: formatCurrency(currentProduct.costPrice) },
          {
            label: 'Stok',
            value: `${currentProduct.stock} ${currentProduct.unit}`,
            badge: stockMeta.label,
            badgeVariant: stockMeta.variant,
          },
          {
            label: 'Durum',
            value: statusMeta.label,
            badge: `${currentProduct.taxRate}% KDV`,
            badgeVariant: statusMeta.variant,
          },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Urun Bilgileri"
          description="Kart uzerindeki temel alanlar"
          contentClassName="space-y-4"
        >
          {isEditing ? (
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="edit-name">Urun Adi</FieldLabel>
                <Input
                  id="edit-name"
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="edit-sku">Stok Kodu</FieldLabel>
                  <Input
                    id="edit-sku"
                    value={form.sku}
                    onChange={(event) => updateField('sku', event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-barcode">Barkod</FieldLabel>
                  <Input
                    id="edit-barcode"
                    value={form.barcode}
                    onChange={(event) => updateField('barcode', event.target.value)}
                  />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="edit-category">Kategori</FieldLabel>
                  <div className="space-y-3">
                    <Select
                      value={form.category}
                      onValueChange={(value) => updateField('category', value ?? '')}
                    >
                      <SelectTrigger id="edit-category" className="w-full">
                        <SelectValue placeholder="Kategori secin" />
                      </SelectTrigger>
                      <SelectContent>
                        {productCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Input
                        value={newCategoryName}
                        onChange={(event) => setNewCategoryName(event.target.value)}
                        placeholder="Yeni kategori ekle"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handleCreateCategory()}
                      >
                        Ekle
                      </Button>
                    </div>
                  </div>
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-brand">Marka</FieldLabel>
                  <Input
                    id="edit-brand"
                    value={form.brand}
                    onChange={(event) => updateField('brand', event.target.value)}
                  />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="edit-unit">Birim</FieldLabel>
                  <Input
                    id="edit-unit"
                    value={form.unit}
                    onChange={(event) => updateField('unit', event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-status">Durum</FieldLabel>
                  <Input
                    id="edit-status"
                    value={form.status}
                    onChange={(event) => updateField('status', event.target.value)}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="edit-description">Aciklama</FieldLabel>
                <Textarea
                  id="edit-description"
                  value={form.description}
                  onChange={(event) => updateField('description', event.target.value)}
                />
              </Field>
              <Button onClick={() => void handleSave()}>Degisiklikleri Kaydet</Button>
            </FieldGroup>
          ) : (
            <>
              <DetailList
                items={[
                  { label: 'Urun Kodu', value: currentProduct.id },
                  { label: 'Stok Kodu', value: currentProduct.sku },
                  { label: 'Barkod', value: currentProduct.barcode },
                  { label: 'Kategori', value: currentProduct.category },
                  { label: 'Marka', value: currentProduct.brand },
                  {
                    label: 'Olusturma Tarihi',
                    value: formatDate(currentProduct.createdAt),
                  },
                ]}
              />
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Aciklama</p>
                <p className="mt-2 whitespace-pre-line text-sm">
                  {currentProduct.description}
                </p>
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard
          title="Operasyon Ozet"
          description="Depo ve satis tarafindaki gorsel durum"
          contentClassName="space-y-3"
        >
          {isEditing ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="edit-cost">Maliyet</FieldLabel>
                  <Input
                    id="edit-cost"
                    value={form.costPrice}
                    onChange={(event) => updateField('costPrice', event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-supplier">Tedarikci Fiyati</FieldLabel>
                  <Input
                    id="edit-supplier"
                    value={form.supplierPrice}
                    onChange={(event) => updateField('supplierPrice', event.target.value)}
                  />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="edit-sale">Satis Fiyati</FieldLabel>
                  <Input
                    id="edit-sale"
                    value={form.salePrice}
                    onChange={(event) => updateField('salePrice', event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-tax">KDV</FieldLabel>
                  <Input
                    id="edit-tax"
                    value={form.taxRate}
                    onChange={(event) => updateField('taxRate', event.target.value)}
                  />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="edit-stock">Stok</FieldLabel>
                  <Input
                    id="edit-stock"
                    value={form.stock}
                    onChange={(event) => updateField('stock', event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-reorder">Yeniden Siparis Noktasi</FieldLabel>
                  <Input
                    id="edit-reorder"
                    value={form.reorderPoint}
                    onChange={(event) => updateField('reorderPoint', event.target.value)}
                  />
                </Field>
              </div>
              <Button variant="outline" onClick={() => void handleArchive()}>
                Urunu Arsivle
              </Button>
            </>
          ) : null}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Stok Esigi</p>
              <p className="text-xs text-muted-foreground">
                Minimum {currentProduct.reorderPoint} {currentProduct.unit}
              </p>
            </div>
            <Badge variant={stockMeta.variant}>{stockMeta.label}</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Kart Durumu</p>
              <p className="text-xs text-muted-foreground">
                Listeleme ve satis gorunumu
              </p>
            </div>
            <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">KDV</p>
              <p className="text-xs text-muted-foreground">
                Urun bazli vergi orani
              </p>
            </div>
            <span className="text-sm font-medium">%{currentProduct.taxRate}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Tedarikci Fiyati</p>
              <p className="text-xs text-muted-foreground">
                Son alim baz fiyat
              </p>
            </div>
            <span className="text-sm font-medium">
              {formatCurrency(currentProduct.supplierPrice)}
            </span>
          </div>
        </SectionCard>

        <SectionCard
          title="Baglantili Islemler"
          description="Bu kartin kullanildigi operasyon alanlari"
          contentClassName="space-y-3"
        >
          {stockModeOpen ? (
            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium">Manuel Stok Duzeltmesi</p>
              <div className="mt-3 space-y-3">
                <Input
                  value={movementQty}
                  onChange={(event) => setMovementQty(event.target.value)}
                  placeholder="Pozitif ya da negatif miktar"
                />
                <Textarea
                  value={movementNote}
                  onChange={(event) => setMovementNote(event.target.value)}
                />
                <Button onClick={() => void handleStockAdjustment()}>Hareketi Kaydet</Button>
              </div>
            </div>
          ) : null}
          <Link
            href="/teklifler"
            className="flex items-center justify-between rounded-lg border p-3 text-sm font-medium hover:bg-muted/50"
          >
            Tekliflerde Kullan
            <ArrowLeftRight className="size-4 text-muted-foreground" />
          </Link>
          <Link
            href="/faturalar"
            className="flex items-center justify-between rounded-lg border p-3 text-sm font-medium hover:bg-muted/50"
          >
            Fatura Gecmisi
            <ArrowLeftRight className="size-4 text-muted-foreground" />
          </Link>
          <Link
            href="/urunler"
            className="flex items-center justify-between rounded-lg border p-3 text-sm font-medium hover:bg-muted/50"
          >
            Kataloga Don
            <Package className="size-4 text-muted-foreground" />
          </Link>
        </SectionCard>
      </div>
    </>
  )
}
