import Link from 'next/link'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/module-primitives'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { products } from '@/lib/data/products'

export default function NewProductPage() {
  const sampleProduct = products[0]

  return (
    <>
      <PageHeader
        title="Yeni Urun"
        description="Sisteme yeni urun karti eklemek icin urun tanim formu."
      >
        <Button variant="outline" render={<Link href="/urunler">Vazgec</Link>} />
        <Button>Urunu Kaydet</Button>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Genel Bilgiler"
          description="Temel urun tanimi ve katalog alanlari"
          contentClassName="space-y-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="product-name">Urun Adi</FieldLabel>
              <Input id="product-name" defaultValue={sampleProduct.name} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="product-sku">Stok Kodu</FieldLabel>
                <Input id="product-sku" defaultValue="PRD-1013" />
              </Field>
              <Field>
                <FieldLabel htmlFor="product-barcode">Barkod</FieldLabel>
                <Input id="product-barcode" defaultValue="8690000010135" />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="product-category">Kategori</FieldLabel>
                <Input id="product-category" defaultValue={sampleProduct.category} />
              </Field>
              <Field>
                <FieldLabel htmlFor="product-brand">Marka</FieldLabel>
                <Input id="product-brand" defaultValue="Bosch" />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="product-description">Aciklama</FieldLabel>
              <Textarea
                id="product-description"
                defaultValue="Profesyonel segmentte konumlanan yeni seri icin urun karti."
              />
            </Field>
          </FieldGroup>
        </SectionCard>

        <SectionCard
          title="Fiyat & Stok"
          description="Satis ve maliyet alanlari"
          contentClassName="space-y-4"
        >
          <FieldGroup>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="cost-price">Maliyet</FieldLabel>
                <Input id="cost-price" defaultValue="2750" />
              </Field>
              <Field>
                <FieldLabel htmlFor="sale-price">Satis Fiyati</FieldLabel>
                <Input id="sale-price" defaultValue="3490" />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="tax-rate">KDV Orani</FieldLabel>
                <Input id="tax-rate" defaultValue="20" />
              </Field>
              <Field>
                <FieldLabel htmlFor="unit">Birim</FieldLabel>
                <Input id="unit" defaultValue="Adet" />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="stock">Acilis Stogu</FieldLabel>
                <Input id="stock" defaultValue="18" />
              </Field>
              <Field>
                <FieldLabel htmlFor="reorder-point">Minimum Stok</FieldLabel>
                <Input id="reorder-point" defaultValue="8" />
              </Field>
            </div>
          </FieldGroup>
        </SectionCard>

        <SectionCard
          title="Yayin Onizlemesi"
          description="Kart olustugunda gorunecek ozet"
          contentClassName="space-y-4"
        >
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">Bosch GSB 18V-55 Darbeli Matkap</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Elektrikli Aletler - Bosch
            </p>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Liste Fiyati</span>
                <span className="font-medium">TRY 3.490</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Depo Stogu</span>
                <span className="font-medium">18 Adet</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Durum</span>
                <span className="font-medium">Aktif</span>
              </div>
            </div>
          </div>
          <Field>
            <FieldLabel htmlFor="sales-note">Satis Notu</FieldLabel>
            <FieldContent>
              <Textarea
                id="sales-note"
                defaultValue="Satis ekibinin fiyatlandirma ve konumlandirma notlari bu alanda tutulur."
              />
              <FieldDescription>
                Urun kartinda fiyat, stok ve aciklama bilgileri tek yerde toplanir.
              </FieldDescription>
            </FieldContent>
          </Field>
        </SectionCard>
      </div>
    </>
  )
}
