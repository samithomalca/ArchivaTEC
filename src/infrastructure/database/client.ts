import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../../config/env'
import * as schema from './schema'

function createDb() {
  // En Vercel/Node.js, el pooler a veces da problemas si max es > 1 en serverless
  const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
  
  const queryClient = postgres(env.DATABASE_URL, {
    max: isVercel ? 1 : 10,
    idle_timeout: 20,
    connect_timeout: 30, // Aumentamos timeout por latencia de red
    ssl: 'require',     // Forzamos SSL para Supabase
  })
  
  return drizzle(queryClient, { schema })
}

export const db = createDb()
export type DB = typeof db
