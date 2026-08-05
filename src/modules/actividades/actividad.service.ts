import { db } from '../../infrastructure/database/client'
import { digitalizaciones, expedientes, usuarios } from '../../infrastructure/database/schema'
import { eq, and, ilike, sql, desc } from 'drizzle-orm'
import type { ActividadQueryDTO } from './actividad.schema'
import { deriveFileName } from '../../infrastructure/storage/supabase-storage'

interface ScopeDivision {
  division: string
  verOtrasDivisiones: boolean
}

// Campeche/Yucatán pertenecen a la Zona Centro de México: UTC-6 fija todo
// el año desde la reforma de 2022 (sin horario de verano). No es la Zona
// Sureste (America/Cancun, UTC-5, exclusiva de Quintana Roo) — son husos
// distintos, verificado contra IANA tzdata y contra el reporte real de un
// usuario en Campeche.
const CAMPECHE_TZ = 'America/Merida'

// Un solo formatter a nivel de módulo (crear uno por fila sería costoso;
// listar() puede mapear hasta 100 filas por request). hour12:false evita
// depender del texto localizado "a. m./p. m." de Intl — solo se usan los
// campos numéricos, el formato final se arma a mano para no cambiar el
// contrato del frontend (DD/MM/YYYY, hh:mm AM/PM en ASCII plano).
const campecheFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: CAMPECHE_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function partsInCampeche(d: Date) {
  const map: Record<string, string> = {}
  for (const p of campecheFormatter.formatToParts(d)) map[p.type] = p.value
  return {
    day: map.day!,
    month: map.month!,
    year: map.year!,
    hour24: Number(map.hour) % 24,
    minute: map.minute!,
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function formatFecha(d: Date): string {
  const { day, month, year } = partsInCampeche(d)
  return `${day}/${month}/${year}`
}

function formatHora(d: Date): string {
  const { hour24, minute } = partsInCampeche(d)
  const h12 = hour24 % 12 || 12
  return `${pad2(h12)}:${minute} ${hour24 >= 12 ? 'PM' : 'AM'}`
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
      urlArchivo: r.urlArchivo,
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
