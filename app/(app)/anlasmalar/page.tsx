import { PageHeader } from '@/components/shared/page-header'
import { MetricGrid, SectionCard } from '@/components/shared/module-primitives'
import { Badge } from '@/components/ui/badge'
import { deals, dealStageMeta } from '@/lib/data/crm'
import { formatCurrency, formatDate } from '@/lib/ui-meta'

export default function DealsPage() {
  return (
    <>
      <PageHeader
        title="Anlasmalar"
        description="CRM pipeline icindeki satis firsatlari ve kapanis tarihleri."
      />

      <MetricGrid
        items={[
          { label: 'Toplam Firsat', value: deals.length },
          { label: 'Acik Hacim', value: formatCurrency(deals.filter((item) => !['won', 'lost'].includes(item.stage)).reduce((sum, item) => sum + item.value, 0)) },
          { label: 'Kazanilan', value: deals.filter((item) => item.stage === 'won').length, badge: 'Basari', badgeVariant: 'success' },
          { label: 'Kaybedilen', value: deals.filter((item) => item.stage === 'lost').length, badge: 'Risk', badgeVariant: 'destructive' },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {deals.map((deal) => {
          const meta = dealStageMeta[deal.stage]
          return (
            <SectionCard
              key={deal.id}
              id={deal.id}
              className="scroll-mt-24"
              title={deal.title}
              description={deal.customer}
              contentClassName="space-y-3"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sorumlu</span>
                <span className="font-medium">{deal.owner}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Kapanis</span>
                <span className="font-medium">{formatDate(deal.closeDate)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm font-medium">{formatCurrency(deal.value)}</span>
                <Badge variant={meta.variant}>{meta.label}</Badge>
              </div>
            </SectionCard>
          )
        })}
      </div>
    </>
  )
}
