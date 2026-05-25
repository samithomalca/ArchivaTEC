create extension if not exists pgcrypto;

create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),
  nombre varchar(200) not null,
  email varchar(200) not null unique,
  password_hash varchar(500) not null,
  rol varchar(50) not null default 'CONSULTA',
  division varchar(200) not null default '',
  crear_usuarios boolean not null default false,
  subir_archivos boolean not null default true,
  modificar_archivos boolean not null default true,
  eliminar_archivos boolean not null default false,
  ver_otras_divisiones boolean not null default false,
  activo boolean not null default true,
  creado_en timestamp not null default now(),
  actualizado_en timestamp not null default now()
);

create table if not exists public.ubicaciones (
  id uuid primary key default gen_random_uuid(),
  codigo varchar(20) not null unique,
  descripcion varchar(200),
  salon varchar(100) not null,
  estante integer not null,
  fila integer not null,
  columna integer not null,
  capacidad_maxima integer not null default 50,
  ocupacion_actual integer not null default 0,
  activo boolean not null default true,
  creado_en timestamp not null default now(),
  actualizado_en timestamp not null default now()
);

create table if not exists public.cajas (
  id uuid primary key default gen_random_uuid(),
  numero_caja varchar(50) not null unique,
  descripcion text,
  tipo_documento varchar(50) not null,
  fecha_inicio timestamp not null,
  fecha_fin timestamp,
  ubicacion_id uuid not null references public.ubicaciones(id),
  estado varchar(50) not null default 'ACTIVA',
  total_expedientes integer not null default 0,
  observaciones text,
  creado_en timestamp not null default now(),
  actualizado_en timestamp not null default now()
);

create table if not exists public.expedientes (
  id uuid primary key default gen_random_uuid(),
  numero_expediente varchar(100) not null unique,
  nombre_titular varchar(200) not null,
  tipo_expediente varchar(50) not null,
  matricula_o_empleado varchar(50),
  carrera varchar(150),
  fecha_ingreso timestamp not null,
  fecha_cierre timestamp,
  caja_id uuid not null references public.cajas(id),
  estado varchar(50) not null default 'ACTIVO',
  clasificacion_aidlc varchar(100),
  digitalizado_url varchar(1000),
  observaciones text,
  creado_en timestamp not null default now(),
  actualizado_en timestamp not null default now()
);

create table if not exists public.prestamos (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid references public.expedientes(id),
  caja_id uuid references public.cajas(id),
  solicitante_nombre varchar(200) not null,
  solicitante_matricula varchar(50),
  solicitante_departamento varchar(200) not null,
  motivo_prestamo text not null,
  fecha_salida timestamp not null default now(),
  fecha_devolucion_esperada timestamp not null,
  fecha_devolucion_real timestamp,
  autorizado_por_id uuid not null references public.usuarios(id),
  estado varchar(50) not null default 'ACTIVO',
  observaciones text,
  creado_en timestamp not null default now()
);

create table if not exists public.digitalizaciones (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid not null references public.expedientes(id),
  operador_id uuid not null references public.usuarios(id),
  equipo_escaner varchar(100),
  resolucion_dpi integer not null default 300,
  formato_archivo varchar(20) not null default 'PDF_A',
  total_paginas integer not null,
  url_archivo varchar(1000) not null,
  checksum_sha256 varchar(64) not null,
  estado varchar(50) not null default 'EN_PROCESO',
  observaciones text,
  creado_en timestamp not null default now(),
  actualizado_en timestamp not null default now()
);

create index if not exists idx_usuarios_email on public.usuarios(email);
create index if not exists idx_cajas_ubicacion on public.cajas(ubicacion_id);
create index if not exists idx_expedientes_caja on public.expedientes(caja_id);
create index if not exists idx_prestamos_expediente on public.prestamos(expediente_id);
create index if not exists idx_prestamos_caja on public.prestamos(caja_id);
create index if not exists idx_digitalizaciones_expediente on public.digitalizaciones(expediente_id);
create index if not exists idx_digitalizaciones_operador on public.digitalizaciones(operador_id);
