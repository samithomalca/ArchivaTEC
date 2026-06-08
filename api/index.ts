import { handle } from 'hono/vercel'
import app from '../src/app'
import { initDatabase } from '../src/infrastructure/database/migrate'

export const config = {
  runtime: 'nodejs'
}

// Inicialización asíncrona (Vercel no permite await top-level fácilmente en serverless sin riesgo de timeout)
initDatabase().catch(err => console.error('🔴 DB INIT ERROR:', err))

// Manejador de errores para Vercel
app.onError((err, c) => {
  console.error('🔴 VERCEL ERROR:', err)
  return c.json({
    success: false,
    error: 'Error interno en Vercel',
    message: err.message,
    name: err.name,
    stack: err.stack, // Exponemos el stack temporalmente para depurar
    cause: err.cause
  }, 500)
})

export default handle(app)
