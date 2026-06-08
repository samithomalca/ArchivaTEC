import { handle } from 'hono/vercel'
import app from '../src/app'

export const config = {
  runtime: 'nodejs'
}

// Manejador de errores para Vercel
app.onError((err, c) => {
  console.error('🔴 VERCEL ERROR:', err)
  return c.json({
    success: false,
    error: 'Error interno en Vercel',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  }, 500)
})

export default handle(app)
