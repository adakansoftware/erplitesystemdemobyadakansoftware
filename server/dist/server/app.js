"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const hono_1 = require("hono");
const cors_1 = require("hono/cors");
const logger_1 = require("hono/logger");
const auth_1 = require("./middleware/auth");
const auth_2 = require("./routes/auth");
const crm_1 = require("./routes/crm");
const current_accounts_1 = require("./routes/current-accounts");
const finance_1 = require("./routes/finance");
const invoices_1 = require("./routes/invoices");
const products_1 = require("./routes/products");
const purchase_orders_1 = require("./routes/purchase-orders");
const quotations_1 = require("./routes/quotations");
const reports_1 = require("./routes/reports");
const settings_1 = require("./routes/settings");
const stock_1 = require("./routes/stock");
exports.app = new hono_1.Hono().basePath('/api');
const appOrigin = process.env.APP_ORIGIN ?? 'http://localhost:3000';
exports.app.use('*', (0, cors_1.cors)({
    origin: appOrigin,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
}));
exports.app.use('*', (0, logger_1.logger)());
exports.app.route('/auth', auth_2.authRoutes);
exports.app.use('*', auth_1.authMiddleware);
exports.app.route('/products', products_1.productsRoutes);
exports.app.route('/invoices', invoices_1.invoicesRoutes);
exports.app.route('/quotations', quotations_1.quotationsRoutes);
exports.app.route('/purchase-orders', purchase_orders_1.purchaseOrdersRoutes);
exports.app.route('/current-accounts', current_accounts_1.currentAccountsRoutes);
exports.app.route('/finance', finance_1.financeRoutes);
exports.app.route('/crm', crm_1.crmRoutes);
exports.app.route('/stock', stock_1.stockRoutes);
exports.app.route('/settings', settings_1.settingsRoutes);
exports.app.route('/reports', reports_1.reportsRoutes);
exports.app.notFound((c) => c.json({ error: 'Not found' }, 404));
exports.app.onError((error, c) => {
    console.error(error);
    return c.json({ error: 'Internal server error' }, 500);
});
