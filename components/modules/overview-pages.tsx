'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Boxes,
  FileText,
  Receipt,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { CategorySalesChart } from '@/components/dashboard/category-sales-chart'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { MetricGrid, SectionCard } from '@/components/shared/module-primitives'
import { SearchInput } from '@/components/shared/search-input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useErpCollections } from '@/hooks/use-erp-store'
import { movementMeta } from '@/lib/data/inventory'
import { getStockStatus, productStatusMeta } from '@/lib/data/products'
import { invoiceStatusMeta, invoiceTotals } from '@/lib/data/invoices'
import { quotationStatusMeta, quotationTotals } from '@/lib/data/quotations'
import { formatCurrency, formatDate, formatNumber } from '@/lib/ui-meta'

function normalize(value: string) {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function DashboardPageClient() {
  const { financeAccounts, invoices, products, quotations } = useErpCollections()

  const recentInvoices = invoices.slice(0, 5)
  const lowStock = products.filter((product) => product.stock <= product.reorderPoint)
  const monthlyRevenue = invoices
    .filter((invoice) => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoiceTotals(invoice.lines).total, 0)
  const openInvoices = invoices
    .filter((invoice) => invoice.status === 'sent' || invoice.status === 'overdue')
    .reduce((sum, invoice) => sum + invoiceTotals(invoice.lines).total, 0)
  const stockValue = products.reduce(
    (sum, product) => sum + product.stock * product.costPrice,
    0,
  )
  const cashPosition = financeAccounts.reduce((sum, account) => {
    return account.currency === 'TRY' ? sum + account.balance : sum
  }, 0)
  const draftQuotations = quotations.filter((quotation) => quotation.status === 'draft').length

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Isletmenizin satis, stok ve finans ozetine tek bakista ulasin."
      >
        <Button variant="outline" render={<Link href="/raporlar">Raporlar</Link>} />
        <Button render={<Link href="/faturalar/yeni">Yeni Fatura</Link>} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Aylik Ciro"
          value={formatCurrency(monthlyRevenue)}
          change={`${formatNumber(invoices.filter((item) => item.status === 'paid').length)} tahsilat`}
          trend="up"
          hint="odenen faturalar"
          icon={TrendingUp}
        />
        <StatCard
          label="Acik Faturalar"
          value={formatCurrency(openInvoices)}
          change={`${formatNumber(invoices.filter((item) => item.status === 'overdue').length)} gecikmis`}
          trend="down"
          hint="tahsilat bekleyen"
          icon={Receipt}
        />
        <StatCard
          label="Stok Degeri"
          value={formatCurrency(stockValue)}
          change={`${formatNumber(lowStock.length)} riskli urun`}
          trend="up"
          hint="guncel envanter"
          icon={Boxes}
        />
        <StatCard
          label="Nakit Pozisyon"
          value={formatCurrency(cashPosition)}
          change={`${formatNumber(draftQuotations)} taslak teklif`}
          trend="up"
          hint="TRY hesap bakiyesi"
          icon={Wallet}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Gelir & Gider Trendi</CardTitle>
            <CardDescription>Son 8 ayin finansal hareketi</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Kategori Bazli Satis</CardTitle>
            <CardDescription>Bu ayin dagilimi</CardDescription>
          </CardHeader>
          <CardContent>
            <CategorySalesChart />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Son Faturalar</CardTitle>
            <CardAction>
              <Button
                variant="ghost"
                size="sm"
                render={
                  <Link href="/faturalar">
                    Tumu
                    <ArrowUpRight />
                  </Link>
                }
              />
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Fatura</TableHead>
                  <TableHead>Musteri</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead className="pr-6 text-right">Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.map((invoice) => {
                  const { total } = invoiceTotals(invoice.lines)
                  const meta = invoiceStatusMeta[invoice.status]

                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="pl-6 font-medium">
                        <Link
                          href={`/faturalar/${invoice.id}`}
                          className="hover:underline"
                        >
                          {invoice.id}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {invoice.customer}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(invoice.issueDate)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(total)}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dusuk Stok Uyarilari</CardTitle>
            <CardAction>
              <Button
                variant="ghost"
                size="sm"
                render={
                  <Link href="/stok">
                    Stok
                    <ArrowUpRight />
                  </Link>
                }
              />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {lowStock.slice(0, 5).map((product) => {
              const status = getStockStatus(product)

              return (
                <Link
                  key={product.id}
                  href={`/urunler/${product.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.sku} - {product.stock} {product.unit}
                    </p>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </Link>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export function StockPageClient() {
  const { products, stockMovements, warehouses } = useErpCollections()
  const [query, setQuery] = useState('')
  const [stockTab, setStockTab] = useState('all')
  const [movementTab, setMovementTab] = useState('all')

  const normalizedQuery = normalize(query)
  const totalCapacity = warehouses.reduce((sum, item) => sum + item.capacity, 0)
  const totalUsed = warehouses.reduce((sum, item) => sum + item.used, 0)
  const criticalProducts = products.filter((product) => product.stock === 0)
  const lowProducts = products.filter(
    (product) => product.stock > 0 && product.stock <= product.reorderPoint,
  )
  const activeProducts = products.filter((product) => product.status === 'active')

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        normalize(
          [
            product.id,
            product.name,
            product.sku,
            product.brand,
            product.category,
          ].join(' '),
        ).includes(normalizedQuery)

      if (!matchesQuery) {
        return false
      }

      if (stockTab === 'critical') {
        return product.stock === 0
      }

      if (stockTab === 'low') {
        return product.stock > 0 && product.stock <= product.reorderPoint
      }

      if (stockTab === 'healthy') {
        return product.stock > product.reorderPoint
      }

      return true
    })
  }, [normalizedQuery, products, stockTab])

  const filteredMovements = useMemo(() => {
    return stockMovements.filter((movement) => {
      const matchesQuery =
        !normalizedQuery ||
        normalize(
          [
            movement.id,
            movement.product,
            movement.sku,
            movement.relatedDoc ?? '',
            movement.warehouse,
          ].join(' '),
        ).includes(normalizedQuery)

      if (!matchesQuery) {
        return false
      }

      return movementTab === 'all' ? true : movement.type === movementTab
    })
  }, [movementTab, normalizedQuery])

  return (
    <>
      <PageHeader
        title="Stok"
        description="Depolar, doluluk oranlari ve son stok hareketleri ayni ekranda izlenir."
      />

      <MetricGrid
        items={[
          { label: 'Depo Sayisi', value: formatNumber(warehouses.length) },
          { label: 'Aktif Urun', value: formatNumber(activeProducts.length) },
          {
            label: 'Kritik Stok',
            value: formatNumber(criticalProducts.length),
            badge: 'Acil',
            badgeVariant: 'destructive',
          },
          {
            label: 'Kullanilan Alan',
            value: formatNumber(totalUsed),
            badge: `${Math.round((totalUsed / totalCapacity) * 100)}%`,
            badgeVariant: 'info',
          },
        ]}
      />

      <SectionCard
        title="Stok Kartlari"
        description="Canli urun stoklari ve yeniden siparis durumu"
        action={
          <div className="w-full max-w-xs">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Urun, SKU veya marka ara..."
              inputClassName="h-9 rounded-lg"
            />
          </div>
        }
        contentClassName="space-y-4"
      >
        <Tabs value={stockTab} onValueChange={setStockTab}>
          <TabsList>
            <TabsTrigger value="all">Tum Urunler</TabsTrigger>
            <TabsTrigger value="critical">Stok Yok</TabsTrigger>
            <TabsTrigger value="low">Dusuk Stok</TabsTrigger>
            <TabsTrigger value="healthy">Yeterli</TabsTrigger>
          </TabsList>
          <TabsContent value={stockTab} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.slice(0, 9).map((product) => {
                const stockMeta = getStockStatus(product)
                const statusMeta = productStatusMeta[product.status]

                return (
                  <Link
                    key={product.id}
                    href={`/urunler/${product.id}`}
                    className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {product.name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {product.sku} - {product.brand}
                        </p>
                      </div>
                      <Badge variant={stockMeta.variant}>{stockMeta.label}</Badge>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">Mevcut</p>
                        <p className="mt-1 font-medium">
                          {product.stock} {product.unit}
                        </p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">Esik</p>
                        <p className="mt-1 font-medium">
                          {product.reorderPoint} {product.unit}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{product.category}</span>
                      <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                    </div>
                  </Link>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </SectionCard>

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
        contentClassName="space-y-4 px-0"
      >
        <div className="px-6">
          <Tabs value={movementTab} onValueChange={setMovementTab}>
            <TabsList>
              <TabsTrigger value="all">Tum Hareketler</TabsTrigger>
              <TabsTrigger value="in">Giris</TabsTrigger>
              <TabsTrigger value="out">Cikis</TabsTrigger>
              <TabsTrigger value="transfer">Transfer</TabsTrigger>
              <TabsTrigger value="adjustment">Duzeltme</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
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
            {filteredMovements.map((movement) => {
              const meta = movementMeta[movement.type]
              return (
                <TableRow key={movement.id} id={movement.id} className="scroll-mt-24">
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
                    {movement.qty}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {movement.relatedDoc ?? movement.note}
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

export function ReportsPageClient() {
  const { invoices, products, quotations, warehouses } = useErpCollections()
  const [reportTab, setReportTab] = useState('summary')

  const monthlyRevenue = invoices
    .filter((item) => item.status === 'paid')
    .reduce((sum, item) => sum + invoiceTotals(item.lines).total, 0)
  const openReceivables = invoices
    .filter((item) => item.status === 'sent' || item.status === 'overdue')
    .reduce((sum, item) => sum + invoiceTotals(item.lines).total, 0)
  const quotationVolume = quotations.reduce(
    (sum, item) => sum + quotationTotals(item.lines).total,
    0,
  )
  const lowStockProducts = products.filter(
    (item) => item.stock <= item.reorderPoint,
  )

  const topCustomers = useMemo(() => {
    const totals = invoices.reduce<Record<string, number>>((accumulator, invoice) => {
      const total = invoiceTotals(invoice.lines).total
      accumulator[invoice.customer] = (accumulator[invoice.customer] ?? 0) + total
      return accumulator
    }, {})

    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [invoices])

  const quotationBreakdown = Object.entries(
    quotations.reduce<Record<string, number>>((accumulator, quotation) => {
      accumulator[quotation.status] = (accumulator[quotation.status] ?? 0) + 1
      return accumulator
    }, {}),
  )

  return (
    <>
      <PageHeader
        title="Raporlar"
        description="Satis, tahsilat ve stok performansini yonetim ozetleriyle izleyin."
      />

      <MetricGrid
        items={[
          { label: 'Aylik Ciro', value: formatCurrency(monthlyRevenue) },
          { label: 'Acik Tahsilat', value: formatCurrency(openReceivables) },
          { label: 'Teklif Hacmi', value: formatCurrency(quotationVolume) },
          {
            label: 'Stok Riski',
            value: formatNumber(lowStockProducts.length),
            badge: 'Takip',
            badgeVariant: 'warning',
          },
        ]}
      />

      <Tabs value={reportTab} onValueChange={setReportTab}>
        <TabsList>
          <TabsTrigger value="summary">Yonetici Ozeti</TabsTrigger>
          <TabsTrigger value="sales">Satis Belgeleri</TabsTrigger>
          <TabsTrigger value="stock">Stok Sagligi</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="grid gap-4 xl:grid-cols-3">
            <SectionCard
              title="Fatura Durum Dagilimi"
              description="Duruma gore belge sayilari"
              contentClassName="space-y-3"
            >
              {Object.entries(
                invoices.reduce<Record<string, number>>((accumulator, invoice) => {
                  accumulator[invoice.status] = (accumulator[invoice.status] ?? 0) + 1
                  return accumulator
                }, {}),
              ).map(([status, count]) => {
                const meta =
                  invoiceStatusMeta[status as keyof typeof invoiceStatusMeta]

                return (
                  <div
                    key={status}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="text-sm font-medium">{meta.label}</span>
                    <Badge variant={meta.variant}>{count}</Badge>
                  </div>
                )
              })}
            </SectionCard>

            <SectionCard
              title="En Yuksek Hacimli Musteriler"
              description="Fatura toplamlarina gore ilk 5 hesap"
              contentClassName="space-y-3"
            >
              {topCustomers.map(([customer, total]) => (
                <div
                  key={customer}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="text-sm font-medium">{customer}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(total)}
                  </span>
                </div>
              ))}
            </SectionCard>

            <SectionCard
              title="Teklif Durum Ozetleri"
              description="Musteri teklif hattinin dagilimi"
              contentClassName="space-y-3"
            >
              {quotationBreakdown.map(([status, count]) => {
                const meta =
                  quotationStatusMeta[status as keyof typeof quotationStatusMeta]

                return (
                  <div
                    key={status}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="text-sm font-medium">{meta.label}</span>
                    <Badge variant={meta.variant}>{count}</Badge>
                  </div>
                )
              })}
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="sales">
          <SectionCard
            title="Belge Ozetleri"
            description="Son kayitlar ve finansal durum"
            contentClassName="px-0"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Tip</TableHead>
                  <TableHead>Belge No</TableHead>
                  <TableHead>Musteri</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead className="text-right">Toplam</TableHead>
                  <TableHead className="pr-6 text-right">Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  ...invoices.slice(0, 4).map((invoice) => ({
                    type: 'Fatura',
                    id: invoice.id,
                    customer: invoice.customer,
                    date: invoice.issueDate,
                    total: invoiceTotals(invoice.lines).total,
                    meta: invoiceStatusMeta[invoice.status],
                    href: `/faturalar/${invoice.id}`,
                  })),
                  ...quotations.slice(0, 4).map((quotation) => ({
                    type: 'Teklif',
                    id: quotation.id,
                    customer: quotation.customer,
                    date: quotation.date,
                    total: quotationTotals(quotation.lines).total,
                    meta: quotationStatusMeta[quotation.status],
                    href: `/teklifler/${quotation.id}`,
                  })),
                ]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="pl-6">{item.type}</TableCell>
                      <TableCell className="font-medium">
                        <Link href={item.href} className="hover:underline">
                          {item.id}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.customer}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(item.date)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.total)}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Badge variant={item.meta.variant}>{item.meta.label}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </SectionCard>
        </TabsContent>

        <TabsContent value="stock">
          <div className="grid gap-4 xl:grid-cols-3">
            <SectionCard
              title="Stok Riskleri"
              description="Yeniden siparis gerektiren urunler"
              contentClassName="space-y-3"
            >
              {lowStockProducts.slice(0, 6).map((product) => {
                const meta = getStockStatus(product)

                return (
                  <Link
                    key={product.id}
                    href={`/urunler/${product.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.stock} {product.unit}
                      </p>
                    </div>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </Link>
                )
              })}
            </SectionCard>

            <SectionCard
              title="Depo Kapasite Ozetleri"
              description="Operasyon yogunlugu"
              contentClassName="space-y-3"
            >
              {warehouses.map((warehouse) => {
                const usage = Math.round((warehouse.used / warehouse.capacity) * 100)

                return (
                  <div key={warehouse.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{warehouse.name}</span>
                      <span className="text-muted-foreground">%{usage}</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${usage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </SectionCard>

            <SectionCard
              title="Urun Portfoyu"
              description="Katalog durum dagilimi"
              contentClassName="space-y-3"
            >
              {Object.entries(
                products.reduce<Record<string, number>>((accumulator, product) => {
                  accumulator[product.status] = (accumulator[product.status] ?? 0) + 1
                  return accumulator
                }, {}),
              ).map(([status, count]) => {
                const meta = productStatusMeta[status as keyof typeof productStatusMeta]

                return (
                  <div
                    key={status}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="text-sm font-medium">{meta.label}</span>
                    <Badge variant={meta.variant}>{count}</Badge>
                  </div>
                )
              })}
            </SectionCard>
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}
