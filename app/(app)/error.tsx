'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
      <h2 className="text-lg font-semibold">Bir hata olustu</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>Tekrar Dene</Button>
    </div>
  )
}
