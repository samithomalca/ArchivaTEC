import { db } from '../../infrastructure/database/client'
import { digitalizaciones, expedientes, usuarios } from '../../infrastructure/database/schema'
import { eq, and, ilike, sql, desc } from 'drizzle-orm'
import type { ActividadQueryDTO } from './actividad.schema'

interface ScopeDivision {
  division: string
  verOtrasDivisiones: boolean
}

function deriveFileName(urlArchivo: string): string {
  const last = urlArchivo.split('/').pop() || urlArchivo
  // Quita el prefijo `${Date.now()}-` (13 dígitos) que digitalizacion.routes.ts
  // antepone al subir el archivo.
  return last.replace(/^\d{13}-/, '')
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function formatFecha(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}

function formatHora(d: Date): string {
  const h24 = d.getHours()
  const h12 = h24 % 12 || 12
  return `${pad2(h12)}:${pad2(d.getMinutes())} ${h24 >= 12 ? 'PM' : 'AM'}`
}

export class ActividadService {
  async listar(query: ActividadQueryDTO, scope: ScopeDivision) {
    const { page, limit } = query
    const offset = (page - 1) * limit

    // Fail-closed a propósito: si el usuario no puede ver otras divisiones,
    // siempre se filtra por la suya del lado del servidor.
    const conditions = !scope.verOtrasDivisiones
      ? [ilike(usuarios.division, scope.division)]
      : []
    const where = conditions.length ? and(...conditions) : undefined

    const [rows, [{ total }]] = await Promise.all([
      db
        .select({
          id: digitalizaciones.id,
          urlArchivo: digitalizaciones.urlArchivo,
          creadoEn: digitalizaciones.creadoEn,
          serie: expedientes.numeroExpediente,
          encargado: usuarios.nombre,
          division: usuarios.division,
        })
        .from(digitalizaciones)
        .leftJoin(expedientes, eq(digitalizaciones.expedienteId, expedientes.id))
        .leftJoin(usuarios, eq(digitalizaciones.operadorId, usuarios.id))
        .where(where)
        .orderBy(desc(digitalizaciones.creadoEn))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)` })
        .from(digitalizaciones)
        .leftJoin(usuarios, eq(digitalizaciones.operadorId, usuarios.id))
        .where(where),
    ])

    const data = rows.map((r) => ({
      id: r.id,
      archivo: deriveFileName(r.urlArchivo),
      serie: r.serie ?? '—',
      subdivision: r.division ?? '—',
      encargado: r.encargado ?? '—',
      division: r.division ?? '—',
      fecha: formatFecha(r.creadoEn),
      hora: formatHora(r.creadoEn),
    }))

    return {
      data,
      meta: { total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) },
    }
  }
}

export const actividadService = new ActividadService()
