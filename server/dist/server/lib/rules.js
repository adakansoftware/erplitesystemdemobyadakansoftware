"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductStock = getProductStock;
exports.ensureStockAvailable = ensureStockAvailable;
exports.createStockOutForInvoice = createStockOutForInvoice;
exports.createStockInForPurchaseOrder = createStockInForPurchaseOrder;
exports.createInvoicePaymentTransaction = createInvoicePaymentTransaction;
exports.calculateCurrentAccountBalance = calculateCurrentAccountBalance;
exports.attachProductStocks = attachProductStocks;
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../db/client");
const schema_1 = require("../db/schema");
const ids_1 = require("./ids");
const serializers_1 = require("./serializers");
async function getProductStock(productId) {
    const [result] = await client_1.db
        .select({
        qty: (0, drizzle_orm_1.sql) `coalesce(sum(case when ${schema_1.stockMovements.type} = 'out' then -${schema_1.stockMovements.qty} else ${schema_1.stockMovements.qty} end), 0)`,
    })
        .from(schema_1.stockMovements)
        .where((0, drizzle_orm_1.eq)(schema_1.stockMovements.productId, productId));
    return (0, serializers_1.toNumber)(result?.qty);
}
async function ensureStockAvailable(lines) {
    for (const line of lines) {
        if (!line.productId) {
            continue;
        }
        const stock = await getProductStock(line.productId);
        if (stock < line.quantity) {
            return {
                ok: false,
                productId: line.productId,
                available: stock,
            };
        }
    }
    return { ok: true };
}
async function createStockOutForInvoice(invoiceId, userId) {
    await client_1.db
        .delete(schema_1.stockMovements)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.stockMovements.relatedDocType, 'invoice'), (0, drizzle_orm_1.eq)(schema_1.stockMovements.relatedDocId, invoiceId)));
    const lines = await client_1.db
        .select()
        .from(schema_1.invoiceLines)
        .where((0, drizzle_orm_1.eq)(schema_1.invoiceLines.invoiceId, invoiceId));
    for (const line of lines) {
        if (!line.productId) {
            continue;
        }
        await client_1.db.insert(schema_1.stockMovements).values({
            productId: line.productId,
            warehouseId: 'WH-01',
            type: 'out',
            qty: String(line.quantity),
            unitCost: String(line.unitPrice),
            relatedDocType: 'invoice',
            relatedDocId: invoiceId,
            note: 'Fatura kaynakli stok cikisi',
            createdBy: userId,
        });
    }
}
async function createStockInForPurchaseOrder(purchaseOrderId, userId) {
    await client_1.db
        .delete(schema_1.stockMovements)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.stockMovements.relatedDocType, 'purchase_order'), (0, drizzle_orm_1.eq)(schema_1.stockMovements.relatedDocId, purchaseOrderId)));
    const lines = await client_1.db
        .select()
        .from(schema_1.purchaseOrderLines)
        .where((0, drizzle_orm_1.eq)(schema_1.purchaseOrderLines.purchaseOrderId, purchaseOrderId));
    for (const line of lines) {
        if (!line.productId) {
            continue;
        }
        await client_1.db.insert(schema_1.stockMovements).values({
            productId: line.productId,
            warehouseId: 'WH-01',
            type: 'in',
            qty: String(line.receivedQty ?? line.quantity),
            unitCost: String(line.unitPrice),
            relatedDocType: 'purchase_order',
            relatedDocId: purchaseOrderId,
            note: 'Satin alma kaynakli stok girisi',
            createdBy: userId,
        });
    }
}
async function createInvoicePaymentTransaction(invoiceId, userId) {
    const [invoice] = await client_1.db.select().from(schema_1.invoices).where((0, drizzle_orm_1.eq)(schema_1.invoices.id, invoiceId));
    if (!invoice) {
        return;
    }
    const lines = await client_1.db
        .select()
        .from(schema_1.invoiceLines)
        .where((0, drizzle_orm_1.eq)(schema_1.invoiceLines.invoiceId, invoiceId));
    const total = lines.reduce((sum, line) => {
        const base = (0, serializers_1.toNumber)(line.quantity) * (0, serializers_1.toNumber)(line.unitPrice);
        return sum + base + base * ((0, serializers_1.toNumber)(line.taxRate) / 100);
    }, 0);
    const [account] = await client_1.db
        .select()
        .from(schema_1.financeAccounts)
        .where((0, drizzle_orm_1.eq)(schema_1.financeAccounts.type, 'bank'));
    const ids = await client_1.db.select({ id: schema_1.transactions.id }).from(schema_1.transactions);
    await client_1.db.insert(schema_1.transactions).values({
        id: (0, ids_1.nextTransactionId)(ids.map((item) => item.id)),
        date: invoice.dueDate,
        description: `${invoice.customer} - Fatura tahsilati`,
        category: 'Tahsilat',
        financeAccountId: account?.id ?? 'ACC-BANK-1',
        type: 'income',
        amount: String(total.toFixed(2)),
        relatedDocType: 'invoice',
        relatedDocId: invoice.id,
        currentAccountId: invoice.currentAccountId,
        createdBy: userId,
    });
}
async function calculateCurrentAccountBalance(currentAccountId) {
    const [result] = await client_1.db
        .select({
        balance: (0, drizzle_orm_1.sql) `coalesce(sum(case when ${schema_1.transactions.type} = 'income' then ${schema_1.transactions.amount} else -${schema_1.transactions.amount} end), 0)`,
    })
        .from(schema_1.transactions)
        .where((0, drizzle_orm_1.eq)(schema_1.transactions.currentAccountId, currentAccountId));
    return (0, serializers_1.toNumber)(result?.balance);
}
async function attachProductStocks(items) {
    return Promise.all(items.map(async (item) => ({
        ...item,
        totalStock: await getProductStock(item.id),
    })));
}
