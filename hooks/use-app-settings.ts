import { useEffect, useState } from 'react'

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

const STORAGE_KEY = 'erp-lite-app-settings'

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
    if (typeof window === 'undefined') {
      return
    }

    try {
      const rawValue = window.localStorage.getItem(STORAGE_KEY)
      if (rawValue) {
        const parsed = JSON.parse(rawValue) as Partial<AppSettings>
        setSettings({ ...defaultSettings, ...parsed })
      }
    } catch {
      setSettings(defaultSettings)
    } finally {
      setIsReady(true)
    }
  }, [])

  const updateSettings = (nextSettings: AppSettings) => {
    setSettings(nextSettings)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings))
    }
  }

  return {
    settings,
    isReady,
    updateSettings,
  }
}
