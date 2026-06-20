import { useEffect, useState } from 'react'
import { api } from '@/lib/api/client'

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

const STORAGE_KEY = 'erp-lite-app-settings-ui'

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
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      let uiSettings: Partial<AppSettings> = {}

      if (typeof window !== 'undefined') {
        try {
          const rawValue = window.localStorage.getItem(STORAGE_KEY)
          if (rawValue) {
            uiSettings = JSON.parse(rawValue) as Partial<AppSettings>
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
  }, [])

  const updateSettings = async (nextSettings: AppSettings) => {
    setSettings(nextSettings)

    const uiSettings = {
      lowStockAlerts: nextSettings.lowStockAlerts,
      overdueInvoiceAlerts: nextSettings.overdueInvoiceAlerts,
      dailySummaryEmail: nextSettings.dailySummaryEmail,
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(uiSettings))
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
    isReady,
    updateSettings,
  }
}
