import Link from 'next/link'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/module-primitives'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function NewInvoicePage() {
  return (
    <>
      <PageHeader
        title="Yeni Fatura"
        description="Musteri faturalari icin belge olusturma arayuzu."
      >
        <Button variant="outline" render={<Link href="/faturalar">Vazgec</Link>} />
        <Button>Faturayi Kaydet</Button>
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
              <Input id="invoice-customer" defaultValue="Kaya Muhendislik A.S." />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="invoice-date">Fatura Tarihi</FieldLabel>
                <Input id="invoice-date" defaultValue="2024-04-19" />
              </Field>
              <Field>
                <FieldLabel htmlFor="invoice-due">Vade Tarihi</FieldLabel>
                <Input id="invoice-due" defaultValue="2024-05-19" />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="invoice-series">Belge Serisi</FieldLabel>
              <Input id="invoice-series" defaultValue="FT-2024-0149" />
            </Field>
          </FieldGroup>
        </SectionCard>

        <SectionCard
          title="Fatura Kalemleri"
          description="Belgeye eklenecek urun ve hizmet satirlari"
          contentClassName="space-y-4"
        >
          <div className="space-y-3 rounded-lg border p-4">
            <Input defaultValue="DeWalt DCD709 Akulu Darbeli Matkap" />
            <div className="grid gap-3 md:grid-cols-3">
              <Input defaultValue="4" />
              <Input defaultValue="5190" />
              <Input defaultValue="20" />
            </div>
          </div>
          <div className="space-y-3 rounded-lg border p-4">
            <Input defaultValue="DeWalt Elmas Testere Disk 230mm" />
            <div className="grid gap-3 md:grid-cols-3">
              <Input defaultValue="15" />
              <Input defaultValue="459" />
              <Input defaultValue="20" />
            </div>
          </div>
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
              defaultValue="30 gun vade uygulanir. Kismi tahsilat icin banka havalesi tercih edilir."
            />
          </Field>
          <div className="rounded-lg border p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ara Toplam</span>
              <span className="font-medium">TRY 27.645</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground">KDV</span>
              <span className="font-medium">TRY 5.529</span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <span className="font-medium">Genel Toplam</span>
              <span className="text-base font-semibold">TRY 33.174</span>
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  )
}
