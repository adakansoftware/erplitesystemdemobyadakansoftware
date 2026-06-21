'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api/client'

export type DemoUser = {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'sales'
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
  const role =
    payload.role === 'manager'
      ? 'manager'
      : payload.role === 'sales'
        ? 'sales'
        : 'admin'

  return {
    id: payload.id ?? '',
    name: payload.name ?? 'Demo Kullanici',
    email: payload.email ?? 'admin@demo.com',
    role,
    initials: toInitials(payload.name ?? 'Demo Kullanici'),
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
    .get<any>('/auth/me')
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
      login: async (email: string, password: string) => {
        try {
          const result = await api.post<any>('/auth/login', { email, password })
          const user = mapUser(result.user)
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
