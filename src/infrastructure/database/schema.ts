import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── Tipos de enum simulados con varchar ─────────────────────────
// Usamos varchar con .$type<> para conservar el tipado TypeScript
// y asegurar máxima compatibilidad con motores PostgreSQL.

type RolEnum             = 'ADMIN' | 'ARCHIVISTA' | 'CONSULTA' | 'DIGITALIZADOR'
type TipoDocumentoEnum   = 'ACADEMICO' | 'ADMINISTRATIVO' | 'FINANCIERO' | 'PERSONAL'
type EstadoCajaEnum      = 'ACTIVA' | 'INACTIVA' | 'EN_PRESTAMO' | 'EN_DIGITALIZACION' | 'DADA_DE_BAJA'
type TipoExpedienteEnum  = 'ALUMNO' | 'DOCENTE' | 'ADMINISTRATIVO' | 'PROYECTO' | 'CONVENIO'
type EstadoExpedienteEnum= 'ACTIVO' | 'CERRADO' | 'PRESTADO' | 'DIGITALIZADO' | 'TRANSFERIDO'
type EstadoPrestamoEnum  = 'PENDIENTE' | 'ACTIVO' | 'DEVUELTO' | 'VENCIDO'
type EstadoDigEnum       = 'EN_PROCESO' | 'COMPLETADO' | 'FALLIDO' | 'VERIFICADO'
type FormatoArchivoEnum  = 'PDF' | 'PDF_A' | 'TIFF' | 'PNG'

// ─── Usuarios ─────────────────────────────────────────────────────

export const usuarios = pgTable('usuarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  email: varchar('email', { length: 200 }).notNull(),
  passwordHash: varchar('password_hash', { length: 500 }).notNull(),
  rol: varchar('rol', { length: 50 }).$type<RolEnum>().default('CONSULTA').notNull(),
  division: varchar('division', { length: 200 }).default('').notNull(),
  // ── Permisos RBAC granulares ──────────────────────────────────────
  crearUsuarios:       boolean('crear_usuarios').default(false).notNull(),
  subirArchivos:       boolean('subir_archivos').default(true).notNull(),
  modificarArchivos:   boolean('modificar_archivos').default(true).notNull(),
  eliminarArchivos:    boolean('eliminar_archivos').default(false).notNull(),
  verOtrasDivisiones:  boolean('ver_otras_divisiones').default(false).notNull(),
  activo: boolean('activo').default(true).notNull(),
  creadoEn: timestamp('creado_en').defaultNow().notNull(),
  actualizadoEn: timestamp('actualizado_en').defaultNow().notNull(),
}, (t) => [uniqueIndex('usuarios_email_unique').on(t.email)])

// ─── Ubicaciones Físicas ──────────────────────────────────────────

export const ubicaciones = pgTable('ubicaciones', {
  id: uuid('id').primaryKey().defaultRandom(),
  codigo: varchar('codigo', { length: 20 }).notNull(),
  descripcion: varchar('descripcion', { length: 200 }),
  salon: varchar('salon', { length: 100 }).notNull(),
  estante: integer('estante').notNull(),
  fila: integer('fila').notNull(),
  columna: integer('columna').notNull(),
  capacidadMaxima: integer('capacidad_maxima').default(50).notNull(),
  ocupacionActual: integer('ocupacion_actual').default(0).notNull(),
  activo: boolean('activo').default(true).notNull(),
  creadoEn: timestamp('creado_en').defaultNow().notNull(),
  actualizadoEn: timestamp('actualizado_en').defaultNow().notNull(),
}, (t) => [uniqueIndex('ubicaciones_codigo_unique').on(t.codigo)])

// ─── Cajas ────────────────────────────────────────────────────────

export const cajas = pgTable('cajas', {
  id: uuid('id').primaryKey().defaultRandom(),
  numeroCaja: varchar('numero_caja', { length: 50 }).notNull(),
  descripcion: text('descripcion'),
  tipoDocumento: varchar('tipo_documento', { length: 50 }).$type<TipoDocumentoEnum>().notNull(),
  fechaInicio: timestamp('fecha_inicio').notNull(),
  fechaFin: timestamp('fecha_fin'),
  ubicacionId: uuid('ubicacion_id').references(() => ubicaciones.id).notNull(),
  estado: varchar('estado', { length: 50 }).$type<EstadoCajaEnum>().default('ACTIVA').notNull(),
  totalExpedientes: integer('total_expedientes').default(0).notNull(),
  observaciones: text('observaciones'),
  creadoEn: timestamp('creado_en').defaultNow().notNull(),
  actualizadoEn: timestamp('actualizado_en').defaultNow().notNull(),
}, (t) => [uniqueIndex('cajas_numero_unique').on(t.numeroCaja)])

// ─── Expedientes ──────────────────────────────────────────────────

