import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { serieDocumentalService } from './series-documental.service'
import {
  SerieDocumentalSchema,
  SerieDocumentalQuerySchema,
  SerieDocumentalUpdateSchema,
  type SerieDocumentalDTO,
  type SerieDocumentalQueryDTO,
  type SerieDocumentalUpdateDTO,
} from './series-documental.schema'
import { validateBody, validateQuery } from '../../middleware/validator.middleware'
import { authMiddleware } from '../../middleware/auth.middleware'

export const seriesDocumentalesRoutes = new Hono()

seriesDocumentalesRoutes.use('*', authMiddleware)

// Igual patrón que usuarios.routes.ts (canManageUsers): permiso booleano, no
// requireRole — requireRole solo compara jerarquía de roles fijos, no
// permisos granulares como crearUsuarios. Gatea crear Y eliminar.
function puedeGestionarSeries(user: any) {
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
  if (!puedeGestionarSeries(caller)) {
    throw new HTTPException(403, { message: 'No tienes permiso para crear series documentales' })
  }
  const body = c.req.valid('json') as SerieDocumentalDTO
  const result = await serieDocumentalService.crear(body, caller?.sub)
  return c.json({ success: true, data: result }, 201)
})

seriesDocumentalesRoutes.patch('/:id', validateBody(SerieDocumentalUpdateSchema), async (c) => {
  const caller = c.get('user') as any
  if (!puedeGestionarSeries(caller)) {
    throw new HTTPException(403, { message: 'No tienes permiso para editar series documentales' })
  }
  const body = c.req.valid('json') as SerieDocumentalUpdateDTO
  const result = await serieDocumentalService.actualizar(c.req.param('id'), body)
  return c.json({ success: true, data: result })
})

seriesDocumentalesRoutes.delete('/:id', async (c) => {
  const caller = c.get('user') as any
  if (!puedeGestionarSeries(caller)) {
    throw new HTTPException(403, { message: 'No tienes permiso para eliminar series documentales' })
  }
  const result = await serieDocumentalService.eliminar(c.req.param('id'))
  return c.json({ success: true, data: result })
})
