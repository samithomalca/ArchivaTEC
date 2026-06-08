import { Hono } from 'hono'
import { digitalizacionService } from './digitalizacion.service'
import {
  DigitalizacionSchema,
  ActualizarEstadoSchema,
  DigitalizacionQuerySchema,
  type DigitalizacionDTO,
  type ActualizarEstadoDTO,
  type DigitalizacionQueryDTO,
} from './digitalizacion.schema'
import { validateBody, validateQuery } from '../../middleware/validator.middleware'
import { authMiddleware } from '../../middleware/auth.middleware'
import { requireRole } from '../../middleware/rbac.middleware'
import { HTTPException } from 'hono/http-exception'

export const digitalizacionRoutes = new Hono()

digitalizacionRoutes.use('*', authMiddleware)

// Listar todas las digitalizaciones (con filtros opcionales)
digitalizacionRoutes.get('/', validateQuery(DigitalizacionQuerySchema), async (c) => {
  const query = c.req.valid('query') as DigitalizacionQueryDTO
  const result = await digitalizacionService.listar(query)
  return c.json({ success: true, ...result })
})

// Obtener digitalizaciones de un expediente específico
digitalizacionRoutes.get('/expediente/:expedienteId', async (c) => {
  const result = await digitalizacionService.obtenerPorExpediente(c.req.param('expedienteId'))
  return c.json({ success: true, data: result })
})

// Obtener una digitalización por ID
digitalizacionRoutes.get('/:id', async (c) => {
  const result = await digitalizacionService.obtenerPorId(c.req.param('id'))
  return c.json({ success: true, data: result })
})

// Subir un PDF para un expediente
digitalizacionRoutes.post('/upload/:expedienteId', requireRole('DIGITALIZADOR', 'ARCHIVISTA', 'ADMIN'), async (c) => {
  const expedienteId = c.req.param('expedienteId')
  const user = c.get('user')
  const body = await c.req.parseBody()
  const file = body['file'] as any
  
  if (!file || !(file instanceof File)) {
    throw new HTTPException(400, { message: 'Archivo PDF no proporcionado' })
  }

  if (file.type !== 'application/pdf') {
    throw new HTTPException(400, { message: 'Solo se permiten archivos PDF' })
  }

  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`
  const filePath = `public/uploads/${fileName}`
  
  const bytes = await file.arrayBuffer()
  await Bun.write(filePath, bytes)
  
  const urlArchivo = `/uploads/${fileName}`
  
  // Registrar en la BD (usamos valores por defecto para metadata técnica por ahora)
  const result = await digitalizacionService.iniciar({
    expedienteId,
    urlArchivo,
    totalPaginas: 1, 
    checksumSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    resolucionDpi: 300,
    formatoArchivo: 'PDF'
  }, user.sub)
  
  return c.json({ success: true, data: result })
})

// Iniciar una nueva digitalización (Crea el registro y asocia al expediente)
digitalizacionRoutes.post(
  '/',
  requireRole('DIGITALIZADOR', 'ARCHIVISTA', 'ADMIN'),
  validateBody(DigitalizacionSchema),
  async (c) => {
    const body = c.req.valid('json') as DigitalizacionDTO
    const user = c.get('user')
    const result = await digitalizacionService.iniciar(body, user.sub)
    return c.json({ success: true, data: result }, 201)
  },
)

// Eliminar una digitalización y su archivo físico (si aplica)
digitalizacionRoutes.delete('/:id', requireRole('ADMIN', 'ARCHIVISTA'), async (c) => {
  const result = await digitalizacionService.eliminar(c.req.param('id'))
  return c.json({ success: true, data: result })
})

// Actualizar estado de digitalización
digitalizacionRoutes.patch(
  '/:id/estado',
  requireRole('DIGITALIZADOR', 'ARCHIVISTA', 'ADMIN'),
  validateBody(ActualizarEstadoSchema),
  async (c) => {
    const body = c.req.valid('json') as ActualizarEstadoDTO
    const result = await digitalizacionService.actualizarEstado(c.req.param('id'), body)
    return c.json({ success: true, data: result })
  },
)
