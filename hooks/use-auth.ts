'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api/client'

export type DemoUser = {
  id: string
  name: string
  email: string
  role: 'admin' | 'sales'
  initials: string
}

function toInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function mapUser(payload: any): DemoUser {
  return {
    id: payload.id ?? '',
    name: payload.name ?? 'Demo Kullanici',
    email: payload.email ?? 'admin@demo.com',
    role: payload.role === 'sales' ? 'sales' : 'admin',
    initials: toInitials(payload.name ?? 'Demo Kullanici'),
  }
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    void api
      .get<any>('/auth/me')
      .then((user) => {
        if (!cancelled) {
          setCurrentUser(mapUser(user))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCurrentUser(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsReady(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return useMemo(
    () => ({
      currentUser,
      isReady,
      isAuthenticated: Boolean(currentUser),
      login: async (email: string, password: string) => {
        try {
          const result = await api.post<any>('/auth/login', { email, password })
          const user = mapUser(result.user)
          setCurrentUser(user)
          return { ok: true as const, user }
        } catch (error) {
          return {
            ok: false as const,
            message:
              error instanceof Error ? error.message : 'E-posta veya sifre hatali.',
          }
        }
      },
      logout: async () => {
        try {
          await api.post('/auth/logout', {})
        } finally {
          setCurrentUser(null)
        }
      },
    }),
    [currentUser, isReady],
  )
}
