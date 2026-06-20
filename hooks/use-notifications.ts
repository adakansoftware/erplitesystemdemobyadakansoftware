'use client'

import { useMemo } from 'react'
import { useAppSettings } from '@/hooks/use-app-settings'
import { useErpCollections } from '@/hooks/use-erp-store'

export type AppNotification = {
  id: string
  title: string
  description: string
  href: string
  time: string
  variant: 'info' | 'warning' | 'destructive' | 'success'
}

export function useNotifications() {
  const { settings } = useAppSettings()
  const { invoices, products, tasks } = useErpCollections()

  return useMemo(() => {
    const nextNotifications: AppNotification[] = []

    if (settings.overdueInvoiceAlerts) {
      invoices
        .filter((invoice) => invoice.status === 'overdue')
        .slice(0, 4)
        .forEach((invoice) => {
          nextNotifications.push({
            id: `invoice-${invoice.id}`,
            title: 'Vadesi gecen fatura',
            description: `${invoice.id} - ${invoice.customer}`,
            href: `/faturalar/${invoice.id}`,
            time: invoice.dueDate,
            variant: 'destructive',
          })
        })
    }

    if (settings.lowStockAlerts) {
      products
        .filter((product) => product.stock <= product.reorderPoint)
        .slice(0, 4)
        .forEach((product) => {
          nextNotifications.push({
            id: `stock-${product.id}`,
            title: 'Kritik stok',
            description: `${product.name} - ${product.stock} ${product.unit}`,
            href: `/urunler/${product.id}`,
            time: product.createdAt,
            variant: 'warning',
          })
        })
    }

    tasks
      .filter((task) => !task.done)
      .slice(0, 4)
      .forEach((task) => {
        nextNotifications.push({
          id: `task-${task.id}`,
          title: 'Bugun vadesi olan gorev',
          description: `${task.title} - ${task.owner}`,
          href: `/gorevler#${task.id}`,
          time: task.due,
          variant: 'info',
        })
      })

    return nextNotifications.slice(0, 8)
  }, [invoices, products, settings.lowStockAlerts, settings.overdueInvoiceAlerts, tasks])
}
