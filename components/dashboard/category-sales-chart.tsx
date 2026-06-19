'use client'

import { Cell, Pie, PieChart } from 'recharts'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

const data = [
  { name: 'Elektrikli Aletler', value: 38, fill: 'var(--chart-1)' },
  { name: 'El Aletleri', value: 22, fill: 'var(--chart-2)' },
  { name: 'Bahce', value: 18, fill: 'var(--chart-3)' },
  { name: 'Boya & Kimyasal', value: 14, fill: 'var(--chart-4)' },
  { name: 'Hirdavat', value: 8, fill: 'var(--chart-5)' },
]

const config = {
  value: { label: 'Pay' },
} satisfies ChartConfig

export function CategorySalesChart() {
  return (
    <ChartContainer config={config} className="mx-auto h-[280px] w-full">
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, name) => (
                <div className="flex w-full items-center justify-between gap-3">
                  <span className="text-muted-foreground">{name}</span>
                  <span className="font-mono font-medium">%{value}</span>
                </div>
              )}
            />
          }
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="name" />}
          className="flex-wrap"
        />
      </PieChart>
    </ChartContainer>
  )
}
