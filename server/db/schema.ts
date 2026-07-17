import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  plan: varchar('plan', { length: 20 }).notNull().default('starter'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('staff'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 500 }).notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    revoked: boolean('revoked').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    byUser: index('refresh_tokens_user_idx').on(table.userId),
    byExpiry: index('refresh_tokens_expiry_idx').on(table.expiresAt),
  }),
)

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id),
    action: varchar('action', { length: 50 }).notNull(),
    entity: varchar('entity', { length: 50 }).notNull(),
    entityId: varchar('entity_id', { length: 50 }),
    oldValues: jsonb('old_values'),
    newValues: jsonb('new_values'),
    ip: varchar('ip', { length: 45 }),
    userAgent: varchar('user_agent', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    byEntity: index('audit_logs_entity_idx').on(table.entity, table.entityId),
    byUser: index('audit_logs_user_idx').on(table.userId),
    byCreatedAt: index('audit_logs_created_idx').on(table.createdAt),
  }),
)

export const companySettings = pgTable('company_settings', {
  id: integer('id').primaryKey().default(1),
  tenantId: uuid('tenant_id').notNull().unique().references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull().default(''),
  taxNumber: varchar('tax_number', { length: 20 }),
  taxOffice: varchar('tax_office', { length: 100 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  phone: varchar('phone', { length: 30 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 255 }),
  logoUrl: varchar('logo_url', { length: 500 }),
  currency: varchar('currency', { length: 3 }).notNull().default('TRY'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const currentAccounts = pgTable('current_accounts', {
  id: varchar('id', { length: 20 }).primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  taxNumber: varchar('tax_number', { length: 20 }),
  taxOffice: varchar('tax_office', { length: 100 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  phone: varchar('phone', { length: 30 }),
  email: varchar('email', { length: 255 }),
  creditLimit: numeric('credit_limit', { precision: 15, scale: 2 }).default('0'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const productCategories = pgTable('product_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
})

export const products = pgTable('products', {
  id: varchar('id', { length: 20 }).primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull(),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  barcode: varchar('barcode', { length: 50 }),
  categoryId: uuid('category_id').references(() => productCategories.id),
  brand: varchar('brand', { length: 100 }),
  unit: varchar('unit', { length: 30 }).notNull().default('Adet'),
  costPrice: numeric('cost_price', { precision: 15, scale: 2 }).notNull().default('0'),
  salePrice: numeric('sale_price', { precision: 15, scale: 2 }).notNull().default('0'),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).notNull().default('18'),
  reorderPoint: integer('reorder_point').notNull().default(0),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const warehouses = pgTable('warehouses', {
  id: varchar('id', { length: 20 }).primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull(),
  location: varchar('location', { length: 255 }),
  manager: varchar('manager', { length: 255 }),
  capacity: integer('capacity'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const stockMovements = pgTable(
  'stock_movements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id),
    productId: varchar('product_id', { length: 20 }).notNull().references(() => products.id),
    warehouseId: varchar('warehouse_id', { length: 20 }).references(() => warehouses.id),
    type: varchar('type', { length: 20 }).notNull(),
    qty: numeric('qty', { precision: 15, scale: 3 }).notNull(),
    unitCost: numeric('unit_cost', { precision: 15, scale: 2 }),
    relatedDocType: varchar('related_doc_type', { length: 30 }),
    relatedDocId: varchar('related_doc_id', { length: 30 }),
    note: text('note'),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    byProduct: index('sm_product_idx').on(table.productId),
    byDate: index('sm_date_idx').on(table.createdAt),
    byRelated: index('sm_related_idx').on(table.relatedDocType, table.relatedDocId),
  }),
)

export const leads = pgTable('leads', {
  id: varchar('id', { length: 20 }).primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull(),
  company: varchar('company', { length: 255 }),
  source: varchar('source', { length: 100 }),
  status: varchar('status', { length: 30 }).notNull().default('new'),
  value: numeric('value', { precision: 15, scale: 2 }),
  owner: varchar('owner', { length: 255 }),
  phone: varchar('phone', { length: 30 }),
  email: varchar('email', { length: 255 }),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const companies = pgTable('companies', {
  id: varchar('id', { length: 20 }).primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull(),
  sector: varchar('sector', { length: 100 }),
  city: varchar('city', { length: 100 }),
  phone: varchar('phone', { length: 30 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 255 }),
  currentAccountId: varchar('current_account_id', { length: 20 }).references(
    () => currentAccounts.id,
  ),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const contacts = pgTable('contacts', {
  id: varchar('id', { length: 20 }).primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull(),
  title: varchar('title', { length: 100 }),
  companyId: varchar('company_id', { length: 20 }).references(() => companies.id),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 30 }),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const deals = pgTable('deals', {
  id: varchar('id', { length: 20 }).primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  title: varchar('title', { length: 255 }).notNull(),
  currentAccountId: varchar('current_account_id', { length: 20 }).references(
    () => currentAccounts.id,
  ),
  stage: varchar('stage', { length: 30 }).notNull().default('lead'),
  value: numeric('value', { precision: 15, scale: 2 }),
  owner: varchar('owner', { length: 255 }),
  closeDate: date('close_date'),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const tasks = pgTable(
  'tasks',
  {
    id: varchar('id', { length: 20 }).primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id),
    title: varchar('title', { length: 255 }).notNull(),
    related: varchar('related', { length: 255 }),
    relatedType: varchar('related_type', { length: 30 }),
    relatedId: varchar('related_id', { length: 20 }),
    due: date('due'),
    priority: varchar('priority', { length: 20 }).notNull().default('medium'),
    done: boolean('done').notNull().default(false),
    doneAt: timestamp('done_at'),
    owner: varchar('owner', { length: 255 }),
    assignedTo: uuid('assigned_to').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    byDone: index('task_done_idx').on(table.done, table.due),
  }),
)

export const quotations = pgTable('quotations', {
  id: varchar('id', { length: 30 }).primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  currentAccountId: varchar('current_account_id', { length: 20 }).references(
    () => currentAccounts.id,
  ),
  customer: varchar('customer', { length: 255 }).notNull(),
  date: date('date').notNull(),
  validUntil: date('valid_until').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  note: text('note'),
  convertedToInvoiceId: varchar('converted_to_invoice_id', { length: 30 }),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const quotationLines = pgTable('quotation_lines', {
  id: uuid('id').defaultRandom().primaryKey(),
  quotationId: varchar('quotation_id', { length: 30 })
    .notNull()
    .references(() => quotations.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 20 }).references(() => products.id),
  product: varchar('product', { length: 255 }).notNull(),
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 15, scale: 2 }).notNull(),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).notNull().default('18'),
  lineOrder: integer('line_order').notNull().default(0),
})

export const invoices = pgTable(
  'invoices',
  {
    id: varchar('id', { length: 30 }).primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id),
    currentAccountId: varchar('current_account_id', { length: 20 }).references(
      () => currentAccounts.id,
    ),
    customer: varchar('customer', { length: 255 }).notNull(),
    issueDate: date('issue_date').notNull(),
    dueDate: date('due_date').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('draft'),
    note: text('note'),
    relatedQuotationId: varchar('related_quotation_id', { length: 30 }).references(
      () => quotations.id,
    ),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    byStatus: index('inv_status_idx').on(table.status),
    byDueDate: index('inv_due_idx').on(table.dueDate),
    byAccountDate: index('inv_acc_date_idx').on(table.currentAccountId, table.issueDate),
  }),
)

export const invoiceLines = pgTable('invoice_lines', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: varchar('invoice_id', { length: 30 })
    .notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 20 }).references(() => products.id),
  product: varchar('product', { length: 255 }).notNull(),
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 15, scale: 2 }).notNull(),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).notNull().default('18'),
  lineOrder: integer('line_order').notNull().default(0),
})

export const purchaseOrders = pgTable('purchase_orders', {
  id: varchar('id', { length: 30 }).primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  currentAccountId: varchar('current_account_id', { length: 20 }).references(
    () => currentAccounts.id,
  ),
  supplier: varchar('supplier', { length: 255 }).notNull(),
  orderDate: date('order_date').notNull(),
  expectedDate: date('expected_date'),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  note: text('note'),
  warehouseId: varchar('warehouse_id', { length: 20 }).references(() => warehouses.id),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const purchaseOrderLines = pgTable('purchase_order_lines', {
  id: uuid('id').defaultRandom().primaryKey(),
  purchaseOrderId: varchar('purchase_order_id', { length: 30 })
    .notNull()
    .references(() => purchaseOrders.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 20 }).references(() => products.id),
  product: varchar('product', { length: 255 }).notNull(),
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 15, scale: 2 }).notNull(),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).notNull().default('18'),
  receivedQty: numeric('received_qty', { precision: 15, scale: 3 }).default('0'),
  lineOrder: integer('line_order').notNull().default(0),
})

export const financeAccounts = pgTable('finance_accounts', {
  id: varchar('id', { length: 20 }).primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  bankName: varchar('bank_name', { length: 100 }),
  iban: varchar('iban', { length: 34 }),
  currency: varchar('currency', { length: 3 }).notNull().default('TRY'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const transactions = pgTable(
  'transactions',
  {
    id: varchar('id', { length: 20 }).primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id),
    date: date('date').notNull(),
    description: varchar('description', { length: 500 }).notNull(),
    category: varchar('category', { length: 100 }),
    financeAccountId: varchar('finance_account_id', { length: 20 })
      .notNull()
      .references(() => financeAccounts.id),
    type: varchar('type', { length: 20 }).notNull(),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    relatedDocType: varchar('related_doc_type', { length: 30 }),
    relatedDocId: varchar('related_doc_id', { length: 30 }),
    currentAccountId: varchar('current_account_id', { length: 20 }).references(
      () => currentAccounts.id,
    ),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    byAccount: index('trx_account_idx').on(table.financeAccountId),
    byDate: index('trx_date_idx').on(table.date),
  }),
)
