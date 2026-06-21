'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2 } from 'lucide-react'
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
import {
  lineTotal,
  quotationStatusMeta,
  quotationTotals,
} from '@/lib/data/quotations'
import { formatCurrency, formatDate, formatNumber } from '@/lib/ui-meta'

export function QuotationsPageClient() {
  const { quotations } = useErpCollections()
  const acceptedCount = quotations.filter((item) => item.status === 'accepted').length
  const pipelineTotal = quotations.reduce(
    (sum, item) => sum + quotationTotals(item.lines).total,
    0,
  )

  return (
    <>
      <PageHeader
        title="Teklifler"
        description="Musterilere giden tekliflerin durumu ve toplam tutarlari."
      >
        <Button render={<Link href="/teklifler/yeni">Yeni Teklif</Link>}>
          <Plus data-icon="inline-start" />
        </Button>
      </PageHeader>

      <MetricGrid
        items={[
          { label: 'Toplam Teklif', value: formatNumber(quotations.length) },
          {
            label: 'Kabul Edilen',
            value: formatNumber(acceptedCount),
            badge: 'Kazanilan',
            badgeVariant: 'success',
          },
          {
            label: 'Bekleyen',
            value: formatNumber(
              quotations.filter((item) => ['sent', 'draft'].includes(item.status))
                .length,
            ),
            badge: 'Aksiyon',
            badgeVariant: 'warning',
          },
          { label: 'Teklif Hacmi', value: formatCurrency(pipelineTotal) },
        ]}
      />

      <SectionCard
        title="Teklif Listesi"
        description="Musterilere giden tekliflerin durum ve toplam tutar takibi"
        contentClassName="px-0"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Teklif</TableHead>
              <TableHead>Musteri</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Gecerlilik</TableHead>
              <TableHead className="text-right">Toplam</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="pr-6 text-right">Detay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotations.map((quotation) => {
              const meta = quotationStatusMeta[quotation.status]
              const totals = quotationTotals(quotation.lines)

              return (
                <TableRow key={quotation.id}>
                  <TableCell className="pl-6 font-medium">
                    {quotation.id}
                  </TableCell>
                  <TableCell>{quotation.customer}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(quotation.date)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(quotation.validUntil)}
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
                      render={<Link href={`/teklifler/${quotation.id}`}>Incele</Link>}
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

export function NewQuotationPageClient() {
  const router = useRouter()
  const { createQuotation } = useErpCollections()
  const [form, setForm] = useState({
    customer: 'Yildiz Insaat Ltd. Sti.',
    date: '2024-04-19',
    validUntil: '2024-05-03',
    owner: 'Selin Kaya',
    note:
      'Santiye teslimat dahildir. Odeme 30 gun vadeli olacak sekilde planlandi.',
  })
  const [lines, setLines] = useState([
    {
      product: 'Bosch GSR 12V-15 Akulu Vidalama',
      quantity: '6',
      unitPrice: '3290',
      taxRate: '20',
    },
    {
      product: 'Is Guvenligi Baret Beyaz',
      quantity: '20',
      unitPrice: '135',
      taxRate: '20',
    },
  ])

  const totals = useMemo(() => {
    return quotationTotals(
      lines
        .filter((line) => line.product.trim())
        .map((line) => ({
          product: line.product,
          quantity: Number(line.quantity || 0),
          unitPrice: Number(line.unitPrice || 0),
          taxRate: Number(line.taxRate || 0),
        })),
    )
  }, [lines])

  function updateField<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function updateLine(
    index: number,
    key: keyof (typeof lines)[number],
    value: string,
  ) {
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [key]: value } : line,
      ),
    )
  }

  function addLine() {
    setLines((current) => [
      ...current,
      { product: '', quantity: '1', unitPrice: '0', taxRate: '20' },
    ])
  }

  function removeLine(index: number) {
    setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))
  }

  async function handleSave() {
    const payloadLines = lines
      .filter((line) => line.product.trim())
      .map((line) => ({
        product: line.product,
        quantity: Number(line.quantity || 0),
        unitPrice: Number(line.unitPrice || 0),
        taxRate: Number(line.taxRate || 0),
      }))

    if (!payloadLines.length) {
      toast.error('En az bir teklif kalemi girin')
      return
    }

    const nextQuotation = await createQuotation({
      customer: form.customer,
      date: form.date,
      validUntil: form.validUntil,
      note: `${form.note}\nSorumlu: ${form.owner}`.trim(),
      status: 'draft',
      lines: payloadLines,
    })

    if (!nextQuotation) {
      toast.error('Teklif olusturulamadi')
      return
    }

    toast.success('Teklif olusturuldu')
    router.push(`/teklifler/${nextQuotation.id}`)
  }

  return (
    <>
      <PageHeader
        title="Yeni Teklif"
        description="Musteri teklifi icin kullanilan teklif olusturma ekrani."
      >
        <Button variant="outline" render={<Link href="/teklifler">Vazgec</Link>} />
        <Button onClick={() => void handleSave()}>Teklifi Kaydet</Button>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Teklif Bilgileri"
          description="Baslik ve musteri alanlari"
          contentClassName="space-y-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="quotation-customer">Musteri</FieldLabel>
              <Input
                id="quotation-customer"
                value={form.customer}
                onChange={(event) => updateField('customer', event.target.value)}
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="quotation-date">Teklif Tarihi</FieldLabel>
                <Input
                  id="quotation-date"
                  value={form.date}
                  onChange={(event) => updateField('date', event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="quotation-valid">Gecerlilik</FieldLabel>
                <Input
                  id="quotation-valid"
                  value={form.validUntil}
                  onChange={(event) =>
                    updateField('validUntil', event.target.value)
                  }
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="quotation-owner">Sorumlu</FieldLabel>
              <Input
                id="quotation-owner"
                value={form.owner}
                onChange={(event) => updateField('owner', event.target.value)}
              />
            </Field>
          </FieldGroup>
        </SectionCard>

        <SectionCard
          title="Kalemler"
          description="Teklife eklenecek urun ve hizmet satirlari"
          contentClassName="space-y-4"
        >
          {lines.map((line, index) => (
            <div key={`quotation-line-${index}`} className="space-y-3 rounded-lg border p-4">
              <Input
                value={line.product}
                onChange={(event) =>
                  updateLine(index, 'product', event.target.value)
                }
              />
              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  value={line.quantity}
                  onChange={(event) =>
                    updateLine(index, 'quantity', event.target.value)
                  }
                />
                <Input
                  value={line.unitPrice}
                  onChange={(event) =>
                    updateLine(index, 'unitPrice', event.target.value)
                  }
                />
                <Input
                  value={line.taxRate}
                  onChange={(event) =>
                    updateLine(index, 'taxRate', event.target.value)
                  }
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLine(index)}
                  disabled={lines.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addLine}>
            <Plus data-icon="inline-start" />
            Satir Ekle
          </Button>
        </SectionCard>

        <SectionCard
          title="Notlar"
          description="Teslimat ve odeme notlari"
          contentClassName="space-y-4"
        >
          <Field>
            <FieldLabel htmlFor="quotation-note">Teklif Notu</FieldLabel>
            <Textarea
              id="quotation-note"
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

export function QuotationDetailPageClient() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { settings } = useAppSettings()
  const {
    convertQuotationToInvoice,
    getQuotationById,
    hydrated,
    updateQuotation,
    updateQuotationStatus,
  } = useErpCollections()
  const quotation = getQuotationById(params.id)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    customer: '',
    date: '',
    validUntil: '',
    note: '',
  })
  const [lines, setLines] = useState<
    Array<{ product: string; quantity: string; unitPrice: string; taxRate: string }>
  >([{ product: '', quantity: '1', unitPrice: '0', taxRate: '20' }])

  useEffect(() => {
    if (!quotation) {
      return
    }

    setForm({
      customer: quotation.customer,
      date: quotation.date,
      validUntil: quotation.validUntil,
      note: quotation.note,
    })
    setLines(
      quotation.lines.length
        ? quotation.lines.map((line) => ({
            product: line.product,
            quantity: String(line.quantity),
            unitPrice: String(line.unitPrice),
            taxRate: String(line.taxRate),
          }))
        : [{ product: '', quantity: '1', unitPrice: '0', taxRate: '20' }],
    )
  }, [quotation])

  if (hydrated && !quotation) {
    return (
      <SectionCard
        title="Teklif Bulunamadi"
        description="Istenen teklif mevcut kayitlarda yer almiyor."
      >
        <Button render={<Link href="/teklifler">Teklif listesine don</Link>} />
      </SectionCard>
    )
  }

  if (!quotation) {
    return null
  }

  const currentQuotation = quotation
  const meta = quotationStatusMeta[currentQuotation.status]
  const totals = quotationTotals(currentQuotation.lines)
  const draftEditable = currentQuotation.status === 'draft'
  const editTotals = quotationTotals(
    lines
      .filter((line) => line.product.trim())
      .map((line) => ({
        product: line.product,
        quantity: Number(line.quantity || 0),
        unitPrice: Number(line.unitPrice || 0),
        taxRate: Number(line.taxRate || 0),
      })),
  )

  async function handleConvert() {
    const nextInvoice = await convertQuotationToInvoice(currentQuotation.id)

    if (!nextInvoice) {
      toast.error('Teklif faturaya donusturulemedi')
      return
    }

    toast.success('Teklif faturaya donusturuldu')
    router.push(`/faturalar/${nextInvoice.id}`)
  }

  async function handleStatusChange(status: typeof currentQuotation.status) {
    const updated = await updateQuotationStatus(currentQuotation.id, status)

    if (!updated) {
      toast.error('Teklif durumu guncellenemedi')
      return
    }

    toast.success('Teklif durumu guncellendi')
  }

  function updateField<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function updateLine(
    index: number,
    key: keyof (typeof lines)[number],
    value: string,
  ) {
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [key]: value } : line,
      ),
    )
  }

  function addLine() {
    setLines((current) => [
      ...current,
      { product: '', quantity: '1', unitPrice: '0', taxRate: '20' },
    ])
  }

  function removeLine(index: number) {
    setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))
  }

  async function handleSave() {
    const payloadLines = lines
      .filter((line) => line.product.trim())
      .map((line) => ({
        product: line.product,
        quantity: Number(line.quantity || 0),
        unitPrice: Number(line.unitPrice || 0),
        taxRate: Number(line.taxRate || 0),
      }))

    if (!payloadLines.length) {
      toast.error('En az bir teklif kalemi girin')
      return
    }

    const updated = await updateQuotation(currentQuotation.id, {
      customer: form.customer,
      date: form.date,
      validUntil: form.validUntil,
      note: form.note,
      status: 'draft',
      lines: payloadLines,
    })

    if (!updated) {
      toast.error('Teklif guncellenemedi')
      return
    }

    toast.success('Teklif guncellendi')
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
            <p className="text-lg font-semibold">{currentQuotation.id}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Musteri: {currentQuotation.customer}
            </p>
          </div>
        </div>
      </div>
      <PageHeader
        title={currentQuotation.id}
        description={`${currentQuotation.customer} icin hazirlanan teklifin detay gorunumu.`}
      >
        <Button variant="outline" render={<Link href="/teklifler">Listeye Don</Link>} />
        {draftEditable ? (
          <Button variant="outline" onClick={() => setIsEditing((current) => !current)}>
            <Pencil data-icon="inline-start" />
            {isEditing ? 'Duzenlemeyi Kapat' : 'Duzenle'}
          </Button>
        ) : null}
        {currentQuotation.status === 'draft' ? (
          <Button
            variant="outline"
            onClick={() => void handleStatusChange('sent')}
          >
            Musteriye Gonder
          </Button>
        ) : null}
        {currentQuotation.status === 'sent' ? (
          <Button
            variant="outline"
            onClick={() => void handleStatusChange('accepted')}
          >
            Kabul Edildi
          </Button>
        ) : null}
        {currentQuotation.status === 'sent' ? (
          <Button
            variant="outline"
            onClick={() => void handleStatusChange('rejected')}
          >
            Reddedildi
          </Button>
        ) : null}
        {(currentQuotation.status === 'draft' || currentQuotation.status === 'sent') ? (
          <Button
            variant="outline"
            onClick={() => void handleStatusChange('expired')}
          >
            Suresi Doldu
          </Button>
        ) : null}
        <Button variant="outline" onClick={() => window.print()}>
          Yazdir / PDF
        </Button>
        {!currentQuotation.relatedInvoice ? (
          <Button onClick={() => void handleConvert()}>Faturaya Cevir</Button>
        ) : null}
        <Button render={<Link href="/teklifler/yeni">Yeni Teklif</Link>} />
      </PageHeader>

      <MetricGrid
        items={[
          { label: 'Musteri', value: currentQuotation.customer },
          {
            label: 'Durum',
            value: meta.label,
            badge: 'Teklif',
            badgeVariant: meta.variant,
          },
          { label: 'Gecerlilik', value: formatDate(currentQuotation.validUntil) },
          { label: 'Toplam', value: formatCurrency(totals.total) },
        ]}
      />

      {isEditing ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <SectionCard
            title="Teklif Bilgileri"
            description="Taslak belgeyi guncelleyin"
            contentClassName="space-y-4"
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="edit-quotation-customer">Musteri</FieldLabel>
                <Input
                  id="edit-quotation-customer"
                  value={form.customer}
                  onChange={(event) => updateField('customer', event.target.value)}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  value={form.date}
                  onChange={(event) => updateField('date', event.target.value)}
                />
                <Input
                  value={form.validUntil}
                  onChange={(event) => updateField('validUntil', event.target.value)}
                />
              </div>
              <Field>
                <FieldLabel htmlFor="edit-quotation-note">Not</FieldLabel>
                <Textarea
                  id="edit-quotation-note"
                  value={form.note}
                  onChange={(event) => updateField('note', event.target.value)}
                />
              </Field>
            </FieldGroup>
          </SectionCard>

          <SectionCard
            title="Kalemler"
            description="Teklif satirlarini guncelleyin"
            contentClassName="space-y-4 xl:col-span-2"
          >
            {lines.map((line, index) => (
              <div key={`edit-quotation-line-${index}`} className="space-y-3 rounded-lg border p-4">
                <Input
                  value={line.product}
                  onChange={(event) => updateLine(index, 'product', event.target.value)}
                />
                <div className="grid gap-3 md:grid-cols-3">
                  <Input
                    value={line.quantity}
                    onChange={(event) => updateLine(index, 'quantity', event.target.value)}
                  />
                  <Input
                    value={line.unitPrice}
                    onChange={(event) => updateLine(index, 'unitPrice', event.target.value)}
                  />
                  <Input
                    value={line.taxRate}
                    onChange={(event) => updateLine(index, 'taxRate', event.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLine(index)}
                    disabled={lines.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={addLine}>
                <Plus data-icon="inline-start" />
                Satir Ekle
              </Button>
              <Button onClick={() => void handleSave()}>Degisiklikleri Kaydet</Button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border p-3 text-sm">
                <p className="text-muted-foreground">Ara Toplam</p>
                <p className="mt-1 font-medium">
                  {formatCurrency(editTotals.subtotal)}
                </p>
              </div>
              <div className="rounded-lg border p-3 text-sm">
                <p className="text-muted-foreground">KDV</p>
                <p className="mt-1 font-medium">{formatCurrency(editTotals.tax)}</p>
              </div>
              <div className="rounded-lg border p-3 text-sm">
                <p className="text-muted-foreground">Genel Toplam</p>
                <p className="mt-1 font-medium">{formatCurrency(editTotals.total)}</p>
              </div>
            </div>
          </SectionCard>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          <SectionCard
            title="Teklif Ozet"
            description="Ust bilgi alanlari"
            contentClassName="space-y-4"
          >
            <DetailList
              items={[
                { label: 'Teklif No', value: currentQuotation.id },
                { label: 'Musteri', value: currentQuotation.customer },
                { label: 'Teklif Tarihi', value: formatDate(currentQuotation.date) },
                { label: 'Gecerlilik', value: formatDate(currentQuotation.validUntil) },
                {
                  label: 'Bagli Fatura',
                  value: currentQuotation.relatedInvoice ? (
                    <Link
                      href={`/faturalar/${currentQuotation.relatedInvoice}`}
                      className="hover:underline"
                    >
                      {currentQuotation.relatedInvoice}
                    </Link>
                  ) : (
                    'Henuz olusturulmadi'
                  ),
                },
              ]}
            />
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Not</p>
              <p className="mt-2 whitespace-pre-line text-sm">
                {currentQuotation.note || 'Not girilmedi.'}
              </p>
            </div>
          </SectionCard>

          <SectionCard
            title="Kalemler"
            description="Teklif satirlari"
            contentClassName="space-y-3 xl:col-span-2"
          >
            {currentQuotation.lines.map((line) => (
              <div
                key={`${currentQuotation.id}-${line.product}`}
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
                  <Badge variant="outline">{formatCurrency(lineTotal(line))}</Badge>
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
