'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

const data = [
  { month: 'Eyl', gelir: 520000, gider: 410000 },
  { month: 'Eki', gelir: 610000, gider: 445000 },
  { month: 'Kas', gelir: 580000, gider: 470000 },
  { month: 'Ara', gelir: 720000, gider: 510000 },
  { month: 'Oca', gelir: 690000, gider: 495000 },
  { month: 'Sub', gelir: 760000, gider: 540000 },
  { month: 'Mar', gelir: 810000, gider: 560000 },
  { month: 'Nis', gelir: 845200, gider: 588000 },
]

const config = {
  gelir: { label: 'Gelir', color: 'var(--chart-1)' },
  gider: { label: 'Gider', color: 'var(--chart-3)' },
} satisfies ChartConfig

function compact(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function RevenueChart() {
  return (
    <ChartContainer config={config} className="h-[280px] w-full">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 4 }}>
        <defs>
          <linearGradient id="fillGelir" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-gelir)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-gelir)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="fillGider" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-gider)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-gider)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(value) => compact(value as number)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <div className="flex w-full items-center justify-between gap-3">
                  <span className="text-muted-foreground">
                    {config[name as keyof typeof config]?.label ?? name}
                  </span>
                  <span className="font-mono font-medium">
                    {compact(value as number)} TL
                  </span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          dataKey="gelir"
          type="monotone"
          stroke="var(--color-gelir)"
          fill="url(#fillGelir)"
          strokeWidth={2}
        />
        <Area
          dataKey="gider"
          type="monotone"
          stroke="var(--color-gider)"
          fill="url(#fillGider)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}
