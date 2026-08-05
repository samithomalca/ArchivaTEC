import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { serieDocumentalService } from './series-documental.service'
import {
  SerieDocumentalSchema,
  SerieDocumentalQuerySchema,
  type SerieDocumentalDTO,
  type SerieDocumentalQueryDTO,
} from './series-documental.schema'
import { validateBody, validateQuery } from '../../middleware/validator.middleware'
import { authMiddleware } from '../../middleware/auth.middleware'

export const seriesDocumentalesRoutes = new Hono()

seriesDocumentalesRoutes.use('*', authMiddleware)

// Igual patrón que usuarios.routes.ts (canManageUsers): permiso booleano, no
// requireRole — requireRole solo compara jerarquía de roles fijos, no
// permisos granulares como crearUsuarios.
function puedeCrearSeries(user: any) {
  return user?.rol === 'ADMIN' || user?.permisos?.crearUsuarios === true
}

// Sin restricción de permiso: cualquier usuario autenticado necesita ver el
// árbol completo (estático + dinámico) para navegar Registros.
seriesDocumentalesRoutes.get('/', validateQuery(SerieDocumentalQuerySchema), async (c) => {
  const query = c.req.valid('query') as SerieDocumentalQueryDTO
  const result = await serieDocumentalService.listar(query)
  return c.json({ success: true, ...result })
})

seriesDocumentalesRoutes.post('/', validateBody(SerieDocumentalSchema), async (c) => {
  const caller = c.get('user') as any
  if (!puedeCrearSeries(caller)) {
    throw new HTTPException(403, { message: 'No tienes permiso para crear series documentales' })
  }
  const body = c.req.valid('json') as SerieDocumentalDTO
  const result = await serieDocumentalService.crear(body, caller?.sub)
  return c.json({ success: true, data: result }, 201)
})
