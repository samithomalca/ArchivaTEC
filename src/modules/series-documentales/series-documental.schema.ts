import { z } from 'zod'

export const CategoriaSerieSchema = z.enum(['sustantivas', 'comunes'])

export const SerieDocumentalSchema = z.object({
  codigo: z
    .string()
    .min(1)
    .max(30)
    .regex(/^[A-Za-z0-9.\-]+$/, 'Solo letras, números, puntos y guiones'),
  nombre: z.string().min(1).max(200),
  categoria: CategoriaSerieSchema,
  codigoPadre: z.string().max(30).optional().nullable(),
  // No usa z.string().uuid(): los usuarios sembrados por defecto en
  // migrate.ts tienen IDs con formato UUID pero sin nibble de versión
  // válido (ej. "00000000-0000-0000-0000-000000000001"), que .uuid()
  // rechaza por no cumplir RFC4122 estricto. Se valida solo la forma.
  encargadoId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'ID de usuario inválido').optional().nullable(),
  fechaCreacion: z.coerce.date().optional(),
  fechaVencimiento: z.coerce.date().optional(),
})

export const SerieDocumentalQuerySchema = z.object({
  categoria: CategoriaSerieSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(100),
})

export type SerieDocumentalDTO = z.infer<typeof SerieDocumentalSchema>
export type SerieDocumentalQueryDTO = z.infer<typeof SerieDocumentalQuerySchema>
