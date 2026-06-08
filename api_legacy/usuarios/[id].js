import { getAuthenticatedUser, normalizeProfileRow, supabaseAdmin } from '../lib/supabase.js'

function parseBody(req) {
  if (req.method !== 'PATCH') {
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

    if (!hasAdminAccess(callerProfile)) {
      return res.status(403).json({ error: 'No tienes permiso para editar usuarios' })
    }

    const { id } = req.query

    if (req.method === 'PATCH') {
      const body = await parseBody(req)
      if (!body) {
        return res.status(400).json({ error: 'Cuerpo vacío' })
      }

      const patch = {}
      if (body.nombre) patch.display_name = body.nombre
      if (body.division !== undefined) patch.division = body.division
      if (body.rol) patch.role = body.rol
      if (body.crearUsuarios !== undefined) patch.crear_usuarios = Boolean(body.crearUsuarios)
      if (body.subirArchivos !== undefined) patch.subir_archivos = Boolean(body.subirArchivos)
      if (body.modificarArchivos !== undefined) patch.modificar_archivos = Boolean(body.modificarArchivos)
      if (body.eliminarArchivos !== undefined) patch.eliminar_archivos = Boolean(body.eliminarArchivos)
      if (body.verOtrasDivisiones !== undefined) patch.ver_otras_divisiones = Boolean(body.verOtrasDivisiones)
      patch.updated_at = new Date().toISOString()

      if (body.nuevaPassword) {
        const { error: updatePasswordError } = await supabaseAdmin.auth.admin.updateUserById(id, {
          password: body.nuevaPassword,
        })

        if (updatePasswordError) {
          throw updatePasswordError
        }
      }

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(patch)
        .eq('id', id)
        .select('id, username, display_name, division, role, crear_usuarios, subir_archivos, modificar_archivos, eliminar_archivos, ver_otras_divisiones')
        .single()

      if (error) {
        throw error
      }

      return res.status(200).json({
        data: {
          id: data.id,
          username: data.username,
          nombre: data.display_name,
          division: data.division,
          rol: data.role,
          permisos: normalizeProfileRow(data).permisos,
        },
      })
    }

    if (req.method === 'DELETE') {
      const { error: deleteProfileError } = await supabaseAdmin.from('profiles').delete().eq('id', id)
      if (deleteProfileError) {
        throw deleteProfileError
      }

      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(id)
      if (deleteAuthError) {
        throw deleteAuthError
      }

      return res.status(200).json({ message: 'Usuario eliminado' })
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
