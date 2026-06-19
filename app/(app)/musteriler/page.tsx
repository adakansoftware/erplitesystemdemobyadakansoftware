import { PageHeader } from '@/components/shared/page-header'
import { MetricGrid, SectionCard } from '@/components/shared/module-primitives'
import {
  customers,
  balanceMeta,
} from '@/lib/data/accounts'
import { contacts } from '@/lib/data/crm'
import { Badge } from '@/components/ui/badge'

export default function CustomersPage() {
  return (
    <>
      <PageHeader
        title="Musteriler"
        description="CRM ve cari akisinin ortak musteri gorunumu."
      />

      <MetricGrid
        items={[
          { label: 'Musteri Sayisi', value: customers.length },
          { label: 'Aktif Iletisim', value: contacts.length, badge: 'Rehber', badgeVariant: 'info' },
          { label: 'Alacakli Hesap', value: customers.filter((item) => item.balance > 0).length, badge: 'Finans', badgeVariant: 'success' },
          { label: 'Borc Bakiyesi', value: '5.900 TRY', badge: 'Istisna', badgeVariant: 'warning' },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {customers.map((customer) => {
          const meta = balanceMeta(customer.balance)
          const relatedContacts = contacts.filter((contact) => contact.company === customer.name)
          return (
            <SectionCard
              key={customer.id}
              title={customer.name}
              description={`${customer.city} - ${customer.phone}`}
              contentClassName="space-y-3"
            >
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm text-muted-foreground">Bakiye</span>
                <Badge variant={meta.variant}>{meta.label}</Badge>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium">Ana Iletisimler</p>
                <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {relatedContacts.length ? (
                    relatedContacts.map((contact) => (
                      <p key={contact.id}>
                        {contact.name} - {contact.title}
                      </p>
                    ))
                  ) : (
                    <p>Kayitli iletisim bulunmuyor.</p>
                  )}
                </div>
              </div>
            </SectionCard>
          )
        })}
      </div>
    </>
  )
}
