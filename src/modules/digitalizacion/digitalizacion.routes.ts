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

import { storageService } from '../../infrastructure/storage/supabase-storage'
import { env } from '../../config/env'

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
  try {
    const expedienteId = c.req.param('expedienteId')
    const user = c.get('user')
    
    const body = await c.req.parseBody()
    const file = body['file'] as any
    
    if (!file || !(file instanceof File)) {
      return c.json({ success: false, error: 'No se recibió un archivo válido' }, 400)
    }

    if (file.type !== 'application/pdf') {
      return c.json({ success: false, error: 'Solo se permiten archivos PDF' }, 400)
    }

    const MAX_SIZE = 4 * 1024 * 1024 // 4MB — límite de Vercel Serverless
    if (file.size > MAX_SIZE) {
      return c.json({ success: false, error: 'El archivo no puede superar 4MB' }, 400)
    }

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`
    const filePath = `digitalizados/${fileName}`
    
    // 1. Subida a Storage
    let publicUrl = ''
    try {
      const bytes = await file.arrayBuffer()
      publicUrl = await storageService.uploadFile(env.STORAGE_BUCKET, filePath, bytes, 'application/pdf')
    } catch (storageErr: any) {
      console.error('Error en Supabase Storage:', storageErr)
      return c.json({ 
        success: false, 
        error: `Error al guardar en la nube: ${storageErr.message || 'Verifica que el bucket \"expedientes\" sea público'}` 
      }, 500)
    }
    
    // 2. Registro en Base de Datos
    try {
      const result = await digitalizacionService.iniciar({
        expedienteId,
        urlArchivo: publicUrl,
        totalPaginas: 1, 
        checksumSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        resolucionDpi: 300,
        formatoArchivo: 'PDF'
      }, user.sub)
      
      return c.json({ success: true, data: result })
    } catch (dbErr: any) {
      console.error('Error en Base de Datos:', dbErr)
      return c.json({ 
        success: false, 
        error: `Archivo subido, pero no se pudo registrar en la BD: ${dbErr.message}` 
      }, 500)
    }

  } catch (globalErr: any) {
    console.error('Error crítico en subida:', globalErr)
    return c.json({ success: false, error: `Error interno: ${globalErr.message}` }, 500)
  }
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
