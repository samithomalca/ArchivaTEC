import { getAuthenticatedUser, normalizeProfileRow, supabaseAdmin } from '../lib/supabase.js'

function parseBody(req) {
  if (req.method !== 'POST' && req.method !== 'PATCH') {
    return Promise.resolve(null)
  }

  return new Promise((resolve, reject) => {
    const chunks = []

    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw) {
        resolve(null)
        return
      }

      try {
        resolve(JSON.parse(raw))
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function hasAdminAccess(profile) {
  return profile?.role?.toUpperCase().includes('ADMIN') || Boolean(profile?.crear_usuarios)
}

export default async function handler(req, res) {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '').trim()
    const user = await getAuthenticatedUser(accessToken)

    const { data: callerProfile, error: callerProfileError } = await supabaseAdmin
      .from('profiles')
      .select('role, crear_usuarios, subir_archivos, modificar_archivos, eliminar_archivos, ver_otras_divisiones')
      .eq('id', user.id)
      .single()

    if (callerProfileError || !callerProfile) {
      return res.status(401).json({ error: 'Perfil no encontrado' })
    }

    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, username, display_name, division, role, crear_usuarios, subir_archivos, modificar_archivos, eliminar_archivos, ver_otras_divisiones')
        .order('created_at', { ascending: true })

      if (error) {
        throw error
      }

      return res.status(200).json({
        data: (data || []).map((row) => ({
          id: row.id,
          username: row.username,
          nombre: row.display_name,
          division: row.division,
          rol: row.role,
          permisos: normalizeProfileRow(row).permisos,
        })),
      })
    }

    if (!hasAdminAccess(callerProfile)) {
      return res.status(403).json({ error: 'No tienes permiso para crear usuarios' })
    }

    if (req.method === 'POST') {
      const body = await parseBody(req)
      if (!body) {
        return res.status(400).json({ error: 'Cuerpo vacío' })
      }

      const username = String(body.username || '').trim()
      const password = String(body.password || '').trim()
      const nombre = String(body.nombre || '').trim()
      const division = String(body.division || '').trim()
      const rol = String(body.rol || 'Usuario de Consulta').trim()

      if (!username || !password || !nombre) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' })
      }

      const email = username.includes('@') ? username : `${username}@itse.edu.mx`

      const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

      if (createError) {
        if (createError.message?.toLowerCase().includes('already')) {
          return res.status(409).json({ error: 'Ese usuario ya existe' })
        }
        throw createError
      }

      const { error: insertError } = await supabaseAdmin.from('profiles').insert({
        id: createdUser.user.id,
        username,
        display_name: nombre,
        division,
        role: rol,
        crear_usuarios: Boolean(body.crearUsuarios),
        subir_archivos: Boolean(body.subirArchivos),
        modificar_archivos: Boolean(body.modificarArchivos),
        eliminar_archivos: Boolean(body.eliminarArchivos),
        ver_otras_divisiones: Boolean(body.verOtrasDivisiones),
      })

      if (insertError) {
        throw insertError
      }

      return res.status(201).json({
        data: {
          id: createdUser.user.id,
          username,
          nombre,
          division,
          rol,
          permisos: {
            crearUsuarios: Boolean(body.crearUsuarios),
            subirArchivos: Boolean(body.subirArchivos),
            modificarArchivos: Boolean(body.modificarArchivos),
            eliminarArchivos: Boolean(body.eliminarArchivos),
            verOtrasDivisiones: Boolean(body.verOtrasDivisiones),
          },
        },
      })
    }

    return res.status(405).json({ error: 'Método no permitido' })
  } catch (error) {
    if (error.message === 'No autorizado' || error.message === 'Token de autorización requerido') {
      return res.status(401).json({ error: error.message })
    }

    return res.status(500).json({
      error: error.message || 'Error interno al administrar usuarios',
    })
  }
}
