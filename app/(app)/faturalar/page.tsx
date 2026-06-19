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
import { invoices, invoiceStatusMeta, invoiceTotals } from '@/lib/data/invoices'
import { formatCurrency, formatDate, formatNumber } from '@/lib/ui-meta'

export default function InvoicesPage() {
  const paidTotal = invoices
    .filter((item) => item.status === 'paid')
    .reduce((sum, item) => sum + invoiceTotals(item.lines).total, 0)
  const receivableTotal = invoices
    .filter((item) => ['sent', 'overdue'].includes(item.status))
    .reduce((sum, item) => sum + invoiceTotals(item.lines).total, 0)

  return (
    <>
      <PageHeader
        title="Faturalar"
        description="Kesilen satis faturalarinin durumu, tahsilat ve vade takibi."
      >
        <Button render={<Link href="/faturalar/yeni">Yeni Fatura</Link>}>
          <Plus data-icon="inline-start" />
        </Button>
      </PageHeader>

      <MetricGrid
        items={[
          { label: 'Toplam Fatura', value: formatNumber(invoices.length) },
          { label: 'Tahsil Edilen', value: formatCurrency(paidTotal), badge: 'Odendi', badgeVariant: 'success' },
          { label: 'Acik Alacak', value: formatCurrency(receivableTotal), badge: 'Bekliyor', badgeVariant: 'warning' },
          { label: 'Gecikmis', value: formatNumber(invoices.filter((item) => item.status === 'overdue').length), badge: 'Risk', badgeVariant: 'destructive' },
        ]}
      />

      <SectionCard
        title="Fatura Listesi"
        description="Satis faturalarinin belge, vade ve tahsilat durumu"
        contentClassName="px-0"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Fatura</TableHead>
              <TableHead>Musteri</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Vade</TableHead>
              <TableHead className="text-right">Toplam</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="pr-6 text-right">Detay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const meta = invoiceStatusMeta[invoice.status]
              const totals = invoiceTotals(invoice.lines)
              return (
                <TableRow key={invoice.id}>
                  <TableCell className="pl-6 font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.customer}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(invoice.issueDate)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(invoice.dueDate)}
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
                      render={<Link href={`/faturalar/${invoice.id}`}>Incele</Link>}
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
