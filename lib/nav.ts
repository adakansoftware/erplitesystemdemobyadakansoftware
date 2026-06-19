import {
  ArrowLeftRight,
  BarChart3,
  Building2,
  CheckSquare,
  FileText,
  Handshake,
  KanbanSquare,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  UserPlus,
  Users,
  Wallet,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  badge?: string
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: 'Genel',
    items: [{ title: 'Dashboard', href: '/', icon: LayoutDashboard }],
  },
  {
    label: 'CRM',
    items: [
      { title: 'Leads', href: '/leads', icon: UserPlus },
      { title: 'Musteriler', href: '/musteriler', icon: Users },
      { title: 'Firmalar', href: '/firmalar', icon: Building2 },
      { title: 'Anlasmalar', href: '/anlasmalar', icon: Handshake },
      { title: 'Pipeline', href: '/pipeline', icon: KanbanSquare },
      { title: 'Gorevler', href: '/gorevler', icon: CheckSquare },
    ],
  },
  {
    label: 'ERP',
    items: [
      { title: 'Urunler', href: '/urunler', icon: Package },
      { title: 'Stok', href: '/stok', icon: Warehouse },
      { title: 'Teklifler', href: '/teklifler', icon: FileText },
      { title: 'Faturalar', href: '/faturalar', icon: Receipt },
      { title: 'Kasa & Banka', href: '/kasa-banka', icon: Wallet },
      { title: 'Cari Hesaplar', href: '/cari-hesaplar', icon: ArrowLeftRight },
    ],
  },
  {
    label: 'Analiz',
    items: [
      { title: 'Raporlar', href: '/raporlar', icon: BarChart3 },
      { title: 'Ayarlar', href: '/ayarlar', icon: Settings },
    ],
  },
]
