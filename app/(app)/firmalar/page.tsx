import { PageHeader } from '@/components/shared/page-header'
import { MetricGrid, SectionCard } from '@/components/shared/module-primitives'
import { companies } from '@/lib/data/crm'

export default function CompaniesPage() {
  return (
    <>
      <PageHeader
        title="Firmalar"
        description="Kurumsal kayitlar ve acik firsat ozetleri."
      />

      <MetricGrid
        items={[
          { label: 'Firma Sayisi', value: companies.length },
          { label: 'Acik Firsat', value: companies.reduce((sum, item) => sum + item.openDeals, 0) },
          { label: 'Toplam Kontak', value: companies.reduce((sum, item) => sum + item.contacts, 0) },
          { label: 'Sehir', value: new Set(companies.map((item) => item.city)).size },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {companies.map((company) => (
          <SectionCard
            key={company.id}
            title={company.name}
            description={`${company.sector} - ${company.city}`}
            contentClassName="grid gap-3 md:grid-cols-2"
          >
            <div className="rounded-lg border p-3 text-sm">
              <p className="text-muted-foreground">Kontak Sayisi</p>
              <p className="mt-1 font-medium">{company.contacts}</p>
            </div>
            <div className="rounded-lg border p-3 text-sm">
              <p className="text-muted-foreground">Acik Firsat</p>
              <p className="mt-1 font-medium">{company.openDeals}</p>
            </div>
          </SectionCard>
        ))}
      </div>
    </>
  )
}
