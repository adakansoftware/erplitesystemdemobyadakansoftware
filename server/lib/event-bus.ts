import EventEmitter from 'eventemitter3'

type Events = {
  'invoice.created': { invoiceId: string; userId?: string }
  'invoice.paid': { invoiceId: string; amount: number; userId?: string }
  'stock.low': { productId: string; qty: number; threshold: number }
  'purchase.received': { purchaseId: string; userId?: string }
  'quotation.accepted': { quotationId: string; invoiceId: string; userId?: string }
  'user.login': { userId: string; ip: string }
}

export const eventBus = new EventEmitter<Events>()
