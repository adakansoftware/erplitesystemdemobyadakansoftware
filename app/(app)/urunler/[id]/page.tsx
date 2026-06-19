import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeftRight, Package, Pencil, Warehouse } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import {
  DetailList,
  MetricGrid,
  SectionCard,
} from '@/components/shared/module-primitives'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getProductById, getStockStatus, productStatusMeta } from '@/lib/data/products'
import { formatCurrency, formatDate } from '@/lib/ui-meta'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = getProductById(id)

  if (!product) {
    notFound()
  }

  const stockMeta = getStockStatus(product)
  const statusMeta = productStatusMeta[product.status]

  return (
    <>
      <PageHeader
        title={product.name}
        description={`${product.sku} kodlu urun kartinin statik detay gorunumu.`}
      >
        <Button variant="outline" render={<Link href="/stok">Stok Hareketi</Link>}>
          <Warehouse data-icon="inline-start" />
        </Button>
        <Button render={<Link href="/urunler/yeni">Duzenle</Link>}>
          <Pencil data-icon="inline-start" />
        </Button>
      </PageHeader>

      <MetricGrid
        items={[
          { label: 'Satis Fiyati', value: formatCurrency(product.salePrice) },
          { label: 'Maliyet', value: formatCurrency(product.costPrice) },
          { label: 'Stok', value: `${product.stock} ${product.unit}`, badge: stockMeta.label, badgeVariant: stockMeta.variant },
          { label: 'Durum', value: statusMeta.label, badge: `${product.taxRate}% KDV`, badgeVariant: statusMeta.variant },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Urun Bilgileri"
          description="Kart uzerindeki temel alanlar"
          contentClassName="space-y-4"
        >
          <DetailList
            items={[
              { label: 'Urun Kodu', value: product.id },
              { label: 'Stok Kodu', value: product.sku },
              { label: 'Barkod', value: product.barcode },
              { label: 'Kategori', value: product.category },
              { label: 'Marka', value: product.brand },
              { label: 'Olusturma Tarihi', value: formatDate(product.createdAt) },
            ]}
          />
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Aciklama</p>
            <p className="mt-2 text-sm">{product.description}</p>
          </div>
        </SectionCard>

        <SectionCard
          title="Operasyon Ozet"
          description="Depo ve satis tarafindaki gorsel durum"
          contentClassName="space-y-3"
        >
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Stok Esigi</p>
              <p className="text-xs text-muted-foreground">
                Minimum {product.reorderPoint} {product.unit}
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
            <span className="text-sm font-medium">%{product.taxRate}</span>
          </div>
        </SectionCard>

        <SectionCard
          title="Baglantili Islemler"
          description="Mock ERP akisinda bu kartin kullanildigi alanlar"
          contentClassName="space-y-3"
        >
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
