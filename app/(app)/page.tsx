import Link from 'next/link'
import {
  ArrowUpRight,
  Boxes,
  FileText,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { CategorySalesChart } from '@/components/dashboard/category-sales-chart'
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
import { invoices, invoiceStatusMeta, invoiceTotals } from '@/lib/data/invoices'
import { products, getStockStatus } from '@/lib/data/products'
import { formatCurrency, formatDate } from '@/lib/ui-meta'

export default function DashboardPage() {
  const recentInvoices = invoices.slice(0, 5)
  const lowStock = products
    .filter((p) => p.stock <= p.reorderPoint)
    .slice(0, 5)

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
          value={formatCurrency(845200)}
          change="%12,4"
          trend="up"
          hint="gecen aya gore"
          icon={TrendingUp}
        />
        <StatCard
          label="Acik Faturalar"
          value={formatCurrency(186400)}
          change="%4,1"
          trend="down"
          hint="tahsilat bekleyen"
          icon={Receipt}
        />
        <StatCard
          label="Stok Degeri"
          value={formatCurrency(1284500)}
          change="%2,8"
          trend="up"
          hint="guncel envanter"
          icon={Boxes}
        />
        <StatCard
          label="Nakit Pozisyon"
          value={formatCurrency(789150)}
          change="%6,2"
          trend="up"
          hint="kasa + banka"
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
            {lowStock.map((product) => {
              const status = getStockStatus(product)
              return (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {product.sku} - {product.stock} {product.unit}
                    </p>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
