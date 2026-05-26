import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../../config/env'
import * as schema from './schema'

function createDb() {
  console.log('🗄️  Conectando a base de datos PostgreSQL (Supabase)')
  
  // Conexión única con postgres-js para todos los entornos
  const queryClient = postgres(env.DATABASE_URL, {
    max: env.NODE_ENV === 'production' ? 1 : 10,
    idle_timeout: 20,
    connect_timeout: 10,
  })
  
  return drizzle(queryClient, { schema })
}

export const db = createDb()
export type DB = typeof db
