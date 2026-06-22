'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { type Product, type ProductStatus } from '@/lib/data/products'

function asRecord(value: unknown) {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function mapProduct(item: unknown): Product {
  const raw = asRecord(item)
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    sku: String(raw.sku ?? ''),
    barcode: String(raw.barcode ?? ''),
    category: String(raw.category ?? ''),
    brand: String(raw.brand ?? ''),
    unit: String(raw.unit ?? 'Adet'),
    costPrice: Number(raw.costPrice ?? 0),
    supplierPrice: Number(raw.supplierPrice ?? raw.costPrice ?? 0),
    salePrice: Number(raw.salePrice ?? 0),
    taxRate: Number(raw.taxRate ?? 0),
    stock: Number(raw.stock ?? raw.totalStock ?? 0),
    reorderPoint: Number(raw.reorderPoint ?? 0),
    status: (raw.status ?? 'active') as ProductStatus,
    description: String(raw.description ?? ''),
    createdAt: String(raw.createdAt ?? new Date().toISOString()).slice(0, 10),
  }
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const rows = await api.get<unknown[]>('/products')
      return rows.map(mapProduct)
    },
    staleTime: 60_000,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Partial<Product> & { name: string; sku: string }) =>
      api.post<Product>('/products', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
