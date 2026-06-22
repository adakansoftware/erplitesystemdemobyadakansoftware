 'use client'

import { Suspense, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { CrmSidebar } from '@/components/layout/crm-sidebar'
import { Topbar } from '@/components/layout/topbar'
import { Skeleton } from '@/components/ui/skeleton'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isReady } = useAuth()
  useRealtime()

  useEffect(() => {
    if (isReady && !isAuthenticated && pathname !== '/login') {
      router.replace('/login')
    }
  }, [isAuthenticated, isReady, pathname, router])

  if (!isReady || !isAuthenticated) {
    return (
      <main className="flex min-h-screen flex-col gap-4 p-4 md:p-6">
        <Skeleton className="h-16 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </main>
    )
  }

  return (
    <SidebarProvider>
      <CrmSidebar />
      <SidebarInset>
        <Suspense fallback={null}>
          <Topbar />
        </Suspense>
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
