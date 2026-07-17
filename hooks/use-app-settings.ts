import { useEffect, useState } from 'react'
import { api } from '@/lib/api/client'
import { useAuth } from '@/hooks/use-auth'

export type AppSettings = {
  companyName: string
  companyAddress: string
  taxOffice: string
  taxNumber: string
  phone: string
  email: string
  website: string
  logoUrl: string
  lowStockAlerts: boolean
  overdueInvoiceAlerts: boolean
  dailySummaryEmail: boolean
}

const LEGACY_STORAGE_KEY = 'erp-lite-app-settings-ui'

const defaultSettings: AppSettings = {
  companyName: 'Adakan Endustriyel Cozumler Ltd. Sti.',
  companyAddress: 'Ikitelli OSB Mah. Demirciler Cad. No:18 Basaksehir / Istanbul',
  taxOffice: 'Ikitelli',
  taxNumber: '1234567890',
  phone: '0212 555 00 55',
  email: 'info@adakan.com.tr',
  website: 'www.adakan.com.tr',
  logoUrl: 'https://dummyimage.com/160x48/e9eef8/1f3b63&text=Adakan+ERP',
  lowStockAlerts: true,
  overdueInvoiceAlerts: true,
  dailySummaryEmail: false,
}

export function useAppSettings() {
  const { currentUser, isReady: authReady } = useAuth()
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [isReady, setIsReady] = useState(false)
  const storageKey = currentUser?.tenantId
    ? `${LEGACY_STORAGE_KEY}:${currentUser.tenantId}`
    : `${LEGACY_STORAGE_KEY}:guest`

  useEffect(() => {
    let cancelled = false

    async function load() {
      let uiSettings: Partial<AppSettings> = {}

      if (typeof window !== 'undefined') {
        try {
          const rawValue = window.localStorage.getItem(storageKey)
          if (rawValue) {
            uiSettings = JSON.parse(rawValue) as Partial<AppSettings>
          } else {
            const legacyValue = window.localStorage.getItem(LEGACY_STORAGE_KEY)
            if (legacyValue) {
              uiSettings = JSON.parse(legacyValue) as Partial<AppSettings>
              window.localStorage.setItem(storageKey, legacyValue)
            }
          }
        } catch {
          uiSettings = {}
        }
      }

      try {
        const remote = await api.get<any>('/settings')
        if (cancelled) {
          return
        }

        setSettings({
          ...defaultSettings,
          ...uiSettings,
          companyName: remote?.name ?? defaultSettings.companyName,
          companyAddress: remote?.address ?? defaultSettings.companyAddress,
          taxOffice: remote?.taxOffice ?? defaultSettings.taxOffice,
          taxNumber: remote?.taxNumber ?? defaultSettings.taxNumber,
          phone: remote?.phone ?? defaultSettings.phone,
          email: remote?.email ?? defaultSettings.email,
          website: remote?.website ?? defaultSettings.website,
          logoUrl: remote?.logoUrl ?? defaultSettings.logoUrl,
        })
      } catch {
        if (!cancelled) {
          setSettings({ ...defaultSettings, ...uiSettings })
        }
      } finally {
        if (!cancelled) {
          setIsReady(true)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [storageKey, authReady])

  const updateSettings = async (nextSettings: AppSettings) => {
    setSettings(nextSettings)

    const uiSettings = {
      lowStockAlerts: nextSettings.lowStockAlerts,
      overdueInvoiceAlerts: nextSettings.overdueInvoiceAlerts,
      dailySummaryEmail: nextSettings.dailySummaryEmail,
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, JSON.stringify(uiSettings))
    }

    await api.put('/settings', {
      name: nextSettings.companyName,
      address: nextSettings.companyAddress,
      taxOffice: nextSettings.taxOffice,
      taxNumber: nextSettings.taxNumber,
      phone: nextSettings.phone,
      email: nextSettings.email,
      website: nextSettings.website,
      logoUrl: nextSettings.logoUrl,
      currency: 'TRY',
    })
  }

  return {
    settings,
    isReady: isReady && authReady,
    updateSettings,
  }
}
