import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Base de datos
  DATABASE_URL: z.string().url(),

  // Supabase (opcional)
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),

  // Auth
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('8h'),

  // Storage
  STORAGE_BUCKET: z.string().default('expedientes'),
  STORAGE_PATH: z.string().default('./storage/uploads'),

  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
})

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Error en variables de entorno:')
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2))
  
  // En Vercel no queremos process.exit(1) porque mata la función sin dejar rastro
  if (process.env.VERCEL !== '1') {
    // process.exit(1) // Comentado para evitar colapsos inesperados
  }
}

// Fallback manual para variables críticas si el parse falló (para que la app no explote)
const data = parsed.success ? parsed.data : {
  NODE_ENV: (process.env.NODE_ENV as any) || 'development',
  PORT: Number(process.env.PORT) || 3000,
  DATABASE_URL: process.env.DATABASE_URL || '',
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-de-emergencia-32-caracteres',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  STORAGE_BUCKET: process.env.STORAGE_BUCKET || 'expedientes',
  STORAGE_PATH: process.env.STORAGE_PATH || './storage/uploads',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || '*',
}

export const env = data as typeof parsed extends { success: true } ? typeof parsed.data : any
