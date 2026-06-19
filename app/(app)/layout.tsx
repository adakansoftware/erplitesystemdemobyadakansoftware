import { Suspense } from 'react'
import { CrmSidebar } from '@/components/layout/crm-sidebar'
import { Topbar } from '@/components/layout/topbar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
