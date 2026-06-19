import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function StatCard({
  title,
  label,
  value,
  change,
  trend = 'up',
  icon: Icon,
  hint,
}: {
  title?: string
  label?: string
  value: string
  change?: string
  trend?: 'up' | 'down'
  icon?: LucideIcon
  hint?: string
}) {
  const heading = label ?? title ?? ''

  return (
    <Card className="gap-0">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {heading}
          </span>
          {Icon ? (
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-4.5" />
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-semibold tracking-tight">{value}</span>
          <div className="flex items-center gap-1.5 text-xs">
            {change ? (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 font-medium',
                  trend === 'up' ? 'text-success' : 'text-destructive',
                )}
              >
                {trend === 'up' ? (
                  <ArrowUpRight className="size-3.5" />
                ) : (
                  <ArrowDownRight className="size-3.5" />
                )}
                {change}
              </span>
            ) : null}
            {hint ? (
              <span className="text-muted-foreground">{hint}</span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
