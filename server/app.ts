import { Hono } from 'hono'
import { compress } from 'hono/compress'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { authMiddleware } from './middleware/auth'
import { authRateLimit, rateLimitMiddleware } from './middleware/rate-limit'
import { authRoutes } from './routes/auth'
import { auditRoutes } from './routes/audit'
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
import { usersRoutes } from './routes/users'

export const app = new Hono().basePath('/api')

const appOrigin = process.env.APP_ORIGIN ?? 'http://localhost:3000'

app.use(
  '*',
  cors({
    origin: appOrigin,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token'],
  }),
)
app.use('*', compress())
app.use(
  '*',
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
  }),
)
app.use('*', rateLimitMiddleware)
app.use('*', logger())

app.use('/auth/login', authRateLimit)
app.route('/auth', authRoutes)

app.use('*', authMiddleware)
app.route('/audit-logs', auditRoutes)
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
app.route('/users', usersRoutes)

app.notFound((c) => c.json({ error: 'Not found' }, 404))

app.onError((error, c) => {
  console.error(error)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
