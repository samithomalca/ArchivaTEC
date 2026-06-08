import app from './src/app'
import { env } from './src/config/env'
import { initDatabase } from './src/infrastructure/database/migrate'

// ─── SOPORTE PARA BUN (LOCAL) ─────────────────────────────────────
if (typeof Bun !== 'undefined') {
  console.log('🚀 Iniciando en entorno Bun (Local)')
  
  // Inicializar BD asíncronamente
  initDatabase().catch(e => console.error('🔴 Error BD Local:', e))

  Bun.serve({
    port: env.PORT,
    fetch: app.fetch,
  })

  console.log(`✅ Servidor corriendo en http://localhost:${env.PORT}`)
}

// ─── EXPORT PARA VERCEL ──────────────────────────────────────────
export default app
