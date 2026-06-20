"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.currentAccountsRoutes = void 0;
const hono_1 = require("hono");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const client_1 = require("../db/client");
const schema_1 = require("../db/schema");
const rules_1 = require("../lib/rules");
const http_1 = require("../lib/http");
const validate_1 = require("../middleware/validate");
const accountSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    name: zod_1.z.string().min(2),
    type: zod_1.z.enum(['customer', 'supplier']),
    taxNumber: zod_1.z.string().optional().nullable(),
    taxOffice: zod_1.z.string().optional().nullable(),
    address: zod_1.z.string().optional().nullable(),
    city: zod_1.z.string().optional().nullable(),
    phone: zod_1.z.string().optional().nullable(),
    email: zod_1.z.string().optional().nullable(),
    creditLimit: zod_1.z.coerce.number().default(0),
});
exports.currentAccountsRoutes = new hono_1.Hono();
exports.currentAccountsRoutes.get('/', async (c) => {
    const type = c.req.query('type');
    const search = c.req.query('search');
    const filters = [
        type ? (0, drizzle_orm_1.eq)(schema_1.currentAccounts.type, type) : undefined,
        search ? (0, drizzle_orm_1.ilike)(schema_1.currentAccounts.name, `%${search}%`) : undefined,
        (0, drizzle_orm_1.eq)(schema_1.currentAccounts.active, true),
    ].filter(Boolean);
    const items = await client_1.db
        .select()
        .from(schema_1.currentAccounts)
        .where((0, drizzle_orm_1.and)(...filters));
    const withBalance = await Promise.all(items.map(async (item) => ({
        ...item,
        balance: await (0, rules_1.calculateCurrentAccountBalance)(item.id),
    })));
    return (0, http_1.ok)(c, withBalance);
});
exports.currentAccountsRoutes.get('/:id', async (c) => {
    const id = c.req.param('id');
    const [account] = await client_1.db
        .select()
        .from(schema_1.currentAccounts)
        .where((0, drizzle_orm_1.eq)(schema_1.currentAccounts.id, id));
    if (!account) {
        return (0, http_1.fail)(c, 404, 'Current account not found');
    }
    return (0, http_1.ok)(c, { ...account, balance: await (0, rules_1.calculateCurrentAccountBalance)(id) });
});
exports.currentAccountsRoutes.get('/:id/statement', async (c) => {
    const id = c.req.param('id');
    const rows = await client_1.db
        .select()
        .from(schema_1.transactions)
        .where((0, drizzle_orm_1.eq)(schema_1.transactions.currentAccountId, id));
    return (0, http_1.ok)(c, rows);
});
exports.currentAccountsRoutes.post('/', (0, validate_1.validate)(accountSchema), async (c) => {
    const body = c.get('validatedBody');
    await client_1.db.insert(schema_1.currentAccounts).values({
        id: body.id ?? `CARI-${Date.now()}`,
        name: body.name,
        type: body.type,
        taxNumber: body.taxNumber,
        taxOffice: body.taxOffice,
        address: body.address,
        city: body.city,
        phone: body.phone,
        email: body.email,
        creditLimit: String(body.creditLimit),
    });
    return (0, http_1.created)(c, body);
});
exports.currentAccountsRoutes.put('/:id', (0, validate_1.validate)(accountSchema.partial()), async (c) => {
    const id = c.req.param('id');
    const body = c.get('validatedBody');
    await client_1.db
        .update(schema_1.currentAccounts)
        .set({
        ...body,
        creditLimit: body.creditLimit != null ? String(body.creditLimit) : undefined,
        updatedAt: new Date(),
    })
        .where((0, drizzle_orm_1.eq)(schema_1.currentAccounts.id, id));
    const [account] = await client_1.db.select().from(schema_1.currentAccounts).where((0, drizzle_orm_1.eq)(schema_1.currentAccounts.id, id));
    return (0, http_1.ok)(c, account);
});
exports.currentAccountsRoutes.delete('/:id', async (c) => {
    const id = c.req.param('id');
    await client_1.db
        .update(schema_1.currentAccounts)
        .set({ active: false, updatedAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_1.currentAccounts.id, id));
    return (0, http_1.ok)(c, { id, active: false });
});
