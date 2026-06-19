import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import {
  DetailList,
  MetricGrid,
  SectionCard,
} from '@/components/shared/module-primitives'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  getQuotationById,
  lineTotal,
  quotationStatusMeta,
  quotationTotals,
} from '@/lib/data/quotations'
import { formatCurrency, formatDate } from '@/lib/ui-meta'

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const quotation = getQuotationById(id)

  if (!quotation) {
    notFound()
  }

  const meta = quotationStatusMeta[quotation.status]
  const totals = quotationTotals(quotation.lines)

  return (
    <>
      <PageHeader
        title={quotation.id}
        description={`${quotation.customer} icin hazirlanan teklifin statik detay gorunumu.`}
      >
        <Button variant="outline" render={<Link href="/teklifler">Listeye Don</Link>} />
        <Button render={<Link href="/teklifler/yeni">Kopyala</Link>} />
      </PageHeader>

      <MetricGrid
        items={[
          { label: 'Musteri', value: quotation.customer },
          { label: 'Durum', value: meta.label, badge: 'Teklif', badgeVariant: meta.variant },
          { label: 'Gecerlilik', value: formatDate(quotation.validUntil) },
          { label: 'Toplam', value: formatCurrency(totals.total) },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Teklif Ozet"
          description="Ust bilgi alanlari"
          contentClassName="space-y-4"
        >
          <DetailList
            items={[
              { label: 'Teklif No', value: quotation.id },
              { label: 'Musteri', value: quotation.customer },
              { label: 'Teklif Tarihi', value: formatDate(quotation.date) },
              { label: 'Gecerlilik', value: formatDate(quotation.validUntil) },
            ]}
          />
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Not</p>
            <p className="mt-2 text-sm">{quotation.note || 'Not girilmedi.'}</p>
          </div>
        </SectionCard>

        <SectionCard
          title="Kalemler"
          description="Teklif satirlari"
          contentClassName="space-y-3 xl:col-span-2"
        >
          {quotation.lines.map((line) => (
            <div
              key={`${quotation.id}-${line.product}`}
              className="rounded-lg border p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{line.product}</p>
                  <p className="text-xs text-muted-foreground">
                    {line.quantity} x {formatCurrency(line.unitPrice)} - %{line.taxRate} KDV
                  </p>
                </div>
                <Badge variant="outline">{formatCurrency(lineTotal(line))}</Badge>
              </div>
            </div>
          ))}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border p-3 text-sm">
              <p className="text-muted-foreground">Ara Toplam</p>
              <p className="mt-1 font-medium">{formatCurrency(totals.subtotal)}</p>
            </div>
            <div className="rounded-lg border p-3 text-sm">
              <p className="text-muted-foreground">KDV</p>
              <p className="mt-1 font-medium">{formatCurrency(totals.tax)}</p>
            </div>
            <div className="rounded-lg border p-3 text-sm">
              <p className="text-muted-foreground">Genel Toplam</p>
              <p className="mt-1 font-medium">{formatCurrency(totals.total)}</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  )
}
