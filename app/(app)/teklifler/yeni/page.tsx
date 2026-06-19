import Link from 'next/link'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/module-primitives'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function NewQuotationPage() {
  return (
    <>
      <PageHeader
        title="Yeni Teklif"
        description="Musteri teklifi icin kullanilan teklif olusturma ekrani."
      >
        <Button variant="outline" render={<Link href="/teklifler">Vazgec</Link>} />
        <Button>Teklifi Kaydet</Button>
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
              <Input id="quotation-customer" defaultValue="Yildiz Insaat Ltd. Sti." />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="quotation-date">Teklif Tarihi</FieldLabel>
                <Input id="quotation-date" defaultValue="2024-04-19" />
              </Field>
              <Field>
                <FieldLabel htmlFor="quotation-valid">Gecerlilik</FieldLabel>
                <Input id="quotation-valid" defaultValue="2024-05-03" />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="quotation-owner">Sorumlu</FieldLabel>
              <Input id="quotation-owner" defaultValue="Selin Kaya" />
            </Field>
          </FieldGroup>
        </SectionCard>

        <SectionCard
          title="Kalemler"
          description="Teklife eklenecek urun ve hizmet satirlari"
          contentClassName="space-y-4"
        >
          <div className="space-y-3 rounded-lg border p-4">
            <Input defaultValue="Bosch GSR 12V-15 Akulu Vidalama" />
            <div className="grid gap-3 md:grid-cols-3">
              <Input defaultValue="6" />
              <Input defaultValue="3290" />
              <Input defaultValue="20" />
            </div>
          </div>
          <div className="space-y-3 rounded-lg border p-4">
            <Input defaultValue="Is Guvenligi Baret Beyaz" />
            <div className="grid gap-3 md:grid-cols-3">
              <Input defaultValue="20" />
              <Input defaultValue="135" />
              <Input defaultValue="20" />
            </div>
          </div>
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
              defaultValue="Santiye teslimat dahildir. Odeme 30 gun vadeli olacak sekilde planlandi."
            />
          </Field>
          <div className="rounded-lg border p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ara Toplam</span>
              <span className="font-medium">TRY 22.440</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground">KDV</span>
              <span className="font-medium">TRY 4.488</span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <span className="font-medium">Genel Toplam</span>
              <span className="text-base font-semibold">TRY 26.928</span>
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  )
}
