'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import {
  DetailList,
  MetricGrid,
  SectionCard,
} from '@/components/shared/module-primitives'
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
import { useAppSettings } from '@/hooks/use-app-settings'
import { useErpCollections } from '@/hooks/use-erp-store'
import { invoiceStatusMeta, invoiceTotals } from '@/lib/data/invoices'
import { formatCurrency, formatDate, formatNumber } from '@/lib/ui-meta'

export function InvoicesPageClient() {
  const { invoices } = useErpCollections()
  const paidTotal = invoices
    .filter((item) => item.status === 'paid')
    .reduce((sum, item) => sum + invoiceTotals(item.lines).total, 0)
  const receivableTotal = invoices
    .filter((item) => ['sent', 'overdue'].includes(item.status))
    .reduce((sum, item) => sum + invoiceTotals(item.lines).total, 0)

  return (
    <>
      <PageHeader
        title="Faturalar"
        description="Kesilen satis faturalarinin durumu, tahsilat ve vade takibi."
      >
        <Button render={<Link href="/faturalar/yeni">Yeni Fatura</Link>}>
          <Plus data-icon="inline-start" />
        </Button>
      </PageHeader>

      <MetricGrid
        items={[
          { label: 'Toplam Fatura', value: formatNumber(invoices.length) },
          {
            label: 'Tahsil Edilen',
            value: formatCurrency(paidTotal),
            badge: 'Odendi',
            badgeVariant: 'success',
          },
          {
            label: 'Acik Alacak',
            value: formatCurrency(receivableTotal),
            badge: 'Bekliyor',
            badgeVariant: 'warning',
          },
          {
            label: 'Gecikmis',
            value: formatNumber(
              invoices.filter((item) => item.status === 'overdue').length,
            ),
            badge: 'Risk',
            badgeVariant: 'destructive',
          },
        ]}
      />

      <SectionCard
        title="Fatura Listesi"
        description="Satis faturalarinin belge, vade ve tahsilat durumu"
        contentClassName="px-0"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Fatura</TableHead>
              <TableHead>Musteri</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Vade</TableHead>
              <TableHead className="text-right">Toplam</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="pr-6 text-right">Detay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const meta = invoiceStatusMeta[invoice.status]
              const totals = invoiceTotals(invoice.lines)
              return (
                <TableRow key={invoice.id}>
                  <TableCell className="pl-6 font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.customer}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(invoice.issueDate)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(invoice.dueDate)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(totals.total)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                      {invoice.relatedQuotation ? (
                        <Link
                          href={`/teklifler/${invoice.relatedQuotation}`}
                          className="text-xs text-muted-foreground hover:underline"
                        >
                          {invoice.relatedQuotation}
                        </Link>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      render={<Link href={`/faturalar/${invoice.id}`}>Incele</Link>}
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

export function NewInvoicePageClient() {
  const router = useRouter()
  const { createInvoice } = useErpCollections()
  const [form, setForm] = useState({
    customer: 'Kaya Muhendislik A.S.',
    issueDate: '2024-04-19',
    dueDate: '2024-05-19',
    note:
      '30 gun vade uygulanir. Kismi tahsilat icin banka havalesi tercih edilir.',
    line1Product: 'DeWalt DCD709 Akulu Darbeli Matkap',
    line1Quantity: '4',
    line1UnitPrice: '5190',
    line1TaxRate: '20',
    line2Product: 'DeWalt Elmas Testere Disk 230mm',
    line2Quantity: '15',
    line2UnitPrice: '459',
    line2TaxRate: '20',
  })

  const totals = useMemo(() => {
    const lines = [
      {
        product: form.line1Product,
        quantity: Number(form.line1Quantity || 0),
        unitPrice: Number(form.line1UnitPrice || 0),
        taxRate: Number(form.line1TaxRate || 0),
      },
      {
        product: form.line2Product,
        quantity: Number(form.line2Quantity || 0),
        unitPrice: Number(form.line2UnitPrice || 0),
        taxRate: Number(form.line2TaxRate || 0),
      },
    ]

    return invoiceTotals(lines)
  }, [form])

  function updateField<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSave() {
    const nextInvoice = await createInvoice({
      customer: form.customer,
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      note: form.note,
      status: 'draft',
      lines: [
        {
          product: form.line1Product,
          quantity: Number(form.line1Quantity || 0),
          unitPrice: Number(form.line1UnitPrice || 0),
          taxRate: Number(form.line1TaxRate || 0),
        },
        {
          product: form.line2Product,
          quantity: Number(form.line2Quantity || 0),
          unitPrice: Number(form.line2UnitPrice || 0),
          taxRate: Number(form.line2TaxRate || 0),
        },
      ],
    })

    if (!nextInvoice) {
      toast.error('Fatura olusturulamadi')
      return
    }

    toast.success('Fatura olusturuldu')
    router.push(`/faturalar/${nextInvoice.id}`)
  }

  return (
    <>
      <PageHeader
        title="Yeni Fatura"
        description="Musteri faturalari icin belge olusturma arayuzu."
      >
        <Button variant="outline" render={<Link href="/faturalar">Vazgec</Link>} />
        <Button onClick={() => void handleSave()}>Faturayi Kaydet</Button>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Fatura Bilgileri"
          description="Musteri, tarih ve vade alanlari"
          contentClassName="space-y-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="invoice-customer">Musteri</FieldLabel>
              <Input
                id="invoice-customer"
                value={form.customer}
                onChange={(event) => updateField('customer', event.target.value)}
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="invoice-date">Fatura Tarihi</FieldLabel>
                <Input
                  id="invoice-date"
                  value={form.issueDate}
                  onChange={(event) =>
                    updateField('issueDate', event.target.value)
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="invoice-due">Vade Tarihi</FieldLabel>
                <Input
                  id="invoice-due"
                  value={form.dueDate}
                  onChange={(event) =>
                    updateField('dueDate', event.target.value)
                  }
                />
              </Field>
            </div>
          </FieldGroup>
        </SectionCard>

        <SectionCard
          title="Fatura Kalemleri"
          description="Belgeye eklenecek urun ve hizmet satirlari"
          contentClassName="space-y-4"
        >
          {[
            ['line1Product', 'line1Quantity', 'line1UnitPrice', 'line1TaxRate'],
            ['line2Product', 'line2Quantity', 'line2UnitPrice', 'line2TaxRate'],
          ].map(([productKey, quantityKey, priceKey, taxKey]) => (
            <div key={productKey} className="space-y-3 rounded-lg border p-4">
              <Input
                value={form[productKey as keyof typeof form]}
                onChange={(event) =>
                  updateField(productKey as keyof typeof form, event.target.value)
                }
              />
              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  value={form[quantityKey as keyof typeof form]}
                  onChange={(event) =>
                    updateField(
                      quantityKey as keyof typeof form,
                      event.target.value,
                    )
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
          title="Tahsilat Notu"
          description="Odeme ve aciklama alani"
          contentClassName="space-y-4"
        >
          <Field>
            <FieldLabel htmlFor="invoice-note">Aciklama</FieldLabel>
            <Textarea
              id="invoice-note"
              value={form.note}
              onChange={(event) => updateField('note', event.target.value)}
            />
          </Field>
          <div className="rounded-lg border p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ara Toplam</span>
              <span className="font-medium">
                {formatCurrency(totals.subtotal)}
              </span>
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

export function InvoiceDetailPageClient() {
  const params = useParams<{ id: string }>()
  const { getInvoiceById, hydrated, updateInvoice } = useErpCollections()
  const { settings } = useAppSettings()
  const invoice = getInvoiceById(params.id)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    customer: '',
    issueDate: '',
    dueDate: '',
    note: '',
    line1Product: '',
    line1Quantity: '0',
    line1UnitPrice: '0',
    line1TaxRate: '20',
    line2Product: '',
    line2Quantity: '0',
    line2UnitPrice: '0',
    line2TaxRate: '20',
  })

  useEffect(() => {
    if (!invoice) {
      return
    }

    setForm({
      customer: invoice.customer,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      note: invoice.note,
      line1Product: invoice.lines[0]?.product ?? '',
      line1Quantity: String(invoice.lines[0]?.quantity ?? 0),
      line1UnitPrice: String(invoice.lines[0]?.unitPrice ?? 0),
      line1TaxRate: String(invoice.lines[0]?.taxRate ?? 20),
      line2Product: invoice.lines[1]?.product ?? '',
      line2Quantity: String(invoice.lines[1]?.quantity ?? 0),
      line2UnitPrice: String(invoice.lines[1]?.unitPrice ?? 0),
      line2TaxRate: String(invoice.lines[1]?.taxRate ?? 20),
    })
  }, [invoice])

  if (hydrated && !invoice) {
    return (
      <SectionCard
        title="Fatura Bulunamadi"
        description="Istenen belge mevcut kayitlarda yer almiyor."
      >
        <Button render={<Link href="/faturalar">Fatura listesine don</Link>} />
      </SectionCard>
    )
  }

  if (!invoice) {
    return null
  }

  const currentInvoice = invoice
  const meta = invoiceStatusMeta[currentInvoice.status]
  const totals = invoiceTotals(currentInvoice.lines)
  const draftEditable = currentInvoice.status === 'draft'
  const editTotals = invoiceTotals(
    [
      form.line1Product
        ? {
            product: form.line1Product,
            quantity: Number(form.line1Quantity || 0),
            unitPrice: Number(form.line1UnitPrice || 0),
            taxRate: Number(form.line1TaxRate || 0),
          }
        : null,
      form.line2Product
        ? {
            product: form.line2Product,
            quantity: Number(form.line2Quantity || 0),
            unitPrice: Number(form.line2UnitPrice || 0),
            taxRate: Number(form.line2TaxRate || 0),
          }
        : null,
    ].filter(Boolean) as Array<{
      product: string
      quantity: number
      unitPrice: number
      taxRate: number
    }>,
  )

  function updateField<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSave() {
    const lines = [
      form.line1Product
        ? {
            product: form.line1Product,
            quantity: Number(form.line1Quantity || 0),
            unitPrice: Number(form.line1UnitPrice || 0),
            taxRate: Number(form.line1TaxRate || 0),
          }
        : null,
      form.line2Product
        ? {
            product: form.line2Product,
            quantity: Number(form.line2Quantity || 0),
            unitPrice: Number(form.line2UnitPrice || 0),
            taxRate: Number(form.line2TaxRate || 0),
          }
        : null,
    ].filter(Boolean) as Array<{
      product: string
      quantity: number
      unitPrice: number
      taxRate: number
    }>

    if (!lines.length) {
      toast.error('En az bir fatura kalemi girin')
      return
    }

    const updated = await updateInvoice(currentInvoice.id, {
      customer: form.customer,
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      note: form.note,
      status: 'draft',
      relatedQuotation: currentInvoice.relatedQuotation,
      lines,
    })

    if (!updated) {
      toast.error('Fatura guncellenemedi')
      return
    }

    toast.success('Fatura guncellendi')
    setIsEditing(false)
  }

  return (
    <>
      <div className="print-document print-only rounded-lg border p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-lg font-semibold">{settings.companyName}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {settings.companyAddress}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {settings.taxOffice} / {settings.taxNumber}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {settings.phone} - {settings.email}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">{invoice.id}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Musteri: {invoice.customer}
            </p>
          </div>
        </div>
      </div>
      <PageHeader
        title={currentInvoice.id}
        description={`${currentInvoice.customer} icin duzenlenen faturanin detay ekrani.`}
      >
        <Button variant="outline" render={<Link href="/faturalar">Listeye Don</Link>} />
        {draftEditable ? (
          <Button variant="outline" onClick={() => setIsEditing((current) => !current)}>
            {isEditing ? 'Duzenlemeyi Kapat' : 'Duzenle'}
          </Button>
        ) : null}
        <Button variant="outline" onClick={() => window.print()}>
          Yazdir / PDF
        </Button>
        <Button render={<Link href="/faturalar/yeni">Yeni Belge</Link>} />
      </PageHeader>

      <MetricGrid
        items={[
          { label: 'Musteri', value: currentInvoice.customer },
          {
            label: 'Durum',
            value: meta.label,
            badge: 'Fatura',
            badgeVariant: meta.variant,
          },
          { label: 'Vade Tarihi', value: formatDate(currentInvoice.dueDate) },
          { label: 'Toplam', value: formatCurrency(totals.total) },
        ]}
      />

      {isEditing ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <SectionCard
            title="Fatura Bilgileri"
            description="Taslak belgeyi guncelleyin"
            contentClassName="space-y-4"
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="edit-invoice-customer">Musteri</FieldLabel>
                <Input
                  id="edit-invoice-customer"
                  value={form.customer}
                  onChange={(event) => updateField('customer', event.target.value)}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  value={form.issueDate}
                  onChange={(event) => updateField('issueDate', event.target.value)}
                />
                <Input
                  value={form.dueDate}
                  onChange={(event) => updateField('dueDate', event.target.value)}
                />
              </div>
            </FieldGroup>
          </SectionCard>

          <SectionCard
            title="Kalemler"
            description="Urun ve fiyat satirlari"
            contentClassName="space-y-4"
          >
            {[
              ['line1Product', 'line1Quantity', 'line1UnitPrice', 'line1TaxRate'],
              ['line2Product', 'line2Quantity', 'line2UnitPrice', 'line2TaxRate'],
            ].map(([productKey, quantityKey, priceKey, taxKey]) => (
              <div key={productKey} className="space-y-3 rounded-lg border p-4">
                <Input
                  value={form[productKey as keyof typeof form]}
                  onChange={(event) =>
                    updateField(productKey as keyof typeof form, event.target.value)
                  }
                />
                <div className="grid gap-3 md:grid-cols-3">
                  <Input
                    value={form[quantityKey as keyof typeof form]}
                    onChange={(event) =>
                      updateField(quantityKey as keyof typeof form, event.target.value)
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
            title="Aciklama ve Ozet"
            description="Belge notu ve toplamlar"
            contentClassName="space-y-4"
          >
            <Textarea
              value={form.note}
              onChange={(event) => updateField('note', event.target.value)}
            />
            <div className="rounded-lg border p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ara Toplam</span>
                <span className="font-medium">{formatCurrency(editTotals.subtotal)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-muted-foreground">KDV</span>
                <span className="font-medium">{formatCurrency(editTotals.tax)}</span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <span className="font-medium">Genel Toplam</span>
                <span className="text-base font-semibold">{formatCurrency(editTotals.total)}</span>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => void handleSave()}>Taslagi Guncelle</Button>
            </div>
          </SectionCard>
        </div>
      ) : (
      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Belge Ozeti"
          description="Faturaya ait ust bilgiler"
          contentClassName="space-y-4"
        >
          <DetailList
            items={[
              { label: 'Fatura No', value: currentInvoice.id },
              { label: 'Musteri', value: currentInvoice.customer },
              { label: 'Duzenleme Tarihi', value: formatDate(currentInvoice.issueDate) },
              { label: 'Vade Tarihi', value: formatDate(currentInvoice.dueDate) },
              {
                label: 'Kaynak Teklif',
                value: currentInvoice.relatedQuotation ? (
                  <Link
                    href={`/teklifler/${currentInvoice.relatedQuotation}`}
                    className="hover:underline"
                  >
                    {currentInvoice.relatedQuotation}
                  </Link>
                ) : (
                  'Bagimsiz belge'
                ),
              },
            ]}
          />
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Aciklama</p>
            <p className="mt-2 text-sm">{currentInvoice.note || 'Aciklama girilmedi.'}</p>
          </div>
        </SectionCard>

        <SectionCard
          title="Kalemler"
          description="Fatura satirlari"
          contentClassName="space-y-3 xl:col-span-2"
        >
          {currentInvoice.lines.map((line) => (
            <div
              key={`${currentInvoice.id}-${line.product}`}
              className="rounded-lg border p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{line.product}</p>
                  <p className="text-xs text-muted-foreground">
                    {line.quantity} x {formatCurrency(line.unitPrice)} - %
                    {line.taxRate} KDV
                  </p>
                </div>
                <Badge variant="outline">
                  {formatCurrency(
                    line.quantity * line.unitPrice * (1 + line.taxRate / 100),
                  )}
                </Badge>
              </div>
            </div>
          ))}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border p-3 text-sm">
              <p className="text-muted-foreground">Ara Toplam</p>
              <p className="mt-1 font-medium">
                {formatCurrency(totals.subtotal)}
              </p>
            </div>
            <div className="rounded-lg border p-3 text-sm">
              <p className="text-muted-foreground">KDV</p>
              <p className="mt-1 font-medium">{formatCurrency(totals.tax)}</p>
            </div>
            <div className="rounded-lg border p-3 text-sm">
              <p className="text-muted-foreground">Genel Toplam</p>
              <p className="mt-1 font-medium">{formatCurrency(totals.total)}</p>
            </div>
          </div>
        </SectionCard>
      </div>
      )}
    </>
  )
}
