'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/module-primitives'
import { Button } from '@/components/ui/button'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'

export default function LoginPage() {
  const router = useRouter()
  const { currentUser, isReady, login } = useAuth()
  const [email, setEmail] = useState('admin@demo.com')
  const [password, setPassword] = useState('demo123')

  useEffect(() => {
    if (isReady && currentUser) {
      router.replace('/')
    }
  }, [currentUser, isReady, router])

  function handleLogin() {
    const result = login(email, password)

    if (!result.ok) {
      toast.error(result.message)
      return
    }

    toast.success('Oturum acildi')
    router.replace('/')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-5xl">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <SectionCard
            title="Adakan ERP Lite"
            description="CRM, stok, satis ve finans operasyonlarini tek panelde yonetin."
            contentClassName="space-y-4"
          >
            <PageHeader
              title="Demo Girisi"
              description="Bu surum front-end ve localStorage tabanli urun demosu olarak calisir."
            />
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">Satis</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Leads, teklifler, cari ve gorev akislarini yonetin.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">ERP</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Urun, stok, satin alma, fatura ve kasa modulleri ayni stilde.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">Demo Session</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Giris ve tum CRUD akislari tarayici icinde saklanir.
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Giris Yap"
            description="Demo kullanici hesaplarindan biriyle devam edin."
            contentClassName="space-y-4"
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="login-email">E-posta</FieldLabel>
                <Input
                  id="login-email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="login-password">Sifre</FieldLabel>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Field>
            </FieldGroup>
            <Button onClick={handleLogin}>Oturum Ac</Button>
            <Field>
              <FieldLabel>Demo Hesaplar</FieldLabel>
              <FieldContent>
                <div className="space-y-2 rounded-lg border p-3 text-sm">
                  <p>`admin@demo.com / demo123`</p>
                  <p>`satis@demo.com / demo123`</p>
                </div>
                <FieldDescription>
                  Giris sonrasinda uygulama paneline dogrudan yonlendirilirsiniz.
                </FieldDescription>
              </FieldContent>
            </Field>
          </SectionCard>
        </div>
      </div>
    </main>
  )
}
