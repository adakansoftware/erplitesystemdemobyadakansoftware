import { PageHeader } from '@/components/shared/page-header'
import { MetricGrid, SectionCard } from '@/components/shared/module-primitives'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { leads, leadStatusMeta } from '@/lib/data/crm'
import { formatCurrency, formatDate, formatNumber } from '@/lib/ui-meta'

export default function LeadsPage() {
  return (
    <>
      <PageHeader
        title="Leads"
        description="CRM tarafindaki yeni firsatlar ve ilk temas kayitlari."
      />

      <MetricGrid
        items={[
          { label: 'Toplam Lead', value: formatNumber(leads.length) },
          { label: 'Yeni', value: formatNumber(leads.filter((item) => item.status === 'new').length), badge: 'Sicak', badgeVariant: 'info' },
          { label: 'Nitelikli', value: formatNumber(leads.filter((item) => item.status === 'qualified').length), badge: 'Hazir', badgeVariant: 'success' },
          { label: 'Potansiyel Hacim', value: formatCurrency(leads.reduce((sum, item) => sum + item.value, 0)) },
        ]}
      />

      <SectionCard
        title="Lead Listesi"
        description="Yeni kazanilabilecek musteriler ve ilk temas kayitlari"
        contentClassName="px-0"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Lead</TableHead>
              <TableHead>Sirket</TableHead>
              <TableHead>Kaynak</TableHead>
              <TableHead>Sorumlu</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="text-right">Deger</TableHead>
              <TableHead className="pr-6 text-right">Durum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => {
              const meta = leadStatusMeta[lead.status]
              return (
                <TableRow
                  key={lead.id}
                  id={lead.id}
                  className="scroll-mt-24"
                >
                  <TableCell className="pl-6">
                    <div className="flex flex-col">
                      <span className="font-medium">{lead.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {lead.id}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{lead.company}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.source}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.owner}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(lead.createdAt)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(lead.value)}
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Badge variant={meta.variant}>{meta.label}</Badge>
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
