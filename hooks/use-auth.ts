'use client'

import { useEffect, useMemo, useState } from 'react'

export type DemoUser = {
  id: string
  name: string
  email: string
  role: 'admin' | 'sales'
  initials: string
}

type StoredUser = DemoUser & { password: string }

const USERS_KEY = 'erp-lite-demo-users'
const SESSION_KEY = 'erp-lite-session'

const defaultUsers: StoredUser[] = [
  {
    id: 'USR-001',
    name: 'Mehmet Adakan',
    email: 'admin@demo.com',
    password: 'demo123',
    role: 'admin',
    initials: 'MA',
  },
  {
    id: 'USR-002',
    name: 'Selin Kaya',
    email: 'satis@demo.com',
    password: 'demo123',
    role: 'sales',
    initials: 'SK',
  },
]

function stripPassword(user: StoredUser): DemoUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    initials: user.initials,
  }
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const existingUsers = window.localStorage.getItem(USERS_KEY)
    if (!existingUsers) {
      window.localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers))
    }

    const rawSession = window.localStorage.getItem(SESSION_KEY)
    if (rawSession) {
      try {
        setCurrentUser(JSON.parse(rawSession) as DemoUser)
      } catch {
        window.localStorage.removeItem(SESSION_KEY)
      }
    }

    setIsReady(true)
  }, [])

  const api = useMemo(
    () => ({
      currentUser,
      isReady,
      isAuthenticated: Boolean(currentUser),
      login: (email: string, password: string) => {
        if (typeof window === 'undefined') {
          return { ok: false as const, message: 'Tarayici kullanilamiyor.' }
        }

        const users = JSON.parse(
          window.localStorage.getItem(USERS_KEY) ?? JSON.stringify(defaultUsers),
        ) as StoredUser[]

        const matchedUser = users.find(
          (user) =>
            user.email.toLocaleLowerCase('tr-TR') ===
              email.toLocaleLowerCase('tr-TR') && user.password === password,
        )

        if (!matchedUser) {
          return { ok: false as const, message: 'E-posta veya sifre hatali.' }
        }

        const nextSession = stripPassword(matchedUser)
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
        setCurrentUser(nextSession)

        return { ok: true as const, user: nextSession }
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(SESSION_KEY)
        }
        setCurrentUser(null)
      },
    }),
    [currentUser, isReady],
  )

  return api
}
