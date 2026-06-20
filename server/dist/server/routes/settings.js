"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRoutes = void 0;
const hono_1 = require("hono");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const client_1 = require("../db/client");
const schema_1 = require("../db/schema");
const http_1 = require("../lib/http");
const validate_1 = require("../middleware/validate");
const settingsSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    taxNumber: zod_1.z.string().optional().nullable(),
    taxOffice: zod_1.z.string().optional().nullable(),
    address: zod_1.z.string().optional().nullable(),
    city: zod_1.z.string().optional().nullable(),
    phone: zod_1.z.string().optional().nullable(),
    email: zod_1.z.string().optional().nullable(),
    website: zod_1.z.string().optional().nullable(),
    logoUrl: zod_1.z.string().optional().nullable(),
    currency: zod_1.z.string().default('TRY'),
});
exports.settingsRoutes = new hono_1.Hono();
exports.settingsRoutes.get('/', async (c) => {
    const [row] = await client_1.db.select().from(schema_1.companySettings).where((0, drizzle_orm_1.eq)(schema_1.companySettings.id, 1));
    return (0, http_1.ok)(c, row ?? null);
});
exports.settingsRoutes.put('/', (0, validate_1.validate)(settingsSchema), async (c) => {
    const body = c.get('validatedBody');
    await client_1.db
        .insert(schema_1.companySettings)
        .values({ id: 1, ...body, updatedAt: new Date() })
        .onConflictDoUpdate({
        target: schema_1.companySettings.id,
        set: { ...body, updatedAt: new Date() },
    });
    const [row] = await client_1.db.select().from(schema_1.companySettings).where((0, drizzle_orm_1.eq)(schema_1.companySettings.id, 1));
    return (0, http_1.ok)(c, row);
});
