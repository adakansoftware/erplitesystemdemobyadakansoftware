'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { type CurrentAccount } from '@/lib/data/accounts'

function asRecord(value: unknown) {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function mapCurrentAccount(item: unknown): CurrentAccount {
  const raw = asRecord(item)
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    type: raw.type === 'supplier' ? 'supplier' : 'customer',
    taxNumber: String(raw.taxNumber ?? ''),
    city: String(raw.city ?? ''),
    phone: String(raw.phone ?? ''),
    email: String(raw.email ?? ''),
    balance: Number(raw.balance ?? 0),
    creditLimit: Number(raw.creditLimit ?? 0),
  }
}

export function useCurrentAccounts() {
  return useQuery({
    queryKey: ['current-accounts'],
    queryFn: async () => {
      const rows = await api.get<unknown[]>('/current-accounts')
      return rows.map(mapCurrentAccount)
    },
    staleTime: 60_000,
  })
}

export function useCreateCurrentAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Omit<CurrentAccount, 'id'> & { id?: string }) =>
      api.post('/current-accounts', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['current-accounts'] })
    },
  })
}