export const expedientes = pgTable('expedientes', {
  id: uuid('id').primaryKey().defaultRandom(),
  numeroExpediente: varchar('numero_expediente', { length: 100 }).notNull(),
  nombreTitular: varchar('nombre_titular', { length: 200 }).notNull(),
  tipoExpediente: varchar('tipo_expediente', { length: 50 }).$type<TipoExpedienteEnum>().notNull(),
  matriculaOEmpleado: varchar('matricula_o_empleado', { length: 50 }),
  carrera: varchar('carrera', { length: 150 }),
  fechaIngreso: timestamp('fecha_ingreso').notNull(),
  fechaCierre: timestamp('fecha_cierre'),
  cajaId: uuid('caja_id').references(() => cajas.id).notNull(),
  estado: varchar('estado', { length: 50 }).$type<EstadoExpedienteEnum>().default('ACTIVO').notNull(),
  clasificacionAIDLC: varchar('clasificacion_aidlc', { length: 100 }),
  digitalizadoUrl: varchar('digitalizado_url', { length: 1000 }),
  observaciones: text('observaciones'),
  creadoEn: timestamp('creado_en').defaultNow().notNull(),
  actualizadoEn: timestamp('actualizado_en').defaultNow().notNull(),
}, (t) => [uniqueIndex('expedientes_numero_unique').on(t.numeroExpediente)])

// ─── Préstamos ────────────────────────────────────────────────────

export const prestamos = pgTable('prestamos', {
  id: uuid('id').primaryKey().defaultRandom(),
  expedienteId: uuid('expediente_id').references(() => expedientes.id),
  cajaId: uuid('caja_id').references(() => cajas.id),
  solicitanteNombre: varchar('solicitante_nombre', { length: 200 }).notNull(),
  solicitanteMatricula: varchar('solicitante_matricula', { length: 50 }),
  solicitanteDepartamento: varchar('solicitante_departamento', { length: 200 }).notNull(),
  motivoPrestamo: text('motivo_prestamo').notNull(),
  fechaSalida: timestamp('fecha_salida').defaultNow().notNull(),
  fechaDevolucionEsperada: timestamp('fecha_devolucion_esperada').notNull(),
  fechaDevolucionReal: timestamp('fecha_devolucion_real'),
  autorizadoPorId: uuid('autorizado_por_id').references(() => usuarios.id).notNull(),
  estado: varchar('estado', { length: 50 }).$type<EstadoPrestamoEnum>().default('ACTIVO').notNull(),
  observaciones: text('observaciones'),
  creadoEn: timestamp('creado_en').defaultNow().notNull(),
})

// ─── Digitalización ───────────────────────────────────────────────

export const digitalizaciones = pgTable('digitalizaciones', {
  id: uuid('id').primaryKey().defaultRandom(),
  expedienteId: uuid('expediente_id').references(() => expedientes.id).notNull(),
  operadorId: uuid('operador_id').references(() => usuarios.id).notNull(),
  equipoEscaner: varchar('equipo_escaner', { length: 100 }),
  resolucionDpi: integer('resolucion_dpi').default(300).notNull(),
  formatoArchivo: varchar('formato_archivo', { length: 20 }).$type<FormatoArchivoEnum>().default('PDF_A').notNull(),
  totalPaginas: integer('total_paginas').notNull(),
  urlArchivo: varchar('url_archivo', { length: 1000 }).notNull(),
  checksumSha256: varchar('checksum_sha256', { length: 64 }).notNull(),
  estado: varchar('estado', { length: 50 }).$type<EstadoDigEnum>().default('EN_PROCESO').notNull(),
  observaciones: text('observaciones'),
  creadoEn: timestamp('creado_en').defaultNow().notNull(),
  actualizadoEn: timestamp('actualizado_en').defaultNow().notNull(),
})

// ─── Relaciones ───────────────────────────────────────────────────

export const ubicacionesRelations = relations(ubicaciones, ({ many }) => ({
  cajas: many(cajas),
}))

export const cajasRelations = relations(cajas, ({ one, many }) => ({
  ubicacion: one(ubicaciones, { fields: [cajas.ubicacionId], references: [ubicaciones.id] }),
  expedientes: many(expedientes),
  prestamos: many(prestamos),
}))

export const expedientesRelations = relations(expedientes, ({ one, many }) => ({
  caja: one(cajas, { fields: [expedientes.cajaId], references: [cajas.id] }),
  prestamos: many(prestamos),
  digitalizaciones: many(digitalizaciones),
}))

export const prestamosRelations = relations(prestamos, ({ one }) => ({
  expediente: one(expedientes, { fields: [prestamos.expedienteId], references: [expedientes.id] }),
  caja: one(cajas, { fields: [prestamos.cajaId], references: [cajas.id] }),
  autorizadoPor: one(usuarios, { fields: [prestamos.autorizadoPorId], references: [usuarios.id] }),
}))

export const digitalizacionesRelations = relations(digitalizaciones, ({ one }) => ({
  expediente: one(expedientes, { fields: [digitalizaciones.expedienteId], references: [expedientes.id] }),
  operador: one(usuarios, { fields: [digitalizaciones.operadorId], references: [usuarios.id] }),
}))
