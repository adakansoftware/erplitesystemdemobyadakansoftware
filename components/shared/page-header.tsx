import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  const actionContent = actions ?? children

  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-muted-foreground text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {actionContent ? (
        <div className="flex flex-wrap items-center gap-2">{actionContent}</div>
      ) : null}
    </div>
  )
}
