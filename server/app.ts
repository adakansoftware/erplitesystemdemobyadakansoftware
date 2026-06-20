import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authMiddleware } from './middleware/auth'
import { authRoutes } from './routes/auth'
import { crmRoutes } from './routes/crm'
import { currentAccountsRoutes } from './routes/current-accounts'
import { financeRoutes } from './routes/finance'
import { invoicesRoutes } from './routes/invoices'
import { productsRoutes } from './routes/products'
import { purchaseOrdersRoutes } from './routes/purchase-orders'
import { quotationsRoutes } from './routes/quotations'
import { reportsRoutes } from './routes/reports'
import { settingsRoutes } from './routes/settings'
import { stockRoutes } from './routes/stock'

export const app = new Hono().basePath('/api')

app.use('*', cors({ origin: 'http://localhost:3000', credentials: true }))
app.use('*', logger())

app.route('/auth', authRoutes)

app.use('*', authMiddleware)
app.route('/products', productsRoutes)
app.route('/invoices', invoicesRoutes)
app.route('/quotations', quotationsRoutes)
app.route('/purchase-orders', purchaseOrdersRoutes)
app.route('/current-accounts', currentAccountsRoutes)
app.route('/finance', financeRoutes)
app.route('/crm', crmRoutes)
app.route('/stock', stockRoutes)
app.route('/settings', settingsRoutes)
app.route('/reports', reportsRoutes)
