"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsRoutes = void 0;
const hono_1 = require("hono");
const client_1 = require("../db/client");
const schema_1 = require("../db/schema");
const http_1 = require("../lib/http");
const serializers_1 = require("../lib/serializers");
exports.reportsRoutes = new hono_1.Hono();
exports.reportsRoutes.get('/sales-summary', async (c) => {
    const [invoiceItems, lineItems] = await Promise.all([
        client_1.db.select().from(schema_1.invoices),
        client_1.db.select().from(schema_1.invoiceLines),
    ]);
    const totalRevenue = lineItems.reduce((sum, line) => {
        const base = (0, serializers_1.toNumber)(line.quantity) * (0, serializers_1.toNumber)(line.unitPrice);
        return sum + base + base * ((0, serializers_1.toNumber)(line.taxRate) / 100);
    }, 0);
    return (0, http_1.ok)(c, {
        totalRevenue,
        invoiceCount: invoiceItems.length,
        avgOrderValue: invoiceItems.length ? totalRevenue / invoiceItems.length : 0,
    });
});
exports.reportsRoutes.get('/stock-value', async (c) => {
    const [productItems, movementItems] = await Promise.all([
        client_1.db.select().from(schema_1.products),
        client_1.db.select().from(schema_1.stockMovements),
    ]);
    const totalStockValue = productItems.reduce((sum, product) => {
        const stock = movementItems
            .filter((movement) => movement.productId === product.id)
            .reduce((stockSum, movement) => stockSum +
            (movement.type === 'out' ? -(0, serializers_1.toNumber)(movement.qty) : (0, serializers_1.toNumber)(movement.qty)), 0);
        return sum + stock * (0, serializers_1.toNumber)(product.costPrice);
    }, 0);
    return (0, http_1.ok)(c, { totalStockValue });
});
exports.reportsRoutes.get('/cash-flow', async (c) => {
    const items = await client_1.db.select().from(schema_1.transactions);
    const dailySeries = items.map((item) => ({
        date: item.date,
        income: item.type === 'income' ? (0, serializers_1.toNumber)(item.amount) : 0,
        expense: item.type === 'expense' ? (0, serializers_1.toNumber)(item.amount) : 0,
        net: item.type === 'income' ? (0, serializers_1.toNumber)(item.amount) : -(0, serializers_1.toNumber)(item.amount),
    }));
    return (0, http_1.ok)(c, {
        dailySeries,
        totalIncome: dailySeries.reduce((sum, item) => sum + item.income, 0),
        totalExpense: dailySeries.reduce((sum, item) => sum + item.expense, 0),
    });
});
exports.reportsRoutes.get('/crm-funnel', async (c) => {
    const [leadItems, dealItems] = await Promise.all([
        client_1.db.select().from(schema_1.leads),
        client_1.db.select().from(schema_1.deals),
    ]);
    const qualifiedCount = leadItems.filter((item) => item.status === 'qualified').length;
    const wonDeals = dealItems.filter((item) => item.stage === 'won');
    return (0, http_1.ok)(c, {
        leadCount: leadItems.length,
        qualifiedCount,
        dealCount: dealItems.length,
        wonCount: wonDeals.length,
        totalWonValue: wonDeals.reduce((sum, item) => sum + (0, serializers_1.toNumber)(item.value), 0),
        conversionRate: leadItems.length ? wonDeals.length / leadItems.length : 0,
    });
});
