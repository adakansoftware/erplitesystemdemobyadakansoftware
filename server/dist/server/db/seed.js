"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("./client");
const schema_1 = require("./schema");
const auth_1 = require("../lib/auth");
const accounts_1 = require("../../lib/data/accounts");
const crm_1 = require("../../lib/data/crm");
const finance_1 = require("../../lib/data/finance");
const inventory_1 = require("../../lib/data/inventory");
const invoices_1 = require("../../lib/data/invoices");
const products_1 = require("../../lib/data/products");
const purchases_1 = require("../../lib/data/purchases");
const quotations_1 = require("../../lib/data/quotations");
const drizzle_orm_1 = require("drizzle-orm");
async function main() {
    await client_1.db.execute((0, drizzle_orm_1.sql) `truncate table
    transactions,
    finance_accounts,
    purchase_order_lines,
    purchase_orders,
    invoice_lines,
    invoices,
    quotation_lines,
    quotations,
    tasks,
    deals,
    contacts,
    companies,
    leads,
    stock_movements,
    warehouses,
    products,
    product_categories,
    current_accounts,
    company_settings,
    users
    restart identity cascade`);
    const categoryMap = new Map();
    for (const category of products_1.productCategories) {
        const [row] = await client_1.db
            .insert(schema_1.productCategories)
            .values({ name: category })
            .returning();
        categoryMap.set(category, row.id);
    }
    const [adminUser] = await client_1.db
        .insert(schema_1.users)
        .values({
        email: 'admin@demo.com',
        passwordHash: (0, auth_1.hashPassword)('demo123'),
        name: 'Mehmet Adakan',
        role: 'admin',
    })
        .returning();
    await client_1.db.insert(schema_1.companySettings).values({
        id: 1,
        name: 'Adakan Endustriyel Cozumler Ltd. Sti.',
        taxNumber: '1234567890',
        taxOffice: 'Ikitelli',
        address: 'Ikitelli OSB Mah. Demirciler Cad. No:18 Basaksehir / Istanbul',
        city: 'Istanbul',
        phone: '0212 555 00 55',
        email: 'info@adakan.com.tr',
        website: 'www.adakan.com.tr',
        logoUrl: 'https://dummyimage.com/160x48/e9eef8/1f3b63&text=Adakan+ERP',
        currency: 'TRY',
    });
    await client_1.db.insert(schema_1.currentAccounts).values(accounts_1.currentAccounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        taxNumber: account.taxNumber,
        city: account.city,
        phone: account.phone,
        email: account.email,
        creditLimit: String(account.creditLimit),
    })));
    await client_1.db.insert(schema_1.products).values(products_1.products.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        categoryId: categoryMap.get(product.category),
        brand: product.brand,
        unit: product.unit,
        costPrice: String(product.costPrice),
        salePrice: String(product.salePrice),
        taxRate: String(product.taxRate),
        reorderPoint: product.reorderPoint,
        status: product.status,
        description: product.description,
        createdAt: new Date(product.createdAt),
        updatedAt: new Date(product.createdAt),
    })));
    await client_1.db.insert(schema_1.warehouses).values(inventory_1.warehouses);
    await client_1.db.insert(schema_1.stockMovements).values(products_1.products
        .map((product) => {
        const netRecentMovements = inventory_1.stockMovements
            .filter((movement) => movement.productId === product.id)
            .reduce((sum, movement) => {
            const qty = Math.abs(movement.qty);
            return sum + (movement.type === 'out' ? -qty : qty);
        }, 0);
        const openingQty = Math.max(product.stock - netRecentMovements, 0);
        return {
            productId: product.id,
            warehouseId: 'WH-01',
            type: 'adjustment',
            qty: String(openingQty),
            unitCost: String(product.costPrice),
            relatedDocType: 'opening_balance',
            relatedDocId: product.id,
            note: 'Acilis stok bakiyesi',
            createdBy: adminUser.id,
            createdAt: new Date(`${product.createdAt}T08:00:00.000Z`),
        };
    })
        .filter((movement) => Number(movement.qty) > 0));
    await client_1.db.insert(schema_1.stockMovements).values(inventory_1.stockMovements.map((movement) => ({
        productId: movement.productId,
        warehouseId: movement.warehouseId,
        type: movement.type,
        qty: String(Math.abs(movement.qty)),
        relatedDocType: movement.relatedDoc?.startsWith('FT-')
            ? 'invoice'
            : movement.relatedDoc?.startsWith('ALIS-')
                ? 'purchase_order'
                : movement.relatedDoc?.startsWith('TRF-')
                    ? 'transfer'
                    : movement.relatedDoc?.startsWith('SAYIM-')
                        ? 'adjustment'
                        : undefined,
        relatedDocId: movement.relatedDoc,
        note: movement.note,
        createdBy: adminUser.id,
        createdAt: new Date(`${movement.date}T10:00:00.000Z`),
    })));
    await client_1.db.insert(schema_1.leads).values(crm_1.leads.map((lead) => ({
        ...lead,
        value: String(lead.value),
        createdAt: new Date(lead.createdAt),
        updatedAt: new Date(lead.createdAt),
    })));
    await client_1.db.insert(schema_1.companies).values(crm_1.companies);
    await client_1.db.insert(schema_1.contacts).values(crm_1.contacts.map((contact) => {
        const company = crm_1.companies.find((item) => item.name === contact.company);
        return { ...contact, companyId: company?.id };
    }));
    await client_1.db.insert(schema_1.deals).values(crm_1.deals.map((deal) => {
        const account = accounts_1.currentAccounts.find((item) => item.name === deal.customer);
        return { ...deal, currentAccountId: account?.id, value: String(deal.value) };
    }));
    await client_1.db.insert(schema_1.tasks).values(crm_1.tasks);
    await client_1.db.insert(schema_1.financeAccounts).values(finance_1.financeAccounts);
    await client_1.db.insert(schema_1.transactions).values(finance_1.transactions.map((transaction) => {
        const account = finance_1.financeAccounts.find((item) => item.name === transaction.account);
        const currentAccount = accounts_1.currentAccounts.find((item) => transaction.description.includes(item.name.split(' ')[0]));
        return {
            id: transaction.id,
            date: transaction.date,
            description: transaction.description,
            category: transaction.category,
            financeAccountId: account?.id ?? finance_1.financeAccounts[0].id,
            type: transaction.type,
            amount: String(transaction.amount),
            currentAccountId: currentAccount?.id,
        };
    }));
    for (const quotation of quotations_1.quotations) {
        const account = accounts_1.currentAccounts.find((item) => item.name === quotation.customer);
        await client_1.db.insert(schema_1.quotations).values({
            id: quotation.id,
            currentAccountId: account?.id,
            customer: quotation.customer,
            date: quotation.date,
            validUntil: quotation.validUntil,
            status: quotation.status,
            note: quotation.note,
        });
        await client_1.db.insert(schema_1.quotationLines).values(quotation.lines.map((line, index) => ({
            quotationId: quotation.id,
            productId: products_1.products.find((item) => item.name === line.product)?.id,
            product: line.product,
            quantity: String(line.quantity),
            unitPrice: String(line.unitPrice),
            taxRate: String(line.taxRate),
            lineOrder: index,
        })));
    }
    for (const invoice of invoices_1.invoices) {
        const account = accounts_1.currentAccounts.find((item) => item.name === invoice.customer);
        await client_1.db.insert(schema_1.invoices).values({
            id: invoice.id,
            currentAccountId: account?.id,
            customer: invoice.customer,
            issueDate: invoice.issueDate,
            dueDate: invoice.dueDate,
            status: invoice.status,
            note: invoice.note,
            relatedQuotationId: invoice.relatedQuotation,
        });
        await client_1.db.insert(schema_1.invoiceLines).values(invoice.lines.map((line, index) => ({
            invoiceId: invoice.id,
            productId: products_1.products.find((item) => item.name === line.product)?.id,
            product: line.product,
            quantity: String(line.quantity),
            unitPrice: String(line.unitPrice),
            taxRate: String(line.taxRate),
            lineOrder: index,
        })));
    }
    for (const purchase of purchases_1.purchases) {
        const account = accounts_1.currentAccounts.find((item) => item.name === purchase.supplier);
        await client_1.db.insert(schema_1.purchaseOrders).values({
            id: purchase.id,
            currentAccountId: account?.id,
            supplier: purchase.supplier,
            orderDate: purchase.orderDate,
            expectedDate: purchase.expectedDate,
            status: purchase.status,
            note: purchase.note,
            warehouseId: inventory_1.warehouses[0].id,
        });
        await client_1.db.insert(schema_1.purchaseOrderLines).values(purchase.lines.map((line, index) => ({
            purchaseOrderId: purchase.id,
            productId: products_1.products.find((item) => item.name === line.product)?.id,
            product: line.product,
            quantity: String(line.qty),
            unitPrice: String(line.unitPrice),
            taxRate: String(line.taxRate),
            receivedQty: String(purchase.status === 'received' ? line.qty : 0),
            lineOrder: index,
        })));
    }
    console.log('Seed tamamlandi');
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}).finally(async () => {
    await client_1.sql.end({ timeout: 5 });
});
