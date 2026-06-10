import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const RegisterSchema = z.object({
  nombre: z.string().min(2).max(200),
  email: z.string().email(),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(100),
  rol: z.enum(['ADMIN', 'ARCHIVISTA', 'CONSULTA', 'DIGITALIZADOR']).default('CONSULTA'),
  division: z.string().max(200).default(''),
  crearUsuarios:      z.boolean().default(false),
  subirArchivos:      z.boolean().default(true),
  modificarArchivos:  z.boolean().default(true),
  eliminarArchivos:   z.boolean().default(false),
  verOtrasDivisiones: z.boolean().default(false),
})

// Schema usado por el endpoint POST /usuarios (frontend modal)
export const CreateUsuarioSchema = z.object({
  nombre: z.string().min(2).max(200),
  username: z.string().min(2).max(100),
  password: z.string().min(6).max(100),
  rol: z.string().max(50).optional(),
  division: z.string().max(200).default(''),
  crearUsuarios:      z.boolean().default(false),
  subirArchivos:      z.boolean().default(true),
  modificarArchivos:  z.boolean().default(true),
  eliminarArchivos:   z.boolean().default(false),
  verOtrasDivisiones: z.boolean().default(false),
})

// Schema para PATCH /usuarios/:id (editar usuario existente)
export const UpdateUsuarioSchema = z.object({
  nombre:             z.string().min(2).max(200).optional(),
  division:           z.string().max(200).optional(),
  rol:                z.string().max(50).optional(),
  crearUsuarios:      z.boolean().optional(),
  subirArchivos:      z.boolean().optional(),
  modificarArchivos:  z.boolean().optional(),
  eliminarArchivos:   z.boolean().optional(),
  verOtrasDivisiones: z.boolean().optional(),
  nuevaPassword:      z.string().min(6, 'Mínimo 6 caracteres').max(100).optional(),
})

export type LoginDTO         = z.infer<typeof LoginSchema>
export type RegisterDTO      = z.infer<typeof RegisterSchema>
export type CreateUsuarioDTO = z.infer<typeof CreateUsuarioSchema>
export type UpdateUsuarioDTO = z.infer<typeof UpdateUsuarioSchema>
