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
import { getInvoiceById, invoiceStatusMeta, invoiceTotals } from '@/lib/data/invoices'
import { formatCurrency, formatDate } from '@/lib/ui-meta'

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const invoice = getInvoiceById(id)

  if (!invoice) {
    notFound()
  }

  const meta = invoiceStatusMeta[invoice.status]
  const totals = invoiceTotals(invoice.lines)

  return (
    <>
      <PageHeader
        title={invoice.id}
        description={`${invoice.customer} icin duzenlenen faturanin statik detay ekrani.`}
      >
        <Button variant="outline" render={<Link href="/faturalar">Listeye Don</Link>} />
        <Button render={<Link href="/faturalar/yeni">Kopyala</Link>} />
      </PageHeader>

      <MetricGrid
        items={[
          { label: 'Musteri', value: invoice.customer },
          { label: 'Durum', value: meta.label, badge: 'Fatura', badgeVariant: meta.variant },
          { label: 'Vade Tarihi', value: formatDate(invoice.dueDate) },
          { label: 'Toplam', value: formatCurrency(totals.total) },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Belge Ozeti"
          description="Faturaya ait ust bilgiler"
          contentClassName="space-y-4"
        >
          <DetailList
            items={[
              { label: 'Fatura No', value: invoice.id },
              { label: 'Musteri', value: invoice.customer },
              { label: 'Duzenleme Tarihi', value: formatDate(invoice.issueDate) },
              { label: 'Vade Tarihi', value: formatDate(invoice.dueDate) },
            ]}
          />
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Aciklama</p>
            <p className="mt-2 text-sm">{invoice.note || 'Aciklama girilmedi.'}</p>
          </div>
        </SectionCard>

        <SectionCard
          title="Kalemler"
          description="Fatura satirlari"
          contentClassName="space-y-3 xl:col-span-2"
        >
          {invoice.lines.map((line) => (
            <div
              key={`${invoice.id}-${line.product}`}
              className="rounded-lg border p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{line.product}</p>
                  <p className="text-xs text-muted-foreground">
                    {line.quantity} x {formatCurrency(line.unitPrice)} - %{line.taxRate} KDV
                  </p>
                </div>
                <Badge variant="outline">
                  {formatCurrency(line.quantity * line.unitPrice * (1 + line.taxRate / 100))}
                </Badge>
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
