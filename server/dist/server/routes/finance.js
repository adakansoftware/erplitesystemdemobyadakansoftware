"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.financeRoutes = void 0;
const hono_1 = require("hono");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const client_1 = require("../db/client");
const schema_1 = require("../db/schema");
const ids_1 = require("../lib/ids");
const http_1 = require("../lib/http");
const serializers_1 = require("../lib/serializers");
const validate_1 = require("../middleware/validate");
const financeAccountSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    name: zod_1.z.string().min(2),
    type: zod_1.z.enum(['cash', 'bank']),
    bankName: zod_1.z.string().optional().nullable(),
    iban: zod_1.z.string().optional().nullable(),
    currency: zod_1.z.string().default('TRY'),
});
const transactionSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    date: zod_1.z.string(),
    description: zod_1.z.string().min(2),
    category: zod_1.z.string().optional().nullable(),
    financeAccountId: zod_1.z.string(),
    type: zod_1.z.enum(['income', 'expense']),
    amount: zod_1.z.coerce.number().positive(),
    currentAccountId: zod_1.z.string().optional().nullable(),
});
exports.financeRoutes = new hono_1.Hono();
exports.financeRoutes.get('/accounts', async (c) => {
    const accounts = await client_1.db.select().from(schema_1.financeAccounts);
    const txs = await client_1.db.select().from(schema_1.transactions);
    const result = accounts.map((account) => ({
        ...account,
        balance: txs
            .filter((tx) => tx.financeAccountId === account.id)
            .reduce((sum, tx) => sum + (tx.type === 'income' ? (0, serializers_1.toNumber)(tx.amount) : -(0, serializers_1.toNumber)(tx.amount)), 0),
    }));
    return (0, http_1.ok)(c, result);
});
exports.financeRoutes.post('/accounts', (0, validate_1.validate)(financeAccountSchema), async (c) => {
    const body = c.get('validatedBody');
    await client_1.db.insert(schema_1.financeAccounts).values({
        id: body.id ?? `ACC-${Date.now()}`,
        name: body.name,
        type: body.type,
        bankName: body.bankName,
        iban: body.iban,
        currency: body.currency,
    });
    return (0, http_1.created)(c, body);
});
exports.financeRoutes.get('/transactions', async (c) => {
    const accountId = c.req.query('accountId');
    const type = c.req.query('type');
    const filters = [
        accountId ? (0, drizzle_orm_1.eq)(schema_1.transactions.financeAccountId, accountId) : undefined,
        type ? (0, drizzle_orm_1.eq)(schema_1.transactions.type, type) : undefined,
    ].filter(Boolean);
    const [txs, accounts] = await Promise.all([
        client_1.db.select().from(schema_1.transactions).where(filters.length ? (0, drizzle_orm_1.and)(...filters) : undefined),
        client_1.db.select().from(schema_1.financeAccounts),
    ]);
    const accountMap = new Map(accounts.map((account) => [account.id, account.name]));
    return (0, http_1.ok)(c, txs.map((item) => ({
        ...item,
        amount: Number(item.amount),
        account: accountMap.get(item.financeAccountId) ?? item.financeAccountId,
    })));
});
exports.financeRoutes.post('/transactions', (0, validate_1.validate)(transactionSchema), async (c) => {
    const body = c.get('validatedBody');
    const ids = await client_1.db.select({ id: schema_1.transactions.id }).from(schema_1.transactions);
    await client_1.db.insert(schema_1.transactions).values({
        id: body.id ?? (0, ids_1.nextTransactionId)(ids.map((item) => item.id)),
        date: body.date,
        description: body.description,
        category: body.category,
        financeAccountId: body.financeAccountId,
        type: body.type,
        amount: String(body.amount),
        currentAccountId: body.currentAccountId,
    });
    return (0, http_1.created)(c, body);
});
exports.financeRoutes.delete('/transactions/:id', async (c) => {
    const id = c.req.param('id');
    await client_1.db.delete(schema_1.transactions).where((0, drizzle_orm_1.eq)(schema_1.transactions.id, id));
    return (0, http_1.ok)(c, { id });
});
exports.financeRoutes.get('/summary', async (c) => {
    const accounts = await client_1.db.select().from(schema_1.financeAccounts);
    const txs = await client_1.db.select().from(schema_1.transactions);
    const summary = accounts.reduce((acc, account) => {
        const balance = txs
            .filter((tx) => tx.financeAccountId === account.id)
            .reduce((sum, tx) => sum + (tx.type === 'income' ? (0, serializers_1.toNumber)(tx.amount) : -(0, serializers_1.toNumber)(tx.amount)), 0);
        if (account.type === 'cash')
            acc.totalCash += balance;
        if (account.type === 'bank')
            acc.totalBank += balance;
        return acc;
    }, { totalCash: 0, totalBank: 0, netPosition: 0 });
    summary.netPosition = summary.totalCash + summary.totalBank;
    return (0, http_1.ok)(c, summary);
});
