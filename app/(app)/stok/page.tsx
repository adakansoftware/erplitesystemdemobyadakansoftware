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
import { stockMovements, warehouses, movementMeta } from '@/lib/data/inventory'
import { formatDate, formatNumber } from '@/lib/ui-meta'

export default function StockPage() {
  const totalCapacity = warehouses.reduce((sum, item) => sum + item.capacity, 0)
  const totalUsed = warehouses.reduce((sum, item) => sum + item.used, 0)

  return (
    <>
      <PageHeader
        title="Stok"
        description="Depolar, doluluk oranlari ve son stok hareketleri ayni ekranda izlenir."
      />

      <MetricGrid
        items={[
          { label: 'Depo Sayisi', value: formatNumber(warehouses.length) },
          { label: 'Toplam Kapasite', value: formatNumber(totalCapacity) },
          { label: 'Kullanilan Alan', value: formatNumber(totalUsed), badge: `${Math.round((totalUsed / totalCapacity) * 100)}%`, badgeVariant: 'info' },
          { label: 'Son Hareket', value: stockMovements[0].id, badge: movementMeta[stockMovements[0].type].label, badgeVariant: movementMeta[stockMovements[0].type].variant },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {warehouses.map((warehouse) => {
          const usage = Math.round((warehouse.used / warehouse.capacity) * 100)
          return (
            <SectionCard
              key={warehouse.id}
              title={warehouse.name}
              description={warehouse.location}
              contentClassName="space-y-3"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sorumlu</span>
                <span className="font-medium">{warehouse.manager}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Stok Kalemi</span>
                <span className="font-medium">{warehouse.itemCount}</span>
              </div>
              <div className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Doluluk</span>
                  <span className="font-medium">%{usage}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${usage}%` }}
                  />
                </div>
              </div>
            </SectionCard>
          )
        })}
      </div>

      <SectionCard
        title="Stok Hareketleri"
        description="Giris, cikis, transfer ve duzeltme kayitlari"
        contentClassName="px-0"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Hareket</TableHead>
              <TableHead>Urun</TableHead>
              <TableHead>Depo</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Miktar</TableHead>
              <TableHead>Referans</TableHead>
              <TableHead className="pr-6 text-right">Tip</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stockMovements.map((movement) => {
              const meta = movementMeta[movement.type]
              return (
                <TableRow key={movement.id}>
                  <TableCell className="pl-6 font-medium">{movement.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{movement.product}</span>
                      <span className="text-xs text-muted-foreground">
                        {movement.sku}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {movement.warehouse}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(movement.date)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {movement.quantity}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {movement.reference}
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
