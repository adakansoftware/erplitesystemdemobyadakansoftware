'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DetailList, MetricGrid, SectionCard } from '@/components/shared/module-primitives'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useErpCollections } from '@/hooks/use-erp-store'
import { purchaseStatusMeta, purchaseTotals } from '@/lib/data/purchases'
import { formatCurrency, formatDate, formatNumber } from '@/lib/ui-meta'

export function PurchasesPageClient() {
  const { purchases } = useErpCollections()
  const openOrders = purchases.filter((item) =>
    ['draft', 'ordered', 'partial'].includes(item.status),
  )
  const receivedTotal = purchases
    .filter((item) => item.status === 'received')
    .reduce((sum, item) => sum + purchaseTotals(item.lines).total, 0)

  return (
    <>
      <PageHeader
        title="Satin Alma"
        description="Tedarik siparisleri, beklenen teslimatlar ve alim hacmi."
      >
        <Button render={<Link href="/satin-alma/yeni">Yeni Siparis</Link>}>
          <Plus data-icon="inline-start" />
        </Button>
      </PageHeader>

      <MetricGrid
        items={[
          { label: 'Toplam Siparis', value: formatNumber(purchases.length) },
          {
            label: 'Acik Siparis',
            value: formatNumber(openOrders.length),
            badge: 'Takip',
            badgeVariant: 'warning',
          },
          {
            label: 'Teslim Alinan',
            value: formatCurrency(receivedTotal),
            badge: 'Stok',
            badgeVariant: 'success',
          },
          {
            label: 'Kismi Kabul',
            value: formatNumber(
              purchases.filter((item) => item.status === 'partial').length,
            ),
          },
        ]}
      />

      <SectionCard
        title="Siparis Listesi"
        description="Tedarikci bazli satin alma belgeleri"
        contentClassName="px-0"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Siparis</TableHead>
              <TableHead>Tedarikci</TableHead>
              <TableHead>Siparis Tarihi</TableHead>
              <TableHead>Beklenen</TableHead>
              <TableHead className="text-right">Toplam</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="pr-6 text-right">Detay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((purchase) => {
              const meta = purchaseStatusMeta[purchase.status]
              const totals = purchaseTotals(purchase.lines)

              return (
                <TableRow key={purchase.id}>
                  <TableCell className="pl-6 font-medium">{purchase.id}</TableCell>
                  <TableCell>{purchase.supplier}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(purchase.orderDate)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(purchase.expectedDate)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(totals.total)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      render={<Link href={`/satin-alma/${purchase.id}`}>Incele</Link>}
                    />
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

export function NewPurchasePageClient() {
  const router = useRouter()
  const { createPurchaseOrder } = useErpCollections()
  const [form, setForm] = useState({
    supplier: 'Bosch Turkiye Dagitim',
    orderDate: '2024-04-20',
    expectedDate: '2024-04-28',
    note: 'Sezon oncesi tedarik planlamasi icin olusturulan alim belgesi.',
    line1Product: 'Bosch GSR 12V-15 Akulu Vidalama',
    line1Qty: '12',
    line1UnitPrice: '2385',
    line1TaxRate: '20',
    line2Product: 'Bosch Profesyonel Tornavida Seti 40 Parca',
    line2Qty: '30',
    line2UnitPrice: '405',
    line2TaxRate: '20',
  })

  const totals = useMemo(() => {
    return purchaseTotals([
      {
        product: form.line1Product,
        qty: Number(form.line1Qty || 0),
        unitPrice: Number(form.line1UnitPrice || 0),
        taxRate: Number(form.line1TaxRate || 0),
      },
      {
        product: form.line2Product,
        qty: Number(form.line2Qty || 0),
        unitPrice: Number(form.line2UnitPrice || 0),
        taxRate: Number(form.line2TaxRate || 0),
      },
    ])
  }, [form])

  function updateField<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSave() {
    const nextPurchase = await createPurchaseOrder({
      supplier: form.supplier,
      orderDate: form.orderDate,
      expectedDate: form.expectedDate,
      note: form.note,
      status: 'ordered',
      lines: [
        {
          product: form.line1Product,
          qty: Number(form.line1Qty || 0),
          unitPrice: Number(form.line1UnitPrice || 0),
          taxRate: Number(form.line1TaxRate || 0),
        },
        {
          product: form.line2Product,
          qty: Number(form.line2Qty || 0),
          unitPrice: Number(form.line2UnitPrice || 0),
          taxRate: Number(form.line2TaxRate || 0),
        },
      ],
    })

    if (!nextPurchase) {
      toast.error('Satin alma siparisi olusturulamadi')
      return
    }

    toast.success('Satin alma siparisi olusturuldu')
    router.push(`/satin-alma/${nextPurchase.id}`)
  }

  return (
    <>
      <PageHeader
        title="Yeni Satin Alma"
        description="Tedarikciye gidecek siparis belgesini hazirlayin."
      >
        <Button variant="outline" render={<Link href="/satin-alma">Vazgec</Link>} />
        <Button onClick={() => void handleSave()}>Siparisi Kaydet</Button>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Siparis Bilgileri"
          description="Tedarikci ve teslim tarihleri"
          contentClassName="space-y-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="purchase-supplier">Tedarikci</FieldLabel>
              <Input
                id="purchase-supplier"
                value={form.supplier}
                onChange={(event) => updateField('supplier', event.target.value)}
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="purchase-date">Siparis Tarihi</FieldLabel>
                <Input
                  id="purchase-date"
                  value={form.orderDate}
                  onChange={(event) => updateField('orderDate', event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="purchase-expected">Beklenen Tarih</FieldLabel>
                <Input
                  id="purchase-expected"
                  value={form.expectedDate}
                  onChange={(event) =>
                    updateField('expectedDate', event.target.value)
                  }
                />
              </Field>
            </div>
          </FieldGroup>
        </SectionCard>

        <SectionCard
          title="Kalemler"
          description="Tedarik alinacak urun satirlari"
          contentClassName="space-y-4"
        >
          {[
            ['line1Product', 'line1Qty', 'line1UnitPrice', 'line1TaxRate'],
            ['line2Product', 'line2Qty', 'line2UnitPrice', 'line2TaxRate'],
          ].map(([productKey, qtyKey, priceKey, taxKey]) => (
            <div key={productKey} className="space-y-3 rounded-lg border p-4">
              <Input
                value={form[productKey as keyof typeof form]}
                onChange={(event) =>
                  updateField(productKey as keyof typeof form, event.target.value)
                }
              />
              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  value={form[qtyKey as keyof typeof form]}
                  onChange={(event) =>
                    updateField(qtyKey as keyof typeof form, event.target.value)
                  }
                />
                <Input
                  value={form[priceKey as keyof typeof form]}
                  onChange={(event) =>
                    updateField(priceKey as keyof typeof form, event.target.value)
                  }
                />
                <Input
                  value={form[taxKey as keyof typeof form]}
                  onChange={(event) =>
                    updateField(taxKey as keyof typeof form, event.target.value)
                  }
                />
              </div>
            </div>
          ))}
        </SectionCard>

        <SectionCard
          title="Siparis Notu"
          description="Operasyon aciklamasi ve maliyet ozeti"
          contentClassName="space-y-4"
        >
          <Textarea
            value={form.note}
            onChange={(event) => updateField('note', event.target.value)}
          />
          <div className="rounded-lg border p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ara Toplam</span>
              <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground">KDV</span>
              <span className="font-medium">{formatCurrency(totals.tax)}</span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <span className="font-medium">Genel Toplam</span>
              <span className="text-base font-semibold">
                {formatCurrency(totals.total)}
              </span>
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  )
}

export function PurchaseDetailPageClient() {
  const params = useParams<{ id: string }>()
  const { getPurchaseById, hydrated } = useErpCollections()
  const purchase = getPurchaseById(params.id)

  if (hydrated && !purchase) {
    return (
      <SectionCard
        title="Siparis Bulunamadi"
        description="Istenen satin alma belgesi kayitlarda yer almiyor."
      >
        <Button render={<Link href="/satin-alma">Listeye don</Link>} />
      </SectionCard>
    )
  }

  if (!purchase) {
    return null
  }

  const meta = purchaseStatusMeta[purchase.status]
  const totals = purchaseTotals(purchase.lines)

  return (
    <>
      <PageHeader
        title={purchase.id}
        description={`${purchase.supplier} icin acilan satin alma siparisi.`}
      >
        <Button variant="outline" render={<Link href="/satin-alma">Listeye Don</Link>} />
        <Button render={<Link href="/satin-alma/yeni">Yeni Siparis</Link>} />
      </PageHeader>

      <MetricGrid
        items={[
          { label: 'Tedarikci', value: purchase.supplier },
          {
            label: 'Durum',
            value: meta.label,
            badge: 'Satin Alma',
            badgeVariant: meta.variant,
          },
          { label: 'Beklenen', value: formatDate(purchase.expectedDate) },
          { label: 'Toplam', value: formatCurrency(totals.total) },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Belge Ozeti"
          description="Siparis ust bilgi alanlari"
          contentClassName="space-y-4"
        >
          <DetailList
            items={[
              { label: 'Belge No', value: purchase.id },
              { label: 'Tedarikci', value: purchase.supplier },
              { label: 'Siparis Tarihi', value: formatDate(purchase.orderDate) },
              { label: 'Beklenen Tarih', value: formatDate(purchase.expectedDate) },
            ]}
          />
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Not</p>
            <p className="mt-2 text-sm">{purchase.note || 'Not girilmedi.'}</p>
          </div>
        </SectionCard>

        <SectionCard
          title="Kalemler"
          description="Siparis satirlari"
          contentClassName="space-y-3 xl:col-span-2"
        >
          {purchase.lines.map((line) => (
            <div key={`${purchase.id}-${line.product}`} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{line.product}</p>
                  <p className="text-xs text-muted-foreground">
                    {line.qty} x {formatCurrency(line.unitPrice)} - %{line.taxRate} KDV
                  </p>
                </div>
                <Badge variant="outline">
                  {formatCurrency(line.qty * line.unitPrice * (1 + line.taxRate / 100))}
                </Badge>
              </div>
            </div>
          ))}
        </SectionCard>
      </div>
    </>
  )
}
