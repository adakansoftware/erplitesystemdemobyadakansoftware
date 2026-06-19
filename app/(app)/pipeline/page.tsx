import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/module-primitives'
import { Badge } from '@/components/ui/badge'
import { deals, dealStageMeta } from '@/lib/data/crm'
import { formatCurrency } from '@/lib/ui-meta'

const stages: Array<keyof typeof dealStageMeta> = [
  'lead',
  'proposal',
  'negotiation',
  'won',
  'lost',
]

export default function PipelinePage() {
  return (
    <>
      <PageHeader
        title="Pipeline"
        description="Mevcut CRM stilinde kanban benzeri satis hatti gorunumu."
      />

      <div className="grid gap-4 xl:grid-cols-5">
        {stages.map((stage) => {
          const meta = dealStageMeta[stage]
          const items = deals.filter((deal) => deal.stage === stage)
          return (
            <SectionCard
              key={stage}
              title={meta.label}
              description={`${items.length} kayit`}
              contentClassName="space-y-3"
            >
              {items.map((deal) => (
                <div key={deal.id} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">{deal.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {deal.customer}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {formatCurrency(deal.value)}
                    </span>
                    <Badge variant={meta.variant}>{deal.owner}</Badge>
                  </div>
                </div>
              ))}
            </SectionCard>
          )
        })}
      </div>
    </>
  )
}
