import bcrypt from 'bcryptjs'
import { db } from '../../infrastructure/database/client'
import { usuarios } from '../../infrastructure/database/schema'
import { eq } from 'drizzle-orm'
import { sign } from 'hono/jwt'
import { HTTPException } from 'hono/http-exception'
import { env } from '../../config/env'
import type { LoginDTO, RegisterDTO, CreateUsuarioDTO, UpdateUsuarioDTO } from './auth.schema'

// ── Tipo de permisos que se expone al frontend ─────────────────────────────
export interface Permisos {
  crearUsuarios:      boolean
  subirArchivos:      boolean
  modificarArchivos:  boolean
  eliminarArchivos:   boolean
  verOtrasDivisiones: boolean
}

// ── Perfil completo devuelto al cliente ────────────────────────────────────
export interface UsuarioPerfil {
  id: string
  nombre: string
  email: string
  rol: string
  division: string
  permisos: Permisos
}

function buildPermisos(u: typeof usuarios.$inferSelect): Permisos {
  // ADMIN siempre tiene todos los permisos independientemente de los flags
  const rolUpper = (u.rol || '').toUpperCase()
  const isAdmin = rolUpper === 'ADMIN' || rolUpper === 'ADMINISTRADOR'
  return {
    crearUsuarios:      isAdmin || u.crearUsuarios,
    subirArchivos:      isAdmin || u.subirArchivos,
    modificarArchivos:  isAdmin || u.modificarArchivos,
    eliminarArchivos:   isAdmin || u.eliminarArchivos,
    verOtrasDivisiones: isAdmin || u.verOtrasDivisiones,
  }
}

