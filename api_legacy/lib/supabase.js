import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL no está configurada')
}

if (!supabaseAnonKey) {
  throw new Error('SUPABASE_ANON_KEY no está configurada')
}

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_KEY no está configurada')
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

export async function getAuthenticatedUser(accessToken) {
  if (!accessToken) {
    throw new Error('Token de autorización requerido')
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('No autorizado')
  }

  const data = await response.json()
  return data
}

export function normalizeProfileRow(row) {
  const isAdmin = String(row?.role || '').toUpperCase().includes('ADMIN')

  const permisos = isAdmin
    ? {
        crearUsuarios: true,
        subirArchivos: true,
        modificarArchivos: true,
        eliminarArchivos: true,
        verOtrasDivisiones: true,
      }
    : {
        crearUsuarios: Boolean(row?.crear_usuarios),
        subirArchivos: Boolean(row?.subir_archivos),
        modificarArchivos: Boolean(row?.modificar_archivos),
        eliminarArchivos: Boolean(row?.eliminar_archivos),
        verOtrasDivisiones: Boolean(row?.ver_otras_divisiones),
      }

  return {
    id: row?.id,
    username: row?.username || '',
    nombre: row?.display_name || '',
    division: row?.division || '',
    rol: row?.role || 'Usuario de Consulta',
    permisos,
  }
}
