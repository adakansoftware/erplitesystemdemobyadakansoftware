import Link from 'next/link'
import { Plus } from 'lucide-react'
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
  quotationStatusMeta,
  quotations,
  quotationTotals,
} from '@/lib/data/quotations'
import { formatCurrency, formatDate, formatNumber } from '@/lib/ui-meta'

export default function QuotationsPage() {
  const acceptedCount = quotations.filter((item) => item.status === 'accepted').length
  const pipelineTotal = quotations.reduce(
    (sum, item) => sum + quotationTotals(item.lines).total,
    0,
  )

  return (
    <>
      <PageHeader
        title="Teklifler"
        description="Musterilere giden tekliflerin durumu ve toplam tutarlari."
      >
        <Button render={<Link href="/teklifler/yeni">Yeni Teklif</Link>}>
          <Plus data-icon="inline-start" />
        </Button>
      </PageHeader>

      <MetricGrid
        items={[
          { label: 'Toplam Teklif', value: formatNumber(quotations.length) },
          { label: 'Kabul Edilen', value: formatNumber(acceptedCount), badge: 'Kazanilan', badgeVariant: 'success' },
          { label: 'Bekleyen', value: formatNumber(quotations.filter((item) => ['sent', 'draft'].includes(item.status)).length), badge: 'Aksiyon', badgeVariant: 'warning' },
          { label: 'Teklif Hacmi', value: formatCurrency(pipelineTotal) },
        ]}
      />

      <SectionCard
        title="Teklif Listesi"
        description="Musterilere giden tekliflerin durum ve toplam tutar takibi"
        contentClassName="px-0"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Teklif</TableHead>
              <TableHead>Musteri</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Gecerlilik</TableHead>
              <TableHead className="text-right">Toplam</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="pr-6 text-right">Detay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotations.map((quotation) => {
              const meta = quotationStatusMeta[quotation.status]
              const totals = quotationTotals(quotation.lines)

              return (
                <TableRow key={quotation.id}>
                  <TableCell className="pl-6 font-medium">{quotation.id}</TableCell>
                  <TableCell>{quotation.customer}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(quotation.date)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(quotation.validUntil)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(totals.total)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      render={<Link href={`/teklifler/${quotation.id}`}>Incele</Link>}
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
