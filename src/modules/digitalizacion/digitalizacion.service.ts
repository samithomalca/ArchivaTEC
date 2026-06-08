import { db } from '../../infrastructure/database/client'
import { digitalizaciones, expedientes, cajas, ubicaciones } from '../../infrastructure/database/schema'
import { eq, and, sql } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import type { DigitalizacionDTO, ActualizarEstadoDTO, DigitalizacionQueryDTO } from './digitalizacion.schema'

export class DigitalizacionService {
  async listar(query: DigitalizacionQueryDTO) {
    const { page, limit, estado } = query
    const offset = (page - 1) * limit
    const conditions = estado ? [eq(digitalizaciones.estado, estado)] : []
    const where = conditions.length ? and(...conditions) : undefined

    const [rows, [{ total }]] = await Promise.all([
      db.select().from(digitalizaciones).where(where).limit(limit).offset(offset),
      db.select({ total: sql<number>`count(*)` }).from(digitalizaciones).where(where),
    ])

    return {
      data: rows,
      meta: { total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) },
    }
  }

  async obtenerPorId(id: string) {
    const [dig] = await db
      .select()
      .from(digitalizaciones)
      .where(eq(digitalizaciones.id, id))
      .limit(1)

    if (!dig) throw new HTTPException(404, { message: `Digitalización ${id} no encontrada` })
    return dig
  }

  async obtenerPorExpediente(expedienteId: string) {
    // Si no es un UUID, buscar primero el ID real por el código (numero_expediente)
    let realId = expedienteId
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(expedienteId)
    
    if (!isUuid) {
      const [exp] = await db.select({ id: expedientes.id }).from(expedientes).where(eq(expedientes.numeroExpediente, expedienteId)).limit(1)
      if (exp) realId = exp.id
      else return [] // No hay expediente, no hay digitalizaciones
    }

    return db
      .select()
      .from(digitalizaciones)
      .where(eq(digitalizaciones.expedienteId, realId))
      .orderBy(sql`${digitalizaciones.creadoEn} DESC`)
  }

  async iniciar(data: DigitalizacionDTO, operadorId: string) {
    let expId: string | null = null
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.expedienteId)

    if (isUuid) {
      const [exp] = await db.select({ id: expedientes.id }).from(expedientes).where(eq(expedientes.id, data.expedienteId)).limit(1)
      if (exp) expId = exp.id
    } else {
      const [exp] = await db.select({ id: expedientes.id }).from(expedientes).where(eq(expedientes.numeroExpediente, data.expedienteId)).limit(1)
      if (exp) expId = exp.id
    }

    // Si no existe, crear placeholder
    if (!expId) {
      let [ub] = await db.select({ id: ubicaciones.id }).from(ubicaciones).where(eq(ubicaciones.codigo, 'TEMP-01')).limit(1)
      if (!ub) {
        [ub] = await db.insert(ubicaciones).values({
          codigo: 'TEMP-01',
          salon: 'Archivo Digital',
          estante: 0, 
          fila: 0, 
          columna: 0,
          descripcion: 'Ubicación temporal para digitalización directa'
        }).returning()
      }

      let [cj] = await db.select({ id: cajas.id }).from(cajas).where(eq(cajas.numeroCaja, 'CAJA-AUTO')).limit(1)
      if (!cj) {
        [cj] = await db.insert(cajas).values({
          numeroCaja: 'CAJA-AUTO',
          tipoDocumento: 'ADMINISTRATIVO', // Valor de enum válido
          fechaInicio: new Date(),
          ubicacionId: ub.id,
          descripcion: 'Caja automática para expedientes digitalizados'
        }).returning()
      }

      const [newExp] = await db.insert(expedientes).values({
        numeroExpediente: data.expedienteId,
        nombreTitular: `Serie ${data.expedienteId}`,
        tipoExpediente: 'ADMINISTRATIVO', // Valor de enum válido
        fechaIngreso: new Date(),
        cajaId: cj.id,
        estado: 'DIGITALIZADO'
      }).returning()
      
      expId = newExp.id
    }

    const [nueva] = await db
      .insert(digitalizaciones)
      .values({ 
        ...data, 
        expedienteId: expId,
        operadorId, 
        estado: 'COMPLETADO' 
      })
      .returning()

    await db
      .update(expedientes)
      .set({ digitalizadoUrl: data.urlArchivo, estado: 'DIGITALIZADO' })
      .where(eq(expedientes.id, expId))

    return nueva
  }

  async eliminar(id: string) {
    const dig = await this.obtenerPorId(id)
    
    // Si es una URL local, intentar borrar el archivo físico
    if (dig.urlArchivo.startsWith('/uploads/')) {
      try {
        const filePath = `public${dig.urlArchivo}`
        const file = Bun.file(filePath)
        if (await file.exists()) {
          // Bun no tiene unlink directo fácil, pero podemos usar fs o similar
        }
      } catch (e) {
        console.error('Error al borrar archivo físico:', e)
      }
    }

    await db.delete(digitalizaciones).where(eq(digitalizaciones.id, id))
    
    const rest = await this.obtenerPorExpediente(dig.expedienteId)
    if (rest.length === 0) {
      await db
        .update(expedientes)
        .set({ digitalizadoUrl: null, estado: 'ACTIVO' })
        .where(eq(expedientes.id, dig.expedienteId))
    } else {
      await db
        .update(expedientes)
        .set({ digitalizadoUrl: rest[0].urlArchivo })
        .where(eq(expedientes.id, dig.expedienteId))
    }

    return { success: true }
  }

  async actualizarEstado(id: string, data: ActualizarEstadoDTO) {
    await this.obtenerPorId(id)

    const [actualizada] = await db
      .update(digitalizaciones)
      .set({ ...data, actualizadoEn: new Date() })
      .where(eq(digitalizaciones.id, id))
      .returning()

    return actualizada
  }
}

export const digitalizacionService = new DigitalizacionService()
