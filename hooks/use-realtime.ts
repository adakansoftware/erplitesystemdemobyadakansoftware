'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

type RealtimePayload = {
  event?: string
}

function resolveRealtimeUrl() {
  if (typeof window === 'undefined') {
    return null
  }

  const configured = process.env.NEXT_PUBLIC_WS_URL?.trim()
  if (configured) {
    return `${configured.replace(/\/$/, '')}/api/ws`
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/api/ws`
}

export function useRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const url = resolveRealtimeUrl()
    if (!url) {
      return
    }

    const ws = new WebSocket(url)

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data) as RealtimePayload

      if (payload.event === 'invoice.created' || payload.event === 'invoice.paid') {
        void queryClient.invalidateQueries({ queryKey: ['invoices'] })
        void queryClient.invalidateQueries({ queryKey: ['current-accounts'] })
      }

      if (payload.event === 'stock.low' || payload.event === 'purchase.received') {
        void queryClient.invalidateQueries({ queryKey: ['products'] })
      }
    }

    ws.onerror = () => {
      ws.close()
    }

    return () => {
      ws.close()
    }
  }, [queryClient])
}
