import Link from 'next/link'
import { Package, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { MetricGrid, SectionCard } from '@/components/shared/module-primitives'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  getStockStatus,
  products,
  productStatusMeta,
} from '@/lib/data/products'
import { formatCurrency, formatNumber } from '@/lib/ui-meta'

export default function ProductsPage() {
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
          { label: 'Aktif Kart', value: formatNumber(products.filter((item) => item.status === 'active').length), badge: 'Canli', badgeVariant: 'success' },
          { label: 'Dusuk Stok', value: formatNumber(lowStockCount), badge: 'Takip', badgeVariant: 'warning' },
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
