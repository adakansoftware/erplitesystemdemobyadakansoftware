"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactions = exports.financeAccounts = exports.purchaseOrderLines = exports.purchaseOrders = exports.invoiceLines = exports.invoices = exports.quotationLines = exports.quotations = exports.tasks = exports.deals = exports.contacts = exports.companies = exports.leads = exports.stockMovements = exports.warehouses = exports.products = exports.productCategories = exports.currentAccounts = exports.companySettings = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    passwordHash: (0, pg_core_1.varchar)('password_hash', { length: 255 }).notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    role: (0, pg_core_1.varchar)('role', { length: 50 }).notNull().default('staff'),
    active: (0, pg_core_1.boolean)('active').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.companySettings = (0, pg_core_1.pgTable)('company_settings', {
    id: (0, pg_core_1.integer)('id').primaryKey().default(1),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull().default(''),
    taxNumber: (0, pg_core_1.varchar)('tax_number', { length: 20 }),
    taxOffice: (0, pg_core_1.varchar)('tax_office', { length: 100 }),
    address: (0, pg_core_1.text)('address'),
    city: (0, pg_core_1.varchar)('city', { length: 100 }),
    phone: (0, pg_core_1.varchar)('phone', { length: 30 }),
    email: (0, pg_core_1.varchar)('email', { length: 255 }),
    website: (0, pg_core_1.varchar)('website', { length: 255 }),
    logoUrl: (0, pg_core_1.varchar)('logo_url', { length: 500 }),
    currency: (0, pg_core_1.varchar)('currency', { length: 3 }).notNull().default('TRY'),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.currentAccounts = (0, pg_core_1.pgTable)('current_accounts', {
    id: (0, pg_core_1.varchar)('id', { length: 20 }).primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    type: (0, pg_core_1.varchar)('type', { length: 20 }).notNull(),
    taxNumber: (0, pg_core_1.varchar)('tax_number', { length: 20 }),
    taxOffice: (0, pg_core_1.varchar)('tax_office', { length: 100 }),
    address: (0, pg_core_1.text)('address'),
    city: (0, pg_core_1.varchar)('city', { length: 100 }),
    phone: (0, pg_core_1.varchar)('phone', { length: 30 }),
    email: (0, pg_core_1.varchar)('email', { length: 255 }),
    creditLimit: (0, pg_core_1.numeric)('credit_limit', { precision: 15, scale: 2 }).default('0'),
    active: (0, pg_core_1.boolean)('active').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.productCategories = (0, pg_core_1.pgTable)('product_categories', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 100 }).notNull().unique(),
});
exports.products = (0, pg_core_1.pgTable)('products', {
    id: (0, pg_core_1.varchar)('id', { length: 20 }).primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    sku: (0, pg_core_1.varchar)('sku', { length: 100 }).notNull().unique(),
    barcode: (0, pg_core_1.varchar)('barcode', { length: 50 }),
    categoryId: (0, pg_core_1.uuid)('category_id').references(() => exports.productCategories.id),
    brand: (0, pg_core_1.varchar)('brand', { length: 100 }),
    unit: (0, pg_core_1.varchar)('unit', { length: 30 }).notNull().default('Adet'),
    costPrice: (0, pg_core_1.numeric)('cost_price', { precision: 15, scale: 2 }).notNull().default('0'),
    salePrice: (0, pg_core_1.numeric)('sale_price', { precision: 15, scale: 2 }).notNull().default('0'),
    taxRate: (0, pg_core_1.numeric)('tax_rate', { precision: 5, scale: 2 }).notNull().default('18'),
    reorderPoint: (0, pg_core_1.integer)('reorder_point').notNull().default(0),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).notNull().default('active'),
    description: (0, pg_core_1.text)('description'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.warehouses = (0, pg_core_1.pgTable)('warehouses', {
    id: (0, pg_core_1.varchar)('id', { length: 20 }).primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    location: (0, pg_core_1.varchar)('location', { length: 255 }),
    manager: (0, pg_core_1.varchar)('manager', { length: 255 }),
    capacity: (0, pg_core_1.integer)('capacity'),
    active: (0, pg_core_1.boolean)('active').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.stockMovements = (0, pg_core_1.pgTable)('stock_movements', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    productId: (0, pg_core_1.varchar)('product_id', { length: 20 }).notNull().references(() => exports.products.id),
    warehouseId: (0, pg_core_1.varchar)('warehouse_id', { length: 20 }).references(() => exports.warehouses.id),
    type: (0, pg_core_1.varchar)('type', { length: 20 }).notNull(),
    qty: (0, pg_core_1.numeric)('qty', { precision: 15, scale: 3 }).notNull(),
    unitCost: (0, pg_core_1.numeric)('unit_cost', { precision: 15, scale: 2 }),
    relatedDocType: (0, pg_core_1.varchar)('related_doc_type', { length: 30 }),
    relatedDocId: (0, pg_core_1.varchar)('related_doc_id', { length: 30 }),
    note: (0, pg_core_1.text)('note'),
    createdBy: (0, pg_core_1.uuid)('created_by').references(() => exports.users.id),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.leads = (0, pg_core_1.pgTable)('leads', {
    id: (0, pg_core_1.varchar)('id', { length: 20 }).primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    company: (0, pg_core_1.varchar)('company', { length: 255 }),
    source: (0, pg_core_1.varchar)('source', { length: 100 }),
    status: (0, pg_core_1.varchar)('status', { length: 30 }).notNull().default('new'),
    value: (0, pg_core_1.numeric)('value', { precision: 15, scale: 2 }),
    owner: (0, pg_core_1.varchar)('owner', { length: 255 }),
    phone: (0, pg_core_1.varchar)('phone', { length: 30 }),
    email: (0, pg_core_1.varchar)('email', { length: 255 }),
    note: (0, pg_core_1.text)('note'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.companies = (0, pg_core_1.pgTable)('companies', {
    id: (0, pg_core_1.varchar)('id', { length: 20 }).primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    sector: (0, pg_core_1.varchar)('sector', { length: 100 }),
    city: (0, pg_core_1.varchar)('city', { length: 100 }),
    phone: (0, pg_core_1.varchar)('phone', { length: 30 }),
    email: (0, pg_core_1.varchar)('email', { length: 255 }),
    website: (0, pg_core_1.varchar)('website', { length: 255 }),
    currentAccountId: (0, pg_core_1.varchar)('current_account_id', { length: 20 }).references(() => exports.currentAccounts.id),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.contacts = (0, pg_core_1.pgTable)('contacts', {
    id: (0, pg_core_1.varchar)('id', { length: 20 }).primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    title: (0, pg_core_1.varchar)('title', { length: 100 }),
    companyId: (0, pg_core_1.varchar)('company_id', { length: 20 }).references(() => exports.companies.id),
    email: (0, pg_core_1.varchar)('email', { length: 255 }),
    phone: (0, pg_core_1.varchar)('phone', { length: 30 }),
    note: (0, pg_core_1.text)('note'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.deals = (0, pg_core_1.pgTable)('deals', {
    id: (0, pg_core_1.varchar)('id', { length: 20 }).primaryKey(),
    title: (0, pg_core_1.varchar)('title', { length: 255 }).notNull(),
    currentAccountId: (0, pg_core_1.varchar)('current_account_id', { length: 20 }).references(() => exports.currentAccounts.id),
    stage: (0, pg_core_1.varchar)('stage', { length: 30 }).notNull().default('lead'),
    value: (0, pg_core_1.numeric)('value', { precision: 15, scale: 2 }),
    owner: (0, pg_core_1.varchar)('owner', { length: 255 }),
    closeDate: (0, pg_core_1.date)('close_date'),
    note: (0, pg_core_1.text)('note'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.tasks = (0, pg_core_1.pgTable)('tasks', {
    id: (0, pg_core_1.varchar)('id', { length: 20 }).primaryKey(),
    title: (0, pg_core_1.varchar)('title', { length: 255 }).notNull(),
    related: (0, pg_core_1.varchar)('related', { length: 255 }),
    relatedType: (0, pg_core_1.varchar)('related_type', { length: 30 }),
    relatedId: (0, pg_core_1.varchar)('related_id', { length: 20 }),
    due: (0, pg_core_1.date)('due'),
    priority: (0, pg_core_1.varchar)('priority', { length: 20 }).notNull().default('medium'),
    done: (0, pg_core_1.boolean)('done').notNull().default(false),
    doneAt: (0, pg_core_1.timestamp)('done_at'),
    owner: (0, pg_core_1.varchar)('owner', { length: 255 }),
    assignedTo: (0, pg_core_1.uuid)('assigned_to').references(() => exports.users.id),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.quotations = (0, pg_core_1.pgTable)('quotations', {
    id: (0, pg_core_1.varchar)('id', { length: 30 }).primaryKey(),
    currentAccountId: (0, pg_core_1.varchar)('current_account_id', { length: 20 }).references(() => exports.currentAccounts.id),
    customer: (0, pg_core_1.varchar)('customer', { length: 255 }).notNull(),
    date: (0, pg_core_1.date)('date').notNull(),
    validUntil: (0, pg_core_1.date)('valid_until').notNull(),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).notNull().default('draft'),
    note: (0, pg_core_1.text)('note'),
    convertedToInvoiceId: (0, pg_core_1.varchar)('converted_to_invoice_id', { length: 30 }),
    createdBy: (0, pg_core_1.uuid)('created_by').references(() => exports.users.id),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.quotationLines = (0, pg_core_1.pgTable)('quotation_lines', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    quotationId: (0, pg_core_1.varchar)('quotation_id', { length: 30 })
        .notNull()
        .references(() => exports.quotations.id, { onDelete: 'cascade' }),
    productId: (0, pg_core_1.varchar)('product_id', { length: 20 }).references(() => exports.products.id),
    product: (0, pg_core_1.varchar)('product', { length: 255 }).notNull(),
    quantity: (0, pg_core_1.numeric)('quantity', { precision: 15, scale: 3 }).notNull(),
    unitPrice: (0, pg_core_1.numeric)('unit_price', { precision: 15, scale: 2 }).notNull(),
    taxRate: (0, pg_core_1.numeric)('tax_rate', { precision: 5, scale: 2 }).notNull().default('18'),
    lineOrder: (0, pg_core_1.integer)('line_order').notNull().default(0),
});
exports.invoices = (0, pg_core_1.pgTable)('invoices', {
    id: (0, pg_core_1.varchar)('id', { length: 30 }).primaryKey(),
    currentAccountId: (0, pg_core_1.varchar)('current_account_id', { length: 20 }).references(() => exports.currentAccounts.id),
    customer: (0, pg_core_1.varchar)('customer', { length: 255 }).notNull(),
    issueDate: (0, pg_core_1.date)('issue_date').notNull(),
    dueDate: (0, pg_core_1.date)('due_date').notNull(),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).notNull().default('draft'),
    note: (0, pg_core_1.text)('note'),
    relatedQuotationId: (0, pg_core_1.varchar)('related_quotation_id', { length: 30 }).references(() => exports.quotations.id),
    createdBy: (0, pg_core_1.uuid)('created_by').references(() => exports.users.id),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.invoiceLines = (0, pg_core_1.pgTable)('invoice_lines', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    invoiceId: (0, pg_core_1.varchar)('invoice_id', { length: 30 })
        .notNull()
        .references(() => exports.invoices.id, { onDelete: 'cascade' }),
    productId: (0, pg_core_1.varchar)('product_id', { length: 20 }).references(() => exports.products.id),
    product: (0, pg_core_1.varchar)('product', { length: 255 }).notNull(),
    quantity: (0, pg_core_1.numeric)('quantity', { precision: 15, scale: 3 }).notNull(),
    unitPrice: (0, pg_core_1.numeric)('unit_price', { precision: 15, scale: 2 }).notNull(),
    taxRate: (0, pg_core_1.numeric)('tax_rate', { precision: 5, scale: 2 }).notNull().default('18'),
    lineOrder: (0, pg_core_1.integer)('line_order').notNull().default(0),
});
exports.purchaseOrders = (0, pg_core_1.pgTable)('purchase_orders', {
    id: (0, pg_core_1.varchar)('id', { length: 30 }).primaryKey(),
    currentAccountId: (0, pg_core_1.varchar)('current_account_id', { length: 20 }).references(() => exports.currentAccounts.id),
    supplier: (0, pg_core_1.varchar)('supplier', { length: 255 }).notNull(),
    orderDate: (0, pg_core_1.date)('order_date').notNull(),
    expectedDate: (0, pg_core_1.date)('expected_date'),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).notNull().default('draft'),
    note: (0, pg_core_1.text)('note'),
    warehouseId: (0, pg_core_1.varchar)('warehouse_id', { length: 20 }).references(() => exports.warehouses.id),
    createdBy: (0, pg_core_1.uuid)('created_by').references(() => exports.users.id),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.purchaseOrderLines = (0, pg_core_1.pgTable)('purchase_order_lines', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    purchaseOrderId: (0, pg_core_1.varchar)('purchase_order_id', { length: 30 })
        .notNull()
        .references(() => exports.purchaseOrders.id, { onDelete: 'cascade' }),
    productId: (0, pg_core_1.varchar)('product_id', { length: 20 }).references(() => exports.products.id),
    product: (0, pg_core_1.varchar)('product', { length: 255 }).notNull(),
    quantity: (0, pg_core_1.numeric)('quantity', { precision: 15, scale: 3 }).notNull(),
    unitPrice: (0, pg_core_1.numeric)('unit_price', { precision: 15, scale: 2 }).notNull(),
    taxRate: (0, pg_core_1.numeric)('tax_rate', { precision: 5, scale: 2 }).notNull().default('18'),
    receivedQty: (0, pg_core_1.numeric)('received_qty', { precision: 15, scale: 3 }).default('0'),
    lineOrder: (0, pg_core_1.integer)('line_order').notNull().default(0),
});
exports.financeAccounts = (0, pg_core_1.pgTable)('finance_accounts', {
    id: (0, pg_core_1.varchar)('id', { length: 20 }).primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    type: (0, pg_core_1.varchar)('type', { length: 20 }).notNull(),
    bankName: (0, pg_core_1.varchar)('bank_name', { length: 100 }),
    iban: (0, pg_core_1.varchar)('iban', { length: 34 }),
    currency: (0, pg_core_1.varchar)('currency', { length: 3 }).notNull().default('TRY'),
    active: (0, pg_core_1.boolean)('active').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.transactions = (0, pg_core_1.pgTable)('transactions', {
    id: (0, pg_core_1.varchar)('id', { length: 20 }).primaryKey(),
    date: (0, pg_core_1.date)('date').notNull(),
    description: (0, pg_core_1.varchar)('description', { length: 500 }).notNull(),
    category: (0, pg_core_1.varchar)('category', { length: 100 }),
    financeAccountId: (0, pg_core_1.varchar)('finance_account_id', { length: 20 })
        .notNull()
        .references(() => exports.financeAccounts.id),
    type: (0, pg_core_1.varchar)('type', { length: 20 }).notNull(),
    amount: (0, pg_core_1.numeric)('amount', { precision: 15, scale: 2 }).notNull(),
    relatedDocType: (0, pg_core_1.varchar)('related_doc_type', { length: 30 }),
    relatedDocId: (0, pg_core_1.varchar)('related_doc_id', { length: 30 }),
    currentAccountId: (0, pg_core_1.varchar)('current_account_id', { length: 20 }).references(() => exports.currentAccounts.id),
    createdBy: (0, pg_core_1.uuid)('created_by').references(() => exports.users.id),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
