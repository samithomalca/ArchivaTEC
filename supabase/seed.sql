create extension if not exists pgcrypto;

-- Seed básico para desarrollo
insert into auth.users (id, email, encrypted_password, email_confirmed_at)
values
  ('00000000-0000-0000-0000-000000000001', 'admin@archivatec.local', crypt('Admin@1234!', gen_salt('bf')), now()),
  ('00000000-0000-0000-0000-000000000002', 'jgarcia@itse.edu.mx', crypt('Password@123', gen_salt('bf')), now()),
  ('00000000-0000-0000-0000-000000000003', 'rmendez@itse.edu.mx', crypt('Password@123', gen_salt('bf')), now()),
  ('00000000-0000-0000-0000-000000000004', 'aperez@itse.edu.mx', crypt('Password@123', gen_salt('bf')), now())
ON CONFLICT (id) DO NOTHING;

insert into public.profiles (id, username, display_name, division, role, crear_usuarios, subir_archivos, modificar_archivos, eliminar_archivos, ver_otras_divisiones)
values
  ('00000000-0000-0000-0000-000000000001', 'admin', 'Administrador del Sistema', 'Sistemas', 'Administrador', true, true, true, true, true),
  ('00000000-0000-0000-0000-000000000002', 'jgarcia', 'Jesús García López', 'Dirección General', 'Administrador', true, true, true, true, true),
  ('00000000-0000-0000-0000-000000000003', 'rmendez', 'Rosa Méndez Juárez', 'Subdirección de Academia', 'Archivista', false, true, true, false, true),
  ('00000000-0000-0000-0000-000000000004', 'aperez', 'Ana Pérez Castillo', 'Subdirección de Extensión', 'Usuario de Consulta', false, false, false, false, true)
ON CONFLICT (id) DO NOTHING;

insert into public.usuarios (id, nombre, email, password_hash, rol, division, crear_usuarios, subir_archivos, modificar_archivos, eliminar_archivos, ver_otras_divisiones, activo)
values
  ('00000000-0000-0000-0000-000000000001', 'Administrador del Sistema', 'admin@archivatec.local', crypt('Admin@1234!', gen_salt('bf')), 'ADMIN', 'Sistemas', true, true, true, true, true, true),
  ('00000000-0000-0000-0000-000000000002', 'Jesús García López', 'jgarcia@itse.edu.mx', crypt('Password@123', gen_salt('bf')), 'ADMIN', 'Dirección General', true, true, true, true, true, true),
  ('00000000-0000-0000-0000-000000000003', 'Rosa Méndez Juárez', 'rmendez@itse.edu.mx', crypt('Password@123', gen_salt('bf')), 'ARCHIVISTA', 'Subdirección de Academia', false, true, true, false, true, true),
  ('00000000-0000-0000-0000-000000000004', 'Ana Pérez Castillo', 'aperez@itse.edu.mx', crypt('Password@123', gen_salt('bf')), 'CONSULTA', 'Subdirección de Extensión', false, false, false, false, true, true)
ON CONFLICT (id) DO NOTHING;

insert into public.ubicaciones (id, codigo, descripcion, salon, estante, fila, columna, capacidad_maxima, ocupacion_actual)
values
  ('11111111-1111-1111-1111-111111111111', 'UBI-001', 'Archivo Central', 'A-101', 1, 1, 1, 50, 12),
  ('22222222-2222-2222-2222-222222222222', 'UBI-002', 'Subdirección de Academia', 'B-204', 2, 3, 4, 30, 7)
ON CONFLICT (id) DO NOTHING;

insert into public.cajas (id, numero_caja, descripcion, tipo_documento, fecha_inicio, fecha_fin, ubicacion_id, estado, total_expedientes)
values
  ('33333333-3333-3333-3333-333333333333', 'CAJA-2024-001', 'Documentos académicos del primer semestre', 'ACADEMICO', '2024-01-10', null, '11111111-1111-1111-1111-111111111111', 'ACTIVA', 2),
  ('44444444-4444-4444-4444-444444444444', 'CAJA-2024-002', 'Documentos administrativos y finanzas', 'ADMINISTRATIVO', '2024-03-01', null, '22222222-2222-2222-2222-222222222222', 'ACTIVA', 1)
ON CONFLICT (id) DO NOTHING;

insert into public.expedientes (id, numero_expediente, nombre_titular, tipo_expediente, matricula_o_empleado, carrera, fecha_ingreso, fecha_cierre, caja_id, estado, clasificacion_aidlc, digitalizado_url)
values
  ('55555555-5555-5555-5555-555555555555', 'EXP-2024-001', 'María López', 'ALUMNO', '202410001', 'Ingeniería en Sistemas', '2024-02-01', null, '33333333-3333-3333-3333-333333333333', 'ACTIVO', 'Académico', null),
  ('66666666-6666-6666-6666-666666666666', 'EXP-2024-002', 'Carlos Méndez', 'ADMINISTRATIVO', 'EMP-2024-09', null, '2024-03-05', null, '44444444-4444-4444-4444-444444444444', 'ACTIVO', 'Administrativo', null)
ON CONFLICT (id) DO NOTHING;

insert into public.prestamos (id, expediente_id, caja_id, solicitante_nombre, solicitante_matricula, solicitante_departamento, motivo_prestamo, fecha_salida, fecha_devolucion_esperada, autorizado_por_id, estado)
values
  ('77777777-7777-7777-7777-777777777777', '55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'Ana Pérez Castillo', '202410087', 'Subdirección de Extensión', 'Consulta de expediente para seguimiento académico', '2024-05-10', '2024-05-17', '00000000-0000-0000-0000-000000000002', 'ACTIVO')
ON CONFLICT (id) DO NOTHING;

insert into public.digitalizaciones (id, expediente_id, operador_id, equipo_escaner, resolucion_dpi, formato_archivo, total_paginas, url_archivo, checksum_sha256, estado)
values
  ('88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000003', 'Escáner Canon 5000', 300, 'PDF_A', 18, 'https://storage.example.com/expedientes/EXP-2024-001.pdf', 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz', 'COMPLETADO')
ON CONFLICT (id) DO NOTHING;
