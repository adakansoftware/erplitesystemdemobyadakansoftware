import { Suspense } from 'react'
import { SearchPageClient } from '@/components/modules/search-page-client'

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageClient />
    </Suspense>
  )
}
