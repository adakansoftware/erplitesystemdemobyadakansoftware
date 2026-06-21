'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Building2, Wallet } from 'lucide-react'
import { useAppSettings, type AppSettings } from '@/hooks/use-app-settings'
import { useAuth } from '@/hooks/use-auth'
import { useErpCollections } from '@/hooks/use-erp-store'
import { PageHeader } from '@/components/shared/page-header'
import { MetricGrid, SectionCard } from '@/components/shared/module-primitives'
import { SearchInput } from '@/components/shared/search-input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  balanceMeta,
  defaultStatement,
} from '@/lib/data/accounts'
import { dealStageMeta, leadStatusMeta, taskPriorityMeta } from '@/lib/data/crm'
import { transactionMeta } from '@/lib/data/finance'
import { formatCurrency, formatDate, formatNumber } from '@/lib/ui-meta'

function readHash() {
  if (typeof window === 'undefined') return ''
  return window.location.hash.replace('#', '')
}

export function CurrentAccountsPageClient() {
  const {
    createCurrentAccount,
    currentAccounts,
    deleteCurrentAccount,
    getStatementByAccountId,
    updateCurrentAccount,
  } = useErpCollections()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'all' | 'customer' | 'supplier'>('all')
  const [selectedId, setSelectedId] = useState('CARI-001')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: 'customer',
    taxNumber: '',
    city: '',
    phone: '',
    email: '',
    creditLimit: '0',
    balance: '0',
  })

  useEffect(() => {
    const hash = readHash()
    if (hash) setSelectedId(hash)
  }, [])

  const filteredAccounts = useMemo(
    () =>
      currentAccounts.filter((account) => {
        const matchesTab = tab === 'all' || account.type === tab
        const haystack =
          `${account.name} ${account.taxNumber} ${account.city} ${account.email}`.toLocaleLowerCase(
            'tr-TR',
          )
        return (
          matchesTab && haystack.includes(query.toLocaleLowerCase('tr-TR'))
        )
      }),
    [currentAccounts, query, tab],
  )

  const selectedAccount =
    currentAccounts.find((account) => account.id === selectedId) ??
    filteredAccounts[0] ??
    currentAccounts[0]

  useEffect(() => {
    if (!selectedAccount) {
      return
    }

    setForm({
      name: selectedAccount.name,
      type: selectedAccount.type,
      taxNumber: selectedAccount.taxNumber,
      city: selectedAccount.city,
      phone: selectedAccount.phone,
      email: selectedAccount.email,
      creditLimit: String(selectedAccount.creditLimit),
      balance: String(selectedAccount.balance),
    })
  }, [selectedAccount])
  const previewStatement =
    (selectedAccount ? getStatementByAccountId(selectedAccount.id) : defaultStatement) ??
    defaultStatement

  const receivable = currentAccounts
    .filter((item) => item.balance > 0)
    .reduce((sum, item) => sum + item.balance, 0)
  const payable = currentAccounts
    .filter((item) => item.balance < 0)
    .reduce((sum, item) => sum + Math.abs(item.balance), 0)

  function updateField<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleCreate() {
    const nextAccount = await createCurrentAccount({
      name: form.name,
      type: form.type as 'customer' | 'supplier',
      taxNumber: form.taxNumber,
      city: form.city,
      phone: form.phone,
      email: form.email,
      creditLimit: Number(form.creditLimit || 0),
      balance: Number(form.balance || 0),
    })

    toast.success('Cari hesap olusturuldu')
    setSelectedId(nextAccount.id)
    setIsFormOpen(false)
  }

  async function handleUpdate() {
    if (!selectedAccount) {
      return
    }

    await updateCurrentAccount(selectedAccount.id, {
      name: form.name,
      type: form.type as 'customer' | 'supplier',
      taxNumber: form.taxNumber,
      city: form.city,
      phone: form.phone,
      email: form.email,
      creditLimit: Number(form.creditLimit || 0),
      balance: Number(form.balance || 0),
    })

    toast.success('Cari hesap guncellendi')
  }

  async function handleDelete() {
    if (!selectedAccount) {
      return
    }

    await deleteCurrentAccount(selectedAccount.id)
    toast.success('Cari hesap silindi')
    setSelectedId(currentAccounts[0]?.id ?? '')
  }

  return (
    <>
      <PageHeader
        title="Cari Hesaplar"
        description="Musteri ve tedarikci bakiyeleri ile hesap hareketleri."
        actions={
          <Button onClick={() => setIsFormOpen((current) => !current)}>
            Yeni Cari Ekle
          </Button>
        }
      />

      <MetricGrid
        items={[
          { label: 'Toplam Cari', value: formatNumber(currentAccounts.length) },
          {
            label: 'Alacak',
            value: formatCurrency(receivable),
            badge: 'Musteri',
            badgeVariant: 'success',
          },
          {
            label: 'Borc',
            value: formatCurrency(payable),
            badge: 'Tedarikci',
            badgeVariant: 'destructive',
          },
          {
            label: 'Riskte Hesap',
            value: formatNumber(
              currentAccounts.filter(
                (item) => Math.abs(item.balance) > item.creditLimit * 0.5,
              ).length,
            ),
            badge: 'Takip',
            badgeVariant: 'warning',
          },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Cari Liste"
          description="Bakiyeler ve limitler"
          contentClassName="px-0 xl:col-span-2"
          action={
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Cari ara..."
              className="w-56"
            />
          }
        >
          <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
            <TabsList className="mx-4 mt-1">
              <TabsTrigger value="all">Tumu</TabsTrigger>
              <TabsTrigger value="customer">Musteri</TabsTrigger>
              <TabsTrigger value="supplier">Tedarikci</TabsTrigger>
            </TabsList>
          </Tabs>
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
              {filteredAccounts.map((account) => {
                const meta = balanceMeta(account.balance)
                const isSelected = account.id === selectedAccount?.id

                return (
                  <TableRow
                    key={account.id}
                    id={account.id}
                    className="scroll-mt-24 cursor-pointer data-[state=selected]:bg-muted"
                    data-state={isSelected ? 'selected' : undefined}
                    onClick={() => setSelectedId(account.id)}
                  >
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
          title={selectedAccount.name}
          description="Secili cari icin son hesap hareketleri"
          contentClassName="space-y-3"
        >
          <div className="grid gap-3">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="account-name">Cari Adi</FieldLabel>
                <Input
                  id="account-name"
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                />
              </Field>
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  value={form.type}
                  onChange={(event) => updateField('type', event.target.value)}
                />
                <Input
                  value={form.taxNumber}
                  onChange={(event) => updateField('taxNumber', event.target.value)}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  value={form.city}
                  onChange={(event) => updateField('city', event.target.value)}
                />
                <Input
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                />
                <Input
                  value={form.creditLimit}
                  onChange={(event) =>
                    updateField('creditLimit', event.target.value)
                  }
                />
              </div>
            </FieldGroup>
            <div className="flex gap-2">
              <Button onClick={() => void (isFormOpen ? handleCreate() : handleUpdate())}>
                {isFormOpen ? 'Cariyi Kaydet' : 'Degisiklikleri Kaydet'}
              </Button>
              {!isFormOpen ? (
                <Button variant="outline" onClick={() => void handleDelete()}>
                  Sil
                </Button>
              ) : null}
            </div>
          </div>
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

export function FinancePageClient() {
  const { financeAccounts, transactions } = useErpCollections()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'all' | 'cash' | 'bank'>('all')

  const filteredAccounts = useMemo(
    () =>
      financeAccounts.filter((account) => {
        const matchesTab = tab === 'all' || account.type === tab
        const haystack =
          `${account.name} ${account.bankName ?? ''} ${account.iban ?? ''}`.toLocaleLowerCase(
            'tr-TR',
          )
        return (
          matchesTab && haystack.includes(query.toLocaleLowerCase('tr-TR'))
        )
      }),
    [query, tab],
  )

  const cashAccounts = financeAccounts.filter((item) => item.type === 'cash')
  const bankAccounts = financeAccounts.filter((item) => item.type === 'bank')
  const totalBalance = financeAccounts.reduce(
    (sum, item) => sum + item.balance,
    0,
  )

  return (
    <>
      <PageHeader
        title="Kasa & Banka"
        description="Kasa ve banka hesap bakiyeleri ile son hareketler."
      />

      <MetricGrid
        items={[
          { label: 'Toplam Bakiye', value: formatCurrency(totalBalance) },
          {
            label: 'Kasa Hesabi',
            value: formatNumber(cashAccounts.length),
            badge: 'Nakit',
            badgeVariant: 'info',
          },
          {
            label: 'Banka Hesabi',
            value: formatNumber(bankAccounts.length),
            badge: 'Banka',
            badgeVariant: 'success',
          },
          {
            label: 'Son Islem',
            value: transactions[0].id,
            badge: transactionMeta[transactions[0].type].label,
            badgeVariant: transactionMeta[transactions[0].type].variant,
          },
        ]}
      />

      <SectionCard
        title="Hesaplar"
        description="Nakit ve banka hesaplari"
        action={
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Hesap ara..."
            className="w-56"
          />
        }
      >
        <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
          <TabsList>
            <TabsTrigger value="all">Tumu</TabsTrigger>
            <TabsTrigger value="cash">Kasa</TabsTrigger>
            <TabsTrigger value="bank">Banka</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {filteredAccounts.map((account) => (
            <SectionCard
              key={account.id}
              title={account.name}
              description={
                account.type === 'cash' ? 'Kasa hesabi' : account.bankName
              }
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
      </SectionCard>

      <SectionCard
        title="Son Hareketler"
        description="Gelir ve gider kayitlarinin guncel hareket listesi"
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
                <TableRow
                  key={transaction.id}
                  id={transaction.id}
                  className="scroll-mt-24"
                >
                  <TableCell className="pl-6 font-medium">
                    {transaction.id}
                  </TableCell>
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

export function LeadsPageClient() {
  const { leads } = useErpCollections()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<
    'all' | 'new' | 'contacted' | 'qualified' | 'lost'
  >('all')

  const filteredLeads = useMemo(
    () =>
      leads.filter((lead) => {
        const matchesTab = tab === 'all' || lead.status === tab
        const haystack =
          `${lead.name} ${lead.company} ${lead.owner} ${lead.source}`.toLocaleLowerCase(
            'tr-TR',
          )
        return (
          matchesTab && haystack.includes(query.toLocaleLowerCase('tr-TR'))
        )
      }),
    [query, tab],
  )

  return (
    <>
      <PageHeader
        title="Leads"
        description="CRM tarafindaki yeni firsatlar ve ilk temas kayitlari."
      />

      <MetricGrid
        items={[
          { label: 'Toplam Lead', value: formatNumber(leads.length) },
          {
            label: 'Yeni',
            value: formatNumber(
              leads.filter((item) => item.status === 'new').length,
            ),
            badge: 'Sicak',
            badgeVariant: 'info',
          },
          {
            label: 'Nitelikli',
            value: formatNumber(
              leads.filter((item) => item.status === 'qualified').length,
            ),
            badge: 'Hazir',
            badgeVariant: 'success',
          },
          {
            label: 'Potansiyel Hacim',
            value: formatCurrency(
              leads.reduce((sum, item) => sum + item.value, 0),
            ),
          },
        ]}
      />

      <SectionCard
        title="Lead Listesi"
        description="Yeni kazanilabilecek musteriler ve ilk temas kayitlari"
        contentClassName="px-0"
        action={
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Lead ara..."
            className="w-56"
          />
        }
      >
        <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
          <TabsList className="mx-4 mt-1">
            <TabsTrigger value="all">Tumu</TabsTrigger>
            <TabsTrigger value="new">Yeni</TabsTrigger>
            <TabsTrigger value="contacted">Iletisimde</TabsTrigger>
            <TabsTrigger value="qualified">Nitelikli</TabsTrigger>
            <TabsTrigger value="lost">Kaybedildi</TabsTrigger>
          </TabsList>
        </Tabs>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Lead</TableHead>
              <TableHead>Sirket</TableHead>
              <TableHead>Kaynak</TableHead>
              <TableHead>Sorumlu</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="text-right">Deger</TableHead>
              <TableHead className="pr-6 text-right">Durum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead) => {
              const meta = leadStatusMeta[lead.status]
              return (
                <TableRow
                  key={lead.id}
                  id={lead.id}
                  className="scroll-mt-24"
                >
                  <TableCell className="pl-6">
                    <div className="flex flex-col">
                      <span className="font-medium">{lead.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {lead.id}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{lead.company}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.source}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.owner}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(lead.createdAt)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(lead.value)}
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

export function DealsPageClient() {
  const { deals } = useErpCollections()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<
    'all' | 'lead' | 'proposal' | 'negotiation' | 'won' | 'lost'
  >('all')

  const filteredDeals = useMemo(
    () =>
      deals.filter((deal) => {
        const matchesTab = tab === 'all' || deal.stage === tab
        const haystack =
          `${deal.title} ${deal.customer} ${deal.owner}`.toLocaleLowerCase(
            'tr-TR',
          )
        return (
          matchesTab && haystack.includes(query.toLocaleLowerCase('tr-TR'))
        )
      }),
    [query, tab],
  )

  return (
    <>
      <PageHeader
        title="Anlasmalar"
        description="CRM pipeline icindeki satis firsatlari ve kapanis tarihleri."
      />

      <MetricGrid
        items={[
          { label: 'Toplam Firsat', value: deals.length },
          {
            label: 'Acik Hacim',
            value: formatCurrency(
              deals
                .filter((item) => !['won', 'lost'].includes(item.stage))
                .reduce((sum, item) => sum + item.value, 0),
            ),
          },
          {
            label: 'Kazanilan',
            value: deals.filter((item) => item.stage === 'won').length,
            badge: 'Basari',
            badgeVariant: 'success',
          },
          {
            label: 'Kaybedilen',
            value: deals.filter((item) => item.stage === 'lost').length,
            badge: 'Risk',
            badgeVariant: 'destructive',
          },
        ]}
      />

      <SectionCard
        title="Firsat Hatti"
        description="Kapanis hedefi olan kayitlar"
        action={
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Anlasma ara..."
            className="w-56"
          />
        }
      >
        <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
          <TabsList>
            <TabsTrigger value="all">Tumu</TabsTrigger>
            <TabsTrigger value="lead">Aday</TabsTrigger>
            <TabsTrigger value="proposal">Teklif</TabsTrigger>
            <TabsTrigger value="negotiation">Gorusme</TabsTrigger>
            <TabsTrigger value="won">Kazanildi</TabsTrigger>
            <TabsTrigger value="lost">Kaybedildi</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-4">
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredDeals.map((deal) => {
                const meta = dealStageMeta[deal.stage]
                return (
                  <SectionCard
                    key={deal.id}
                    id={deal.id}
                    className="scroll-mt-24"
                    title={deal.title}
                    description={deal.customer}
                    contentClassName="space-y-3"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sorumlu</span>
                      <span className="font-medium">{deal.owner}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Kapanis</span>
                      <span className="font-medium">
                        {formatDate(deal.closeDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-sm font-medium">
                        {formatCurrency(deal.value)}
                      </span>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </div>
                  </SectionCard>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </SectionCard>
    </>
  )
}

export function TasksPageClient() {
  const { createTask, deleteTask, tasks, toggleTask } = useErpCollections()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'all' | 'open' | 'done'>('all')
  const [isCreating, setIsCreating] = useState(false)
  const [form, setForm] = useState({
    title: '',
    related: '',
    due: '',
    priority: 'medium',
    owner: '',
  })

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const matchesTab =
          tab === 'all' || (tab === 'open' ? !task.done : task.done)
        const haystack =
          `${task.title} ${task.related} ${task.owner}`.toLocaleLowerCase(
            'tr-TR',
          )
        return (
          matchesTab && haystack.includes(query.toLocaleLowerCase('tr-TR'))
        )
      }),
    [query, tab],
  )

  return (
    <>
      <PageHeader
        title="Gorevler"
        description="Takip, satis ve operasyon gorevlerini ekip bazinda yonetin."
        actions={
          <Button onClick={() => setIsCreating((current) => !current)}>
            Yeni Gorev
          </Button>
        }
      />

      <MetricGrid
        items={[
          { label: 'Toplam Gorev', value: tasks.length },
          {
            label: 'Acil',
            value: tasks.filter((item) => item.priority === 'high').length,
            badge: 'Oncelik',
            badgeVariant: 'destructive',
          },
          {
            label: 'Tamamlanan',
            value: tasks.filter((item) => item.done).length,
            badge: 'Bitti',
            badgeVariant: 'success',
          },
          {
            label: 'Bekleyen',
            value: tasks.filter((item) => !item.done).length,
            badge: 'Aksiyon',
            badgeVariant: 'warning',
          },
        ]}
      />

      <SectionCard
        title="Gorev Listesi"
        description="Ekip icindeki takip ve teslim listesi"
        action={
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Gorev ara..."
            className="w-56"
          />
        }
      >
        {isCreating ? (
          <div className="space-y-3 border-b px-6 pb-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Gorev basligi"
              />
              <Input
                value={form.related}
                onChange={(event) =>
                  setForm((current) => ({ ...current, related: event.target.value }))
                }
                placeholder="Ilgili musteri / konu"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                value={form.due}
                onChange={(event) =>
                  setForm((current) => ({ ...current, due: event.target.value }))
                }
                placeholder="2024-04-25"
              />
              <Input
                value={form.priority}
                onChange={(event) =>
                  setForm((current) => ({ ...current, priority: event.target.value }))
                }
                placeholder="high / medium / low"
              />
              <Input
                value={form.owner}
                onChange={(event) =>
                  setForm((current) => ({ ...current, owner: event.target.value }))
                }
                placeholder="Sorumlu"
              />
            </div>
            <Button
              onClick={async () => {
                await createTask({
                  title: form.title,
                  related: form.related,
                  due: form.due,
                  priority: form.priority as 'high' | 'medium' | 'low',
                  owner: form.owner,
                })
                toast.success('Gorev olusturuldu')
                setForm({
                  title: '',
                  related: '',
                  due: '',
                  priority: 'medium',
                  owner: '',
                })
                setIsCreating(false)
              }}
            >
              Gorevi Kaydet
            </Button>
          </div>
        ) : null}
        <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
          <TabsList>
            <TabsTrigger value="all">Tumu</TabsTrigger>
            <TabsTrigger value="open">Acik</TabsTrigger>
            <TabsTrigger value="done">Tamamlanan</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-4">
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredTasks.map((task) => {
                const meta = taskPriorityMeta[task.priority]
                return (
                  <SectionCard
                    key={task.id}
                    id={task.id}
                    className="scroll-mt-24"
                    title={task.title}
                    description={task.related}
                    contentClassName="space-y-3"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sorumlu</span>
                      <span className="font-medium">{task.owner}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Termin</span>
                      <span className="font-medium">{formatDate(task.due)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            await toggleTask(task.id)
                            toast.success('Gorev durumu guncellendi')
                          }}
                        >
                          {task.done ? 'Geri Ac' : 'Tamamla'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            await deleteTask(task.id)
                            toast.success('Gorev silindi')
                          }}
                        >
                          Sil
                        </Button>
                        <Badge variant={task.done ? 'success' : 'secondary'}>
                          {task.done ? 'Tamamlandi' : 'Acik'}
                        </Badge>
                      </div>
                    </div>
                  </SectionCard>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </SectionCard>
    </>
  )
}

export function SettingsPageClient() {
  const { settings, updateSettings, isReady } = useAppSettings()
  const { currentUser } = useAuth()
  const [form, setForm] = useState(settings)
  const canManageSettings = currentUser?.role === 'admin'

  useEffect(() => {
    if (isReady) setForm(settings)
  }, [isReady, settings])

  function updateField<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setForm((current: AppSettings) => ({ ...current, [key]: value }))
  }

  async function handleSave() {
    if (!canManageSettings) {
      toast.error('Bu alani sadece yonetici guncelleyebilir')
      return
    }

    await updateSettings(form)
    toast.success('Ayarlar kaydedildi')
  }

  return (
    <>
      <PageHeader
        title="Ayarlar"
        description="Sistem genel ayarlari ve operasyon tercihleri."
        actions={
          <Button onClick={() => void handleSave()} disabled={!canManageSettings}>
            Degisiklikleri Kaydet
          </Button>
        }
      />

      {!canManageSettings ? (
        <SectionCard
          title="Yetki Siniri"
          description="Bu ekrandaki degisiklikler sadece admin rolundeki kullanicilar tarafindan kaydedilebilir."
        >
          <p className="text-sm text-muted-foreground">
            Mevcut oturum yalnizca ayarlari goruntuleyebilir.
          </p>
        </SectionCard>
      ) : null}

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company">Firma Bilgileri</TabsTrigger>
          <TabsTrigger value="notifications">Bildirimler</TabsTrigger>
        </TabsList>
        <TabsContent value="company">
          <SectionCard
            title="Sirket Bilgileri"
            description="Baslikta ve belgelerde kullanilan alanlar"
            contentClassName="space-y-4"
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="company-name">Firma Unvani</FieldLabel>
                <Input
                  id="company-name"
                  value={form.companyName}
                  onChange={(event) =>
                    updateField('companyName', event.target.value)
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="company-address">Adres</FieldLabel>
                <Input
                  id="company-address"
                  value={form.companyAddress}
                  onChange={(event) =>
                    updateField('companyAddress', event.target.value)
                  }
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="company-tax-office">Vergi Dairesi</FieldLabel>
                  <Input
                    id="company-tax-office"
                    value={form.taxOffice}
                    onChange={(event) =>
                      updateField('taxOffice', event.target.value)
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="company-tax-number">Vergi No</FieldLabel>
                  <Input
                    id="company-tax-number"
                    value={form.taxNumber}
                    onChange={(event) =>
                      updateField('taxNumber', event.target.value)
                    }
                  />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  placeholder="Telefon"
                />
                <Input
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="E-posta"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  value={form.website}
                  onChange={(event) => updateField('website', event.target.value)}
                  placeholder="Web sitesi"
                />
                <Input
                  value={form.logoUrl}
                  onChange={(event) => updateField('logoUrl', event.target.value)}
                  placeholder="Logo URL"
                />
              </div>
            </FieldGroup>
          </SectionCard>
        </TabsContent>
        <TabsContent value="notifications">
          <SectionCard
            title="Bildirimler"
            description="Arayuz uyarilari"
            contentClassName="space-y-4"
          >
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Dusuk stok uyarilari</p>
              <p className="text-xs text-muted-foreground">
                Kritik stokta ust bar bildirimi
              </p>
            </div>
            <Switch
              checked={form.lowStockAlerts}
              onCheckedChange={(checked) =>
                updateField('lowStockAlerts', checked)
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Vadesi gecen faturalar</p>
              <p className="text-xs text-muted-foreground">
                Gecikmis tahsilat bildirimi
              </p>
            </div>
            <Switch
              checked={form.overdueInvoiceAlerts}
              onCheckedChange={(checked) =>
                updateField('overdueInvoiceAlerts', checked)
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Gun sonu ozet maili</p>
              <p className="text-xs text-muted-foreground">
                Gunluk ozet ve yonetim bilgilendirmesi
              </p>
            </div>
            <Switch
              checked={form.dailySummaryEmail}
              onCheckedChange={(checked) =>
                updateField('dailySummaryEmail', checked)
              }
            />
          </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </>
  )
}
