import Link from 'next/link'
import { SectionCard } from '@/components/shared/module-primitives'
import { Button } from '@/components/ui/button'

export default function AppNotFound() {
  return (
    <SectionCard
      title="Sayfa Bulunamadi"
      description="Istenen modul veya kayit bu demo calisma alaninda bulunamadi."
      contentClassName="space-y-4"
    >
      <p className="text-sm text-muted-foreground">
        Sol menuden aktif modullerden birine donebilir veya dashboard akisina gecebilirsiniz.
      </p>
      <div className="flex gap-2">
        <Button render={<Link href="/">Dashboard</Link>} />
        <Button variant="outline" render={<Link href="/urunler">Urunler</Link>} />
      </div>
    </SectionCard>
  )
}
