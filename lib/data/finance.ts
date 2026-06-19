import type { BadgeVariant } from '@/lib/ui-meta'

export type FinanceAccount = {
  id: string
  name: string
  type: 'cash' | 'bank'
  bankName?: string
  iban?: string
  currency: string
  balance: number
}

export const financeAccounts: FinanceAccount[] = [
  {
    id: 'ACC-CASH-1',
    name: 'Merkez Kasa',
    type: 'cash',
    currency: 'TRY',
    balance: 84200,
  },
  {
    id: 'ACC-CASH-2',
    name: 'Magaza Kasa',
    type: 'cash',
    currency: 'TRY',
    balance: 23650,
  },
  {
    id: 'ACC-BANK-1',
    name: 'Is Bankasi Vadesiz',
    type: 'bank',
    bankName: 'Turkiye Is Bankasi',
    iban: 'TR12 0006 4000 0011 2345 6789 01',
    currency: 'TRY',
    balance: 412800,
  },
  {
    id: 'ACC-BANK-2',
    name: 'Garanti BBVA Ticari',
    type: 'bank',
    bankName: 'Garanti BBVA',
    iban: 'TR98 0006 2000 1234 0006 6789 02',
    currency: 'TRY',
    balance: 268500,
  },
  {
    id: 'ACC-BANK-3',
    name: 'Yapi Kredi USD',
    type: 'bank',
    bankName: 'Yapi Kredi',
    iban: 'TR45 0006 7010 0000 0099 8877 66',
    currency: 'USD',
    balance: 18400,
  },
]

export type TransactionType = 'income' | 'expense'

export const transactionMeta: Record<
  TransactionType,
  { label: string; variant: BadgeVariant }
> = {
  income: { label: 'Gelir', variant: 'success' },
  expense: { label: 'Gider', variant: 'destructive' },
}

export type Transaction = {
  id: string
  date: string
  description: string
  category: string
  account: string
  type: TransactionType
  amount: number
}

export const transactions: Transaction[] = [
  {
    id: 'TRX-5012',
    date: '2024-04-18',
    description: 'Demir Tadilat - Fatura tahsilati',
    category: 'Satis Geliri',
    account: 'Magaza Kasa',
    type: 'income',
    amount: 15792,
  },
  {
    id: 'TRX-5011',
    date: '2024-04-17',
    description: 'Bosch Dagitim - Mal alimi odemesi',
    category: 'Tedarik',
    account: 'Is Bankasi Vadesiz',
    type: 'expense',
    amount: 64500,
  },
  {
    id: 'TRX-5010',
    date: '2024-04-16',
    description: 'Yildiz Insaat - Kismi tahsilat',
    category: 'Satis Geliri',
    account: 'Is Bankasi Vadesiz',
    type: 'income',
    amount: 20000,
  },
  {
    id: 'TRX-5009',
    date: '2024-04-15',
    description: 'Personel maaslari - Nisan',
    category: 'Maas',
    account: 'Garanti BBVA Ticari',
    type: 'expense',
    amount: 142000,
  },
  {
    id: 'TRX-5008',
    date: '2024-04-14',
    description: 'Anadolu Yapi - Fatura tahsilati',
    category: 'Satis Geliri',
    account: 'Is Bankasi Vadesiz',
    type: 'income',
    amount: 35808,
  },
  {
    id: 'TRX-5007',
    date: '2024-04-13',
    description: 'Depo kira odemesi',
    category: 'Kira',
    account: 'Garanti BBVA Ticari',
    type: 'expense',
    amount: 48000,
  },
  {
    id: 'TRX-5006',
    date: '2024-04-12',
    description: 'Elektrik & su faturasi',
    category: 'Gider',
    account: 'Merkez Kasa',
    type: 'expense',
    amount: 8400,
  },
  {
    id: 'TRX-5005',
    date: '2024-04-11',
    description: 'Karcher satisi - pesin',
    category: 'Satis Geliri',
    account: 'Magaza Kasa',
    type: 'income',
    amount: 17496,
  },
  {
    id: 'TRX-5004',
    date: '2024-04-10',
    description: 'Nakliye gideri',
    category: 'Lojistik',
    account: 'Merkez Kasa',
    type: 'expense',
    amount: 6200,
  },
  {
    id: 'TRX-5003',
    date: '2024-04-09',
    description: 'Kaya Muhendislik - avans',
    category: 'Satis Geliri',
    account: 'Is Bankasi Vadesiz',
    type: 'income',
    amount: 50000,
  },
]
