'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { useErpSearchResults } from '@/hooks/use-erp-store'
import { PageHeader } from '@/components/shared/page-header'
import { MetricGrid, SectionCard } from '@/components/shared/module-primitives'
import { Badge } from '@/components/ui/badge'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

const moduleOrder = [
  'urunler',
  'faturalar',
  'teklifler',
  'satin-alma',
  'cari',
  'crm',
  'finans',
] as const

export function SearchPageClient() {
  const searchParams = useSearchParams()
  const query = (searchParams.get('q') ?? '').trim()
  const results = useErpSearchResults(query)

  const groupedResults = moduleOrder
    .map((moduleKey) => ({
      moduleKey,
      items: results.filter((item) => item.moduleKey === moduleKey),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <>
      <PageHeader
        title="Arama"
        description={
          query
            ? `"${query}" icin tum modullerde bulunan sonuclar.`
            : 'Urun, belge, cari veya CRM kaydi arayin.'
        }
      />

      {query ? (
        <MetricGrid
          items={[
            { label: 'Toplam Sonuc', value: results.length },
            {
              label: 'Urunler',
              value: results.filter((item) => item.moduleKey === 'urunler')
                .length,
            },
            {
              label: 'Belgeler',
              value: results.filter((item) =>
                ['faturalar', 'teklifler', 'satin-alma'].includes(item.moduleKey),
              ).length,
            },
            {
              label: 'CRM & Finans',
              value: results.filter((item) =>
                ['cari', 'crm', 'finans'].includes(item.moduleKey),
              ).length,
            },
          ]}
        />
      ) : null}

      {!query ? (
        <SectionCard
          title="Aramaya Baslayin"
          description="Ust bardaki arama alanina urun, fatura, teklif, cari veya kisi bilgisi yazin."
        >
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>Global arama hazir</EmptyTitle>
              <EmptyDescription>
                Sonuclar urunler, faturalar, teklifler, cari hesaplar, CRM
                kayitlari ve finans hareketleri uzerinden listelenir.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </SectionCard>
      ) : null}

      {query && results.length === 0 ? (
        <SectionCard
          title="Sonuc Bulunamadi"
          description={`"${query}" icin eslesen kayit bulunamadi.`}
        >
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>Farkli bir kelime deneyin</EmptyTitle>
              <EmptyDescription>
                Kayit kodu, musteri unvani, urun adi ya da belge numarasi ile
                tekrar arama yapabilirsiniz.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </SectionCard>
      ) : null}

      {groupedResults.map((group) => (
        <SectionCard
          key={group.moduleKey}
          title={group.items[0].module}
          description={`${group.items.length} sonuc bulundu`}
          contentClassName="space-y-3"
        >
          {group.items.map((result) => (
            <Link
              key={`${result.moduleKey}-${result.id}`}
              href={result.href}
              className="flex items-start justify-between gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{result.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {result.subtitle}
                </p>
              </div>
              {result.badge ? (
                <Badge variant={result.badgeVariant}>{result.badge}</Badge>
              ) : null}
            </Link>
          ))}
        </SectionCard>
      ))}
    </>
  )
}
