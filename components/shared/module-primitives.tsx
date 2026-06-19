import { SummaryCard } from '@/components/shared/summary-card'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { BadgeVariant } from '@/lib/ui-meta'
import { cn } from '@/lib/utils'

type MetricItem = {
  label: string
  value: string | number
  badge?: string
  badgeVariant?: BadgeVariant
  valueClassName?: string
}

export function MetricGrid({
  items,
  className,
}: {
  items: MetricItem[]
  className?: string
}) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}>
      {items.map((item) => (
        <SummaryCard key={item.label} {...item} />
      ))}
    </div>
  )
}

export function SectionCard({
  title,
  description,
  action,
  footer,
  contentClassName,
  className,
  id,
  children,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  footer?: React.ReactNode
  contentClassName?: string
  className?: string
  id?: string
  children: React.ReactNode
}) {
  return (
    <Card id={id} className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  )
}

export function DetailList({
  items,
  columns = 2,
}: {
  items: Array<{ label: string; value: React.ReactNode }>
  columns?: 1 | 2 | 3
}) {
  return (
    <div
      className={cn(
        'grid gap-4',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'grid-cols-1 md:grid-cols-2',
        columns === 3 && 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col gap-1 rounded-lg border p-3"
        >
          <span className="text-xs text-muted-foreground">{item.label}</span>
          <span className="text-sm font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  )
}
