'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  Bell,
  FileText,
  LogOut,
  Moon,
  Package,
  Plus,
  Receipt,
  Search,
  Settings,
  Sun,
  User,
  UserPlus,
} from 'lucide-react'
import { SearchInput } from '@/components/shared/search-input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

const notifications = [
  {
    title: 'Dusuk stok uyarisi',
    description: 'Bosch Akulu Vidalama kritik seviyenin altinda',
    time: '12 dk',
  },
  {
    title: 'Fatura odendi',
    description: 'FT-2024-0148 numarali fatura tahsil edildi',
    time: '1 saat',
  },
  {
    title: 'Yeni teklif onaylandi',
    description: 'Yildiz Insaat teklifi kabul edildi',
    time: '3 saat',
  },
] as const

const quickCreateItems = [
  { label: 'Yeni Urun', icon: Package, href: '/urunler/yeni' },
  { label: 'Yeni Teklif', icon: FileText, href: '/teklifler/yeni' },
  { label: 'Yeni Fatura', icon: Receipt, href: '/faturalar/yeni' },
  { label: 'Yeni Lead', icon: UserPlus, href: '/leads' },
] as const

const currentUser = {
  name: 'Mehmet Adakan',
  email: 'mehmet@adakan.com.tr',
  initials: 'MA',
}

export function Topbar() {
  const { resolvedTheme, setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  useEffect(() => {
    if (pathname === '/arama') {
      setSearchValue(searchParams.get('q') ?? '')
      return
    }

    setSearchValue('')
  }, [pathname, searchParams])

  function submitSearch() {
    const nextValue = searchValue.trim()

    if (!nextValue) {
      router.push('/arama')
      return
    }

    router.push(`/arama?q=${encodeURIComponent(nextValue)}`)
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') {
      return
    }

    event.preventDefault()
    submitSearch()
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
      <div className="flex h-16 shrink-0 items-center gap-2 px-4 md:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-1 h-6 max-md:hidden" />

        <div className="relative hidden w-full max-w-md md:block">
          <SearchInput
            value={searchValue}
            onChange={setSearchValue}
            onKeyDown={handleSearchKeyDown}
            placeholder="Urun, fatura, teklif veya cari ara..."
            inputClassName="h-9 rounded-lg"
          />
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg md:hidden"
            aria-label={mobileSearchOpen ? 'Aramayi kapat' : 'Aramayi ac'}
            onClick={() => setMobileSearchOpen((current) => !current)}
          >
            <Search />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg"
            aria-label="Temayi degistir"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="hidden dark:block" />
            <Moon className="block dark:hidden" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-lg"
                  aria-label="Bildirimler"
                >
                  <Bell />
                  <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-background" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex items-center justify-between">
                  Bildirimler
                  <Badge variant="info">3 yeni</Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.title}
                    className="flex flex-col items-start gap-0.5 py-2"
                  >
                    <span className="text-sm font-medium">
                      {notification.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {notification.description}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {notification.time} once
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button className="rounded-lg max-sm:size-9 max-sm:p-0">
                  <Plus data-icon="inline-start" />
                  <span className="max-sm:hidden">Hizli Olustur</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Yeni kayit</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {quickCreateItems.map((item) => (
                  <DropdownMenuItem
                    key={item.label}
                    onClick={() => router.push(item.href)}
                  >
                    <item.icon />
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="mx-1 h-6 max-sm:hidden" />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="h-9 gap-2 rounded-lg px-1.5 sm:pr-2.5"
                >
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-primary/12 text-xs font-semibold text-primary">
                      {currentUser.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium max-sm:hidden">
                    {currentUser.name}
                  </span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex flex-col">
                  <span>{currentUser.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {currentUser.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/ayarlar')}>
                  <User />
                  Profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/ayarlar')}>
                  <Settings />
                  Ayarlar
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <LogOut />
                Cikis Yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {mobileSearchOpen ? (
        <div className="border-t px-4 pb-4 pt-3 md:hidden">
          <SearchInput
            value={searchValue}
            onChange={setSearchValue}
            onKeyDown={handleSearchKeyDown}
            autoFocus
            placeholder="ERP icinde ara..."
            inputClassName="h-9 rounded-lg"
          />
        </div>
      ) : null}
    </header>
  )
}
