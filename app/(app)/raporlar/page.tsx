import { PageHeader } from '@/components/shared/page-header'
import { MetricGrid, SectionCard } from '@/components/shared/module-primitives'
import { Badge } from '@/components/ui/badge'
import {
  invoices,
  invoiceTotals,
  invoiceStatusMeta,
} from '@/lib/data/invoices'
import { quotations, quotationTotals } from '@/lib/data/quotations'
import { products, getStockStatus } from '@/lib/data/products'
import { formatCurrency, formatNumber } from '@/lib/ui-meta'

export default function ReportsPage() {
  const monthlyRevenue = invoices
    .filter((item) => item.status === 'paid')
    .reduce((sum, item) => sum + invoiceTotals(item.lines).total, 0)
  const quotationVolume = quotations.reduce(
    (sum, item) => sum + quotationTotals(item.lines).total,
    0,
  )

  return (
    <>
      <PageHeader
        title="Raporlar"
        description="Satis, tahsilat ve stok performansini yonetim ozetleriyle izleyin."
      />

      <MetricGrid
        items={[
          { label: 'Aylik Ciro', value: formatCurrency(monthlyRevenue) },
          { label: 'Teklif Hacmi', value: formatCurrency(quotationVolume) },
          {
            label: 'Aktif Urun',
            value: formatNumber(
              products.filter((item) => item.status === 'active').length,
            ),
          },
          {
            label: 'Tahsilat Orani',
            value: '%64',
            badge: 'Aylik',
            badgeVariant: 'info',
          },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Fatura Durum Dagilimi"
          description="Duruma gore belge sayilari"
          contentClassName="space-y-3"
        >
          {Object.entries(
            invoices.reduce<Record<string, number>>((acc, invoice) => {
              acc[invoice.status] = (acc[invoice.status] ?? 0) + 1
              return acc
            }, {}),
          ).map(([status, count]) => {
            const meta =
              invoiceStatusMeta[status as keyof typeof invoiceStatusMeta]

            return (
              <div
                key={status}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <span className="text-sm font-medium">{meta.label}</span>
                <Badge variant={meta.variant}>{count}</Badge>
              </div>
            )
          })}
        </SectionCard>

        <SectionCard
          title="Stok Riskleri"
          description="Yeniden siparis gerektiren urunler"
          contentClassName="space-y-3"
        >
          {products
            .filter((item) => item.stock <= item.reorderPoint)
            .slice(0, 5)
            .map((product) => {
              const meta = getStockStatus(product)

              return (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.stock} {product.unit}
                    </p>
                  </div>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </div>
              )
            })}
        </SectionCard>

        <SectionCard
          title="Yonetici Notu"
          description="Moduller arasi performans ve operasyon ozetleri"
          contentClassName="space-y-3"
        >
          <div className="rounded-lg border p-4 text-sm leading-6 text-muted-foreground">
            Satis, stok, teklif ve finans modullerinin tumu mevcut dashboard
            stilini koruyan yonetim kartlari ile ayni akista sunulur. Bu alan,
            karar alma surecini hizlandiracak temel KPI gorunumunu bir araya
            getirir.
          </div>
        </SectionCard>
      </div>
    </>
  )
}