export class AuthService {
  async login(data: LoginDTO) {
    const [user] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.email, data.email))
      .limit(1)

    if (!user || !user.activo) {
      throw new HTTPException(401, { message: 'Credenciales inválidas' })
    }

    const passwordValid = await bcrypt.compare(data.password, user.passwordHash)
    if (!passwordValid) {
      throw new HTTPException(401, { message: 'Credenciales inválidas' })
    }

    const permisos = buildPermisos(user)

    const token = await sign(
      {
        sub: user.id,
        email: user.email,
        rol: user.rol,
        division: user.division,
        permisos,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60, // 8 horas
      },
      env.JWT_SECRET,
    )

    return {
      token,
      usuario: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        division: user.division,
        permisos,
      } satisfies UsuarioPerfil,
    }
  }

  async register(data: RegisterDTO) {
    const [existing] = await db
      .select({ id: usuarios.id })
      .from(usuarios)
      .where(eq(usuarios.email, data.email))
      .limit(1)

    if (existing) {
      throw new HTTPException(409, { message: 'El email ya está registrado' })
    }

    const passwordHash = await bcrypt.hash(data.password, 10)

    const [newUser] = await db
      .insert(usuarios)
      .values({
        nombre: data.nombre,
        email: data.email,
        passwordHash,
        rol: data.rol,
        division: data.division,
        crearUsuarios:      data.crearUsuarios,
        subirArchivos:      data.subirArchivos,
        modificarArchivos:  data.modificarArchivos,
        eliminarArchivos:   data.eliminarArchivos,
        verOtrasDivisiones: data.verOtrasDivisiones,
      })
      .returning()

    return {
      id: newUser!.id,
      nombre: newUser!.nombre,
      email: newUser!.email,
      rol: newUser!.rol,
      division: newUser!.division,
      permisos: buildPermisos(newUser!),
    }
  }

  /**
   * Crea un usuario desde el modal del frontend.
   * El email se construye como username@itse.edu.mx si no incluye @.
   */
  async createUsuario(data: CreateUsuarioDTO) {
    const email = data.username.includes('@')
      ? data.username
      : `${data.username}@itse.edu.mx`

    const [existing] = await db
      .select({ id: usuarios.id })
      .from(usuarios)
      .where(eq(usuarios.email, email))
      .limit(1)

    if (existing) {
      throw new HTTPException(409, { message: 'El usuario ya existe' })
    }

    const passwordHash = await bcrypt.hash(data.password, 10)

    // Normalizar el rol del string del frontend
    let rol: 'ADMIN' | 'ARCHIVISTA' | 'CONSULTA' = 'CONSULTA'
    const inputRol = (data.rol || '').toUpperCase()
    if (inputRol.includes('ADMIN')) {
      rol = 'ADMIN'
    } else if (inputRol.includes('GESTOR') || inputRol.includes('ARCHIVISTA')) {
      rol = 'ARCHIVISTA'
    } else {
      rol = 'CONSULTA'
    }

    const [newUser] = await db
      .insert(usuarios)
      .values({
        nombre: data.nombre,
        email,
        passwordHash,
        rol,
        division: data.division,
        crearUsuarios:      data.crearUsuarios,
        subirArchivos:      data.subirArchivos,
        modificarArchivos:  data.modificarArchivos,
        eliminarArchivos:   data.eliminarArchivos,
        verOtrasDivisiones: data.verOtrasDivisiones,
      })
      .returning()

    return {
      id: newUser!.id,
      nombre: newUser!.nombre,
      email: newUser!.email,
      rol: newUser!.rol,
      division: newUser!.division,
      permisos: buildPermisos(newUser!),
    }
  }

  async me(userId: string) {
    const [user] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.id, userId))
      .limit(1)

    if (!user) {
      throw new HTTPException(404, { message: 'Usuario no encontrado' })
    }

    return {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      division: user.division,
      creadoEn: user.creadoEn,
      permisos: buildPermisos(user),
    } satisfies UsuarioPerfil & { creadoEn: Date }
  }
  async updateUsuario(id: string, data: UpdateUsuarioDTO) {
    const [existing] = await db
      .select({ id: usuarios.id })
      .from(usuarios)
      .where(eq(usuarios.id, id))
      .limit(1)

    if (!existing) {
      throw new HTTPException(404, { message: 'Usuario no encontrado' })
    }

    // Construir sólo los campos presentes en el payload
    const patch: Record<string, unknown> = {}
    if (data.nombre             !== undefined) patch.nombre            = data.nombre
    if (data.division           !== undefined) patch.division          = data.division
    if (data.rol !== undefined) {
      let r: 'ADMIN' | 'ARCHIVISTA' | 'CONSULTA' = 'CONSULTA'
      const inputRol = (data.rol || '').toUpperCase()
      if (inputRol.includes('ADMIN')) {
        r = 'ADMIN'
      } else if (inputRol.includes('GESTOR') || inputRol.includes('ARCHIVISTA')) {
        r = 'ARCHIVISTA'
      } else {
        r = 'CONSULTA'
      }
      patch.rol = r
    }
    if (data.crearUsuarios      !== undefined) patch.crearUsuarios     = data.crearUsuarios
    if (data.subirArchivos      !== undefined) patch.subirArchivos     = data.subirArchivos
    if (data.modificarArchivos  !== undefined) patch.modificarArchivos = data.modificarArchivos
    if (data.eliminarArchivos   !== undefined) patch.eliminarArchivos  = data.eliminarArchivos
    if (data.verOtrasDivisiones !== undefined) patch.verOtrasDivisiones = data.verOtrasDivisiones

    // Hash de la nueva contraseña si se provee
    if (data.nuevaPassword) {
      patch.passwordHash = await bcrypt.hash(data.nuevaPassword, 10)
    }

    if (Object.keys(patch).length === 0) {
      throw new HTTPException(400, { message: 'No se proporcionaron campos para actualizar' })
    }

    patch.actualizadoEn = new Date()

    const [updated] = await db
      .update(usuarios)
      .set(patch as any)
      .where(eq(usuarios.id, id))
      .returning()

    return {
      id: updated!.id,
      nombre: updated!.nombre,
      email: updated!.email,
      rol: updated!.rol,
      division: updated!.division,
      permisos: buildPermisos(updated!),
    }
  }
}

export const authService = new AuthService()
