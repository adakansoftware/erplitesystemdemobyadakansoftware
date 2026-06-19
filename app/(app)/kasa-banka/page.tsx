import { Building2, Wallet } from 'lucide-react'
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
  financeAccounts,
  transactionMeta,
  transactions,
} from '@/lib/data/finance'
import { formatCurrency, formatDate, formatNumber } from '@/lib/ui-meta'

export default function FinancePage() {
  const cashAccounts = financeAccounts.filter((item) => item.type === 'cash')
  const bankAccounts = financeAccounts.filter((item) => item.type === 'bank')
  const totalBalance = financeAccounts.reduce((sum, item) => sum + item.balance, 0)

  return (
    <>
      <PageHeader
        title="Kasa & Banka"
        description="Kasa ve banka hesap bakiyeleri ile son hareketler."
      />

      <MetricGrid
        items={[
          { label: 'Toplam Bakiye', value: formatCurrency(totalBalance) },
          { label: 'Kasa Hesabi', value: formatNumber(cashAccounts.length), badge: 'Nakit', badgeVariant: 'info' },
          { label: 'Banka Hesabi', value: formatNumber(bankAccounts.length), badge: 'Banka', badgeVariant: 'success' },
          { label: 'Son Islem', value: transactions[0].id, badge: transactionMeta[transactions[0].type].label, badgeVariant: transactionMeta[transactions[0].type].variant },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {financeAccounts.map((account) => (
          <SectionCard
            key={account.id}
            title={account.name}
            description={account.type === 'cash' ? 'Kasa hesabi' : account.bankName}
            contentClassName="space-y-3"
          >
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                {account.type === 'cash' ? (
                  <Wallet className="size-4 text-muted-foreground" />
                ) : (
                  <Building2 className="size-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">Guncel Bakiye</span>
              </div>
              <span className="text-sm font-semibold">
                {formatCurrency(account.balance, account.currency)}
              </span>
            </div>
            {account.iban ? (
              <div className="rounded-lg border p-3 text-sm">
                <p className="text-muted-foreground">IBAN</p>
                <p className="mt-1 font-medium">{account.iban}</p>
              </div>
            ) : null}
          </SectionCard>
        ))}
      </div>

      <SectionCard
        title="Son Hareketler"
        description="Gelir ve gider kayitlarinin statik onizlemesi"
        contentClassName="px-0"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Islem</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Aciklama</TableHead>
              <TableHead>Hesap</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Tutar</TableHead>
              <TableHead className="pr-6 text-right">Tip</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => {
              const meta = transactionMeta[transaction.type]
              return (
                <TableRow key={transaction.id}>
                  <TableCell className="pl-6 font-medium">{transaction.id}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {transaction.account}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {transaction.category}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(transaction.amount)}
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
