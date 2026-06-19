import { PageHeader } from '@/components/shared/page-header'
import { MetricGrid, SectionCard } from '@/components/shared/module-primitives'
import { Badge } from '@/components/ui/badge'
import { tasks, taskPriorityMeta } from '@/lib/data/crm'
import { formatDate } from '@/lib/ui-meta'

export default function TasksPage() {
  return (
    <>
      <PageHeader
        title="Gorevler"
        description="Takip, satis ve operasyon gorevlerini ekip bazinda yonetin."
      />

      <MetricGrid
        items={[
          { label: 'Toplam Gorev', value: tasks.length },
          { label: 'Acil', value: tasks.filter((item) => item.priority === 'high').length, badge: 'Oncelik', badgeVariant: 'destructive' },
          { label: 'Tamamlanan', value: tasks.filter((item) => item.done).length, badge: 'Bitti', badgeVariant: 'success' },
          { label: 'Bekleyen', value: tasks.filter((item) => !item.done).length, badge: 'Aksiyon', badgeVariant: 'warning' },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {tasks.map((task) => {
          const meta = taskPriorityMeta[task.priority]
          return (
            <SectionCard
              key={task.id}
              id={task.id}
              className="scroll-mt-24"
              title={task.title}
              description={task.related}
              contentClassName="space-y-3"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sorumlu</span>
                <span className="font-medium">{task.owner}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Termin</span>
                <span className="font-medium">{formatDate(task.due)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Badge variant={meta.variant}>{meta.label}</Badge>
                <Badge variant={task.done ? 'success' : 'secondary'}>
                  {task.done ? 'Tamamlandi' : 'Acik'}
                </Badge>
              </div>
            </SectionCard>
          )
        })}
      </div>
    </>
  )
}
