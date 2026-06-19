import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/module-primitives'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Ayarlar"
        description="Sistem genel ayarlari ve operasyon tercihleri."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Sirket Bilgileri"
          description="Baslikta ve belgelerde kullanilan alanlar"
          contentClassName="space-y-4 xl:col-span-2"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="company-name">Firma Unvani</FieldLabel>
              <Input id="company-name" defaultValue="Adakan Yazilim San. ve Tic. Ltd. Sti." />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="company-tax-office">Vergi Dairesi</FieldLabel>
                <Input id="company-tax-office" defaultValue="Ikitelli" />
              </Field>
              <Field>
                <FieldLabel htmlFor="company-tax-number">Vergi No</FieldLabel>
                <Input id="company-tax-number" defaultValue="1234567890" />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="company-mail">E-posta</FieldLabel>
              <Input id="company-mail" defaultValue="info@adakan.com.tr" />
            </Field>
          </FieldGroup>
        </SectionCard>

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
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Vadesi gecen faturalar</p>
              <p className="text-xs text-muted-foreground">
                Gecikmis tahsilat bildirimi
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Gun sonu ozet maili</p>
              <p className="text-xs text-muted-foreground">
                Gunluk ozet ve yonetim bilgilendirmesi
              </p>
            </div>
            <Switch />
          </div>
        </SectionCard>
      </div>
    </>
  )
}
