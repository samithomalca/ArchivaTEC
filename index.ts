import app from './src/app'
import { env } from './src/config/env'
import { initDatabase } from './src/infrastructure/database/migrate'
import { handle } from 'hono/vercel'

// Inicializar BD
try {
  await initDatabase()
} catch (e: any) {
  console.error('⚠️ Error BD:', e.message || e)
}

// ─── SOPORTE PARA BUN (LOCAL) ─────────────────────────────────────
if (typeof Bun !== 'undefined') {
  Bun.serve({
    port: env.PORT,
    fetch: app.fetch,
  })
  console.log(`✅ Servidor Bun corriendo en puerto ${env.PORT}`)
}

// ─── SOPORTE PARA VERCEL (NUBE) ───────────────────────────────────
export const GET = handle(app)
export const POST = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)
export const OPTIONS = handle(app)

export default handle(app)
