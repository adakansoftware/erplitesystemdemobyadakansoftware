import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { BadgeVariant } from '@/lib/ui-meta'

type SummaryCardProps = {
  label: string
  value: string | number
  badge?: string
  badgeVariant?: BadgeVariant
  valueClassName?: string
}

export function SummaryCard({
  label,
  value,
  badge,
  badgeVariant = 'secondary',
  valueClassName,
}: SummaryCardProps) {
  return (
    <Card className="gap-0">
      <CardContent className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className={valueClassName ?? 'text-2xl font-semibold'}>
            {value}
          </span>
        </div>
        {badge ? <Badge variant={badgeVariant}>{badge}</Badge> : null}
      </CardContent>
    </Card>
  )
}
