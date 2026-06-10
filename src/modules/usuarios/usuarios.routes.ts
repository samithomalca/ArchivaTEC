import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { eq } from 'drizzle-orm'
import { authService } from '../auth/auth.service'
import {
  CreateUsuarioSchema,
  UpdateUsuarioSchema,
  type CreateUsuarioDTO,
  type UpdateUsuarioDTO,
} from '../auth/auth.schema'
import { validateBody } from '../../middleware/validator.middleware'
import { authMiddleware } from '../../middleware/auth.middleware'
import { db } from '../../infrastructure/database/client'
import { usuarios } from '../../infrastructure/database/schema'

export const usuariosRoutes = new Hono()

function canManageUsers(user: any) {
  return user?.rol === 'ADMIN' || user?.permisos?.crearUsuarios === true
}

usuariosRoutes.post('/', authMiddleware, validateBody(CreateUsuarioSchema), async (c) => {
  const caller = c.get('user') as any
  if (!canManageUsers(caller)) {
    throw new HTTPException(403, { message: 'No tienes permiso para crear usuarios' })
  }

  const body = c.req.valid('json') as CreateUsuarioDTO
  const result = await authService.createUsuario(body)

  return c.json({ success: true, data: result }, 201)
})

usuariosRoutes.get('/', authMiddleware, async (c) => {
  const caller = c.get('user') as any
  if (!canManageUsers(caller)) {
    throw new HTTPException(403, { message: 'Acceso denegado' })
  }

  const lista = await db
    .select({
      id: usuarios.id,
      username: usuarios.email,
      nombre: usuarios.nombre,
      division: usuarios.division,
      rol: usuarios.rol,
      crearUsuarios: usuarios.crearUsuarios,
      subirArchivos: usuarios.subirArchivos,
      modificarArchivos: usuarios.modificarArchivos,
      eliminarArchivos: usuarios.eliminarArchivos,
      verOtrasDivisiones: usuarios.verOtrasDivisiones,
    })
    .from(usuarios)
    .orderBy(usuarios.creadoEn)

  const data = lista.map(u => ({
    id: u.id,
    username: u.username.split('@')[0],
    nombre: u.nombre,
    division: u.division,
    rol: u.rol,
    permisos: {
      crearUsuarios: u.crearUsuarios,
      subirArchivos: u.subirArchivos,
      modificarArchivos: u.modificarArchivos,
      eliminarArchivos: u.eliminarArchivos,
      verOtrasDivisiones: u.verOtrasDivisiones,
    },
  }))

  return c.json({ success: true, data })
})

usuariosRoutes.patch('/:id', authMiddleware, validateBody(UpdateUsuarioSchema), async (c) => {
  const caller = c.get('user') as any
  if (!canManageUsers(caller)) {
    throw new HTTPException(403, { message: 'No tienes permiso para editar usuarios' })
  }

  const id = c.req.param('id')
  const body = c.req.valid('json') as UpdateUsuarioDTO
  const result = await authService.updateUsuario(id, body)

  return c.json({ success: true, data: result })
})

usuariosRoutes.delete('/:id', authMiddleware, async (c) => {
  const caller = c.get('user') as any
  if (!canManageUsers(caller)) {
    throw new HTTPException(403, { message: 'No tienes permiso para eliminar usuarios' })
  }

  const id = c.req.param('id')
  const [deleted] = await db.delete(usuarios).where(eq(usuarios.id, id)).returning({ id: usuarios.id })

  if (!deleted) {
    throw new HTTPException(404, { message: 'Usuario no encontrado' })
  }

  return c.json({ success: true, message: 'Usuario eliminado' })
})
