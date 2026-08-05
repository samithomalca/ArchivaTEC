import { db } from '../../infrastructure/database/client'
import { seriesDocumentales } from '../../infrastructure/database/schema'
import { eq, and, sql } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import type { SerieDocumentalDTO, SerieDocumentalQueryDTO } from './series-documental.schema'

export class SerieDocumentalService {
  async listar(query: SerieDocumentalQueryDTO) {
    const { page, limit, categoria } = query
    const offset = (page - 1) * limit

    const conditions = []
    if (categoria) conditions.push(eq(seriesDocumentales.categoria, categoria))

    const [rows, [{ total }]] = await Promise.all([
      db.select().from(seriesDocumentales)
        .where(conditions.length ? and(...conditions) : undefined)
        .limit(limit)
        .offset(offset),
      db.select({ total: sql<number>`count(*)` }).from(seriesDocumentales)
        .where(conditions.length ? and(...conditions) : undefined),
    ])

    return {
      data: rows,
      meta: { total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) },
    }
  }

  // Nota: la unicidad y la existencia de `codigoPadre` solo se validan contra
  // filas ya guardadas en esta tabla (nodos dinámicos). El árbol estático de
  // ~150 nodos vive solo en public/catalog.js y este backend no tiene acceso
  // a él, así que no puede detectar una colisión con un código oficial (ej.
  // "1S") ni confirmar que un codigoPadre estático exista de verdad. Esa
  // validación adicional se hace del lado del cliente en public/app.js, que sí
  // tiene el árbol completo cargado. Ver plan/decisión documentada.
  async crear(data: SerieDocumentalDTO, creadoPorId?: string) {
    const [existing] = await db
      .select({ id: seriesDocumentales.id })
      .from(seriesDocumentales)
      .where(eq(seriesDocumentales.codigo, data.codigo))
      .limit(1)

    if (existing) {
      throw new HTTPException(409, { message: `Ya existe una serie documental con el código ${data.codigo}` })
    }

    const [nueva] = await db.insert(seriesDocumentales).values({
      ...data,
      codigoPadre: data.codigoPadre || null,
      creadoPorId: creadoPorId ?? null,
    }).returning()

    return nueva
  }

  async eliminar(id: string) {
    const [serie] = await db
      .select()
      .from(seriesDocumentales)
      .where(eq(seriesDocumentales.id, id))
      .limit(1)

    if (!serie) {
      throw new HTTPException(404, { message: `Serie documental ${id} no encontrada` })
    }

    const [{ total: hijos }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(seriesDocumentales)
      .where(eq(seriesDocumentales.codigoPadre, serie.codigo))

    if (Number(hijos) > 0) {
      throw new HTTPException(409, {
        message: `No se puede eliminar "${serie.codigo}": tiene ${hijos} sub-serie(s) debajo. Elimínalas primero.`,
      })
    }

    await db.delete(seriesDocumentales).where(eq(seriesDocumentales.id, id))
    return { success: true }
  }
}

export const serieDocumentalService = new SerieDocumentalService()
