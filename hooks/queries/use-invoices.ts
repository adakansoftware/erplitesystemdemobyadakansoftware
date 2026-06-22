'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { type Invoice, type InvoiceLine } from '@/lib/data/invoices'

function asRecord(value: unknown) {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function mapInvoiceLine(line: unknown): InvoiceLine {
  const raw = asRecord(line)
  return {
    product: String(raw.product ?? ''),
    quantity: Number(raw.quantity ?? 0),
    unitPrice: Number(raw.unitPrice ?? 0),
    taxRate: Number(raw.taxRate ?? 0),
  }
}

function mapInvoice(item: unknown): Invoice {
  const raw = asRecord(item)
  return {
    id: String(raw.id ?? ''),
    customer: String(raw.customer ?? ''),
    issueDate: String(raw.issueDate ?? ''),
    dueDate: String(raw.dueDate ?? ''),
    status: String(raw.status ?? 'draft') as Invoice['status'],
    lines: Array.isArray(raw.lines) ? raw.lines.map(mapInvoiceLine) : [],
    note: String(raw.note ?? ''),
    relatedQuotation:
      raw.relatedQuotation ?? raw.relatedQuotationId
        ? String(raw.relatedQuotation ?? raw.relatedQuotationId)
        : undefined,
  }
}

export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const rows = await api.get<unknown[]>('/invoices')
      return rows.map(mapInvoice)
    },
    staleTime: 60_000,
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      payload: {
        currentAccountId?: string
        customer: string
        issueDate: string
        dueDate: string
        note: string
        status?: Invoice['status']
        relatedQuotationId?: string
        lines: InvoiceLine[]
      },
    ) => api.post<{ id: string }>('/invoices', payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['invoices'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['current-accounts'] }),
      ])
    },
  })
}
