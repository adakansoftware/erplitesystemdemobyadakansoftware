'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api/client'

export type DemoUser = {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'sales'
  tenantId: string | null
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

function mapUser(payload: unknown): DemoUser | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const raw = payload as Record<string, unknown>
  if (!raw.id || !raw.email) {
    return null
  }

  const role =
    raw.role === 'manager'
      ? 'manager'
      : raw.role === 'sales'
        ? 'sales'
        : 'admin'

  const name = String(raw.name ?? 'Demo Kullanici')

  return {
    id: String(raw.id),
    name,
    email: String(raw.email),
    role,
    tenantId: raw.tenantId ? String(raw.tenantId) : null,
    initials: toInitials(name),
  }
}

type AuthState = {
  currentUser: DemoUser | null
  isReady: boolean
}

let authState: AuthState = {
  currentUser: null,
  isReady: false,
}

let pendingSessionRequest: Promise<void> | null = null
const authListeners = new Set<(state: AuthState) => void>()

function emitAuth(nextState: AuthState) {
  authState = nextState
  authListeners.forEach((listener) => listener(authState))
}

function subscribeAuth(listener: (state: AuthState) => void) {
  authListeners.add(listener)
  return () => {
    authListeners.delete(listener)
  }
}

async function refreshSession() {
  if (pendingSessionRequest) {
    return pendingSessionRequest
  }

  pendingSessionRequest = api
    .get<unknown>('/auth/me')
    .then((user) => {
      emitAuth({
        currentUser: mapUser(user),
        isReady: true,
      })
    })
    .catch(() => {
      emitAuth({
        currentUser: null,
        isReady: true,
      })
    })
    .finally(() => {
      pendingSessionRequest = null
    })

  return pendingSessionRequest
}

export function useAuth() {
  const [state, setState] = useState(authState)

  useEffect(() => {
    const unsubscribe = subscribeAuth(setState)

    if (!authState.isReady && !pendingSessionRequest) {
      void refreshSession()
    }

    return unsubscribe
  }, [])

  return useMemo(
    () => ({
      currentUser: state.currentUser,
      isReady: state.isReady,
      isAuthenticated: Boolean(state.currentUser),
      isAdmin: state.currentUser?.role === 'admin',
      isManager: ['admin', 'manager'].includes(state.currentUser?.role ?? ''),
      login: async (tenantSlug: string, email: string, password: string) => {
        try {
          const result = await api.post<{ user?: unknown }>('/auth/login', {
            tenantSlug,
            email,
            password,
          })
          const user = mapUser(result.user)
          if (!user) {
            return {
              ok: false as const,
              message: 'Oturum bilgisi okunamadi.',
            }
          }
          emitAuth({ currentUser: user, isReady: true })
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
          emitAuth({ currentUser: null, isReady: true })
        }
      },
    }),
    [state.currentUser, state.isReady],
  )
}
