import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { prettyJSON } from 'hono/pretty-json'
import { trimTrailingSlash } from 'hono/trailing-slash'
import { serveStatic } from 'hono/serve-static'
import { env } from './config/env'
import { errorHandler } from './middleware/errorHandler.middleware'
import { rateLimitMiddleware } from './middleware/rateLimit.middleware'
import { validateBody } from './middleware/validator.middleware'
import { authMiddleware } from './middleware/auth.middleware'
import { authService } from './modules/auth/auth.service'
import { CreateUsuarioSchema, type CreateUsuarioDTO } from './modules/auth/auth.schema'

// Módulos
import { authRoutes } from './modules/auth/auth.routes'
import { expedienteRoutes } from './modules/expedientes/expediente.routes'
import { ubicacionRoutes } from './modules/ubicaciones/ubicacion.routes'
import { cajaRoutes } from './modules/cajas/caja.routes'
import { prestamoRoutes } from './modules/prestamos/prestamo.routes'
import { digitalizacionRoutes } from './modules/digitalizacion/digitalizacion.routes'
import { usuariosRoutes } from './modules/usuarios/usuarios.routes'

const app = new Hono()

// ─── Middlewares Globales ─────────────────────────────────────────
app.use('*', logger())
app.use('*', secureHeaders())
app.use('*', cors({
  origin: env.ALLOWED_ORIGINS.split(','),
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))
app.use('*', prettyJSON())
app.use('*', trimTrailingSlash())
app.use('/api/*', rateLimitMiddleware)

// ─── Health Check ─────────────────────────────────────────────────
app.get('/health', (c) =>
  c.json({
    status: 'ok',
    service: 'Archivística AI-DLC API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  }),
)

// ─── Alias directo para el formulario ─────────────────────────────
app.post('/api/usuarios', authMiddleware, validateBody(CreateUsuarioSchema), async (c) => {
  const caller = c.get('user') as any
  const canCreate = caller?.rol === 'ADMIN' || caller?.permisos?.crearUsuarios === true

  if (!canCreate) {
    throw new HTTPException(403, { message: 'No tienes permiso para crear usuarios' })
  }

  const body = c.req.valid('json') as CreateUsuarioDTO
  const result = await authService.createUsuario(body)
  return c.json({ success: true, data: result }, 201)
})

// ─── API v1 ───────────────────────────────────────────────────────
app.get('/api/config', (c) => {
  return c.json({
    supabaseUrl: env.SUPABASE_URL,
    supabaseAnonKey: env.SUPABASE_ANON_KEY,
  })
})

const apiRoutes = new Hono()
apiRoutes.route('/auth', authRoutes)
apiRoutes.route('/usuarios', usuariosRoutes)
apiRoutes.route('/cajas', cajasRoutes)
apiRoutes.route('/ubicaciones', ubicacionesRoutes)
apiRoutes.route('/expedientes', expedientesRoutes)
apiRoutes.route('/prestamos', prestamosRoutes)
apiRoutes.route('/digitalizacion', digitalizacionRoutes)

// Montar en ambos para evitar 404s
app.route('/api', apiRoutes)
app.route('/api/v1', apiRoutes)


// ─── Frontend estático desde /public ─────────────────────────────
app.get('/', serveStatic({ path: './public/index.html' }))
app.use('/*', serveStatic({ root: './public' }))

// ─── Manejo de errores y rutas no encontradas ─────────────────────
app.onError(errorHandler)
app.notFound((c) => c.json({ success: false, error: 'Ruta no encontrada' }, 404))

export default app
