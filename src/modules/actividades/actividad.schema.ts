import { z } from 'zod'

// No se declara `division` aquí a propósito: el filtro por división se
// calcula en el servidor a partir del usuario autenticado (ver
// actividad.routes.ts), nunca desde un query param del cliente.
export const ActividadQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type ActividadQueryDTO = z.infer<typeof ActividadQuerySchema>
