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
import {
  accountStatements,
  balanceMeta,
  currentAccounts,
  defaultStatement,
} from '@/lib/data/accounts'
import { formatCurrency, formatDate, formatNumber } from '@/lib/ui-meta'

export default function CurrentAccountsPage() {
  const receivable = currentAccounts
    .filter((item) => item.balance > 0)
    .reduce((sum, item) => sum + item.balance, 0)
  const payable = currentAccounts
    .filter((item) => item.balance < 0)
    .reduce((sum, item) => sum + Math.abs(item.balance), 0)
  const previewStatement = accountStatements['CARI-001'] ?? defaultStatement

  return (
    <>
      <PageHeader
        title="Cari Hesaplar"
        description="Musteri ve tedarikci bakiyeleri ile hesap hareketleri."
      />

      <MetricGrid
        items={[
          { label: 'Toplam Cari', value: formatNumber(currentAccounts.length) },
          { label: 'Alacak', value: formatCurrency(receivable), badge: 'Musteri', badgeVariant: 'success' },
          { label: 'Borc', value: formatCurrency(payable), badge: 'Tedarikci', badgeVariant: 'destructive' },
          { label: 'Riskte Hesap', value: formatNumber(currentAccounts.filter((item) => Math.abs(item.balance) > item.creditLimit * 0.5).length), badge: 'Takip', badgeVariant: 'warning' },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Cari Liste"
          description="Bakiyeler ve limitler"
          contentClassName="px-0 xl:col-span-2"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Cari</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Sehir</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead className="text-right">Bakiye</TableHead>
                <TableHead className="text-right">Limit</TableHead>
                <TableHead className="pr-6 text-right">Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentAccounts.map((account) => {
                const meta = balanceMeta(account.balance)
                return (
                  <TableRow key={account.id}>
                    <TableCell className="pl-6">
                      <div className="flex flex-col">
                        <span className="font-medium">{account.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {account.taxNumber}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {account.type === 'customer' ? 'Musteri' : 'Tedarikci'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {account.city}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {account.phone}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(account.balance)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(account.creditLimit)}
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

        <SectionCard
          title="Ekstre Onizleme"
          description="Secili cari icin son hesap hareketleri"
          contentClassName="space-y-3"
        >
          {previewStatement.map((row) => (
            <div key={row.id} className="rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{row.description}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(row.date)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-muted-foreground">
                <span>Bakiye</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(row.balance)}
                </span>
              </div>
            </div>
          ))}
        </SectionCard>
      </div>
    </>
  )
}
