"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crmRoutes = void 0;
const hono_1 = require("hono");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const client_1 = require("../db/client");
const schema_1 = require("../db/schema");
const http_1 = require("../lib/http");
const validate_1 = require("../middleware/validate");
function crudRoutes(app, base, table, schema, searchColumn) {
    app.get(base, async (c) => {
        const search = c.req.query('search');
        const items = await client_1.db
            .select()
            .from(table)
            .where(search && searchColumn ? (0, drizzle_orm_1.ilike)(searchColumn, `%${search}%`) : undefined);
        return (0, http_1.ok)(c, items);
    });
    app.post(base, (0, validate_1.validate)(schema), async (c) => {
        const body = c.get('validatedBody');
        await client_1.db.insert(table).values(body);
        return (0, http_1.created)(c, body);
    });
}
const leadSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    company: zod_1.z.string().optional().nullable(),
    source: zod_1.z.string().optional().nullable(),
    status: zod_1.z.string().default('new'),
    value: zod_1.z.coerce.number().default(0),
    owner: zod_1.z.string().optional().nullable(),
    phone: zod_1.z.string().optional().nullable(),
    email: zod_1.z.string().optional().nullable(),
    note: zod_1.z.string().optional().nullable(),
});
const companySchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    sector: zod_1.z.string().optional().nullable(),
    city: zod_1.z.string().optional().nullable(),
    phone: zod_1.z.string().optional().nullable(),
    email: zod_1.z.string().optional().nullable(),
    website: zod_1.z.string().optional().nullable(),
    currentAccountId: zod_1.z.string().optional().nullable(),
});
const contactSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    title: zod_1.z.string().optional().nullable(),
    companyId: zod_1.z.string().optional().nullable(),
    email: zod_1.z.string().optional().nullable(),
    phone: zod_1.z.string().optional().nullable(),
    note: zod_1.z.string().optional().nullable(),
});
const dealSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    currentAccountId: zod_1.z.string().optional().nullable(),
    stage: zod_1.z.string().default('lead'),
    value: zod_1.z.coerce.number().default(0),
    owner: zod_1.z.string().optional().nullable(),
    closeDate: zod_1.z.string().optional().nullable(),
    note: zod_1.z.string().optional().nullable(),
});
const taskSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    related: zod_1.z.string().optional().nullable(),
    relatedType: zod_1.z.string().optional().nullable(),
    relatedId: zod_1.z.string().optional().nullable(),
    due: zod_1.z.string().optional().nullable(),
    priority: zod_1.z.string().default('medium'),
    owner: zod_1.z.string().optional().nullable(),
    assignedTo: zod_1.z.string().optional().nullable(),
    done: zod_1.z.boolean().optional(),
});
exports.crmRoutes = new hono_1.Hono();
crudRoutes(exports.crmRoutes, '/leads', schema_1.leads, leadSchema, schema_1.leads.name);
crudRoutes(exports.crmRoutes, '/companies', schema_1.companies, companySchema, schema_1.companies.name);
crudRoutes(exports.crmRoutes, '/contacts', schema_1.contacts, contactSchema, schema_1.contacts.name);
crudRoutes(exports.crmRoutes, '/deals', schema_1.deals, dealSchema, schema_1.deals.title);
crudRoutes(exports.crmRoutes, '/tasks', schema_1.tasks, taskSchema, schema_1.tasks.title);
exports.crmRoutes.put('/leads/:id', (0, validate_1.validate)(leadSchema.partial()), async (c) => {
    const id = c.req.param('id');
    const body = c.get('validatedBody');
    await client_1.db
        .update(schema_1.leads)
        .set({
        ...body,
        value: body.value != null ? String(body.value) : undefined,
        updatedAt: new Date(),
    })
        .where((0, drizzle_orm_1.eq)(schema_1.leads.id, id));
    return (0, http_1.ok)(c, { id });
});
exports.crmRoutes.delete('/leads/:id', async (c) => {
    const id = c.req.param('id');
    await client_1.db.delete(schema_1.leads).where((0, drizzle_orm_1.eq)(schema_1.leads.id, id));
    return (0, http_1.ok)(c, { id });
});
exports.crmRoutes.put('/companies/:id', (0, validate_1.validate)(companySchema.partial()), async (c) => {
    const id = c.req.param('id');
    await client_1.db
        .update(schema_1.companies)
        .set(c.get('validatedBody'))
        .where((0, drizzle_orm_1.eq)(schema_1.companies.id, id));
    return (0, http_1.ok)(c, { id });
});
exports.crmRoutes.put('/contacts/:id', (0, validate_1.validate)(contactSchema.partial()), async (c) => {
    const id = c.req.param('id');
    await client_1.db
        .update(schema_1.contacts)
        .set(c.get('validatedBody'))
        .where((0, drizzle_orm_1.eq)(schema_1.contacts.id, id));
    return (0, http_1.ok)(c, { id });
});
exports.crmRoutes.put('/deals/:id', (0, validate_1.validate)(dealSchema.partial()), async (c) => {
    const id = c.req.param('id');
    const body = c.get('validatedBody');
    await client_1.db
        .update(schema_1.deals)
        .set({
        ...body,
        value: body.value != null ? String(body.value) : undefined,
        updatedAt: new Date(),
    })
        .where((0, drizzle_orm_1.eq)(schema_1.deals.id, id));
    return (0, http_1.ok)(c, { id });
});
exports.crmRoutes.put('/tasks/:id', (0, validate_1.validate)(taskSchema.partial()), async (c) => {
    const id = c.req.param('id');
    await client_1.db
        .update(schema_1.tasks)
        .set(c.get('validatedBody'))
        .where((0, drizzle_orm_1.eq)(schema_1.tasks.id, id));
    return (0, http_1.ok)(c, { id });
});
exports.crmRoutes.patch('/tasks/:id/toggle', async (c) => {
    const id = c.req.param('id');
    const [task] = await client_1.db.select().from(schema_1.tasks).where((0, drizzle_orm_1.eq)(schema_1.tasks.id, id));
    await client_1.db
        .update(schema_1.tasks)
        .set({ done: !task?.done, doneAt: !task?.done ? new Date() : null, updatedAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_1.tasks.id, id));
    return (0, http_1.ok)(c, { id, done: !task?.done });
});
exports.crmRoutes.get('/pipeline', async (c) => {
    const items = await client_1.db.select().from(schema_1.deals);
    const grouped = items.reduce((acc, item) => {
        const key = item.stage;
        acc[key] ??= { count: 0, totalValue: 0 };
        acc[key].count += 1;
        acc[key].totalValue += Number(item.value ?? 0);
        return acc;
    }, {});
    return (0, http_1.ok)(c, grouped);
});
