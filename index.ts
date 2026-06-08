import app from './src/app'
import { env } from './src/config/env'
import { initDatabase } from './src/infrastructure/database/migrate'

console.log(`
╔══════════════════════════════════════════════╗
║   🏛️  Sistema de Archivística AI-DLC          ║
║   Runtime: Bun ${Bun.version}                       ║
║   Entorno: ${env.NODE_ENV}                    ║
╚══════════════════════════════════════════════╝
`)

// Inicializar BD (crea tablas y admin por defecto)
// Lo envolvemos en un try/catch para que el servidor inicie incluso si no hay conexión (modo demo)
try {
  await initDatabase()
} catch (e: any) {
  console.error('⚠️ No se pudo conectar a la base de datos:', e.message || e)
  console.error('El sistema iniciará en MODO DEMO (sin persistencia).')
}

Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
})

console.log(`✅ Servidor corriendo en http://localhost:${env.PORT}`)
console.log(`📋 Health check: http://localhost:${env.PORT}/health`)
console.log(`🔌 API base:     http://localhost:${env.PORT}/api/v1`)