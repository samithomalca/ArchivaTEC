import { Hono } from 'hono'
import { actividadService } from './actividad.service'
import { ActividadQuerySchema, type ActividadQueryDTO } from './actividad.schema'
import { validateQuery } from '../../middleware/validator.middleware'
import { authMiddleware } from '../../middleware/auth.middleware'

export const actividadRoutes = new Hono()

actividadRoutes.use('*', authMiddleware)

// Cualquier usuario autenticado puede listar (igual que /cajas, /expedientes,
// /digitalizacion) — la restricción real es de VISIBILIDAD de filas por
// división, no de acceso al endpoint. Ver actividad.service.ts.
actividadRoutes.get('/', validateQuery(ActividadQuerySchema), async (c) => {
  const query = c.req.valid('query') as ActividadQueryDTO
  const user = c.get('user')
  const scope = {
    division: user.division ?? '',
    verOtrasDivisiones: user.rol === 'ADMIN' || !!user.permisos?.verOtrasDivisiones,
  }
  const result = await actividadService.listar(query, scope)
  return c.json({ success: true, ...result })
})
