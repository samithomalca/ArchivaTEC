-- 01. Insertar en el sistema de Autenticación de Supabase (auth.users)
-- Este usuario permite el login inicial.
-- Password: admin123
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', -- ID fijo para el admin
  'authenticated',
  'authenticated',
  'admin@itse.edu.mx',
  '$2a$10$Z7PfEOXtUbMazsjcSVloReosKNpyfJKqXPyEShH7FaYNKwt1aGWMq', -- admin123 (formato 2a)
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Administrador"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 02. Insertar en la tabla de Perfiles (public.profiles)
-- Vincula el login con los datos y permisos de la aplicación.
INSERT INTO public.profiles (
  id,
  username,
  display_name,
  division,
  role,
  crear_usuarios,
  subir_archivos,
  modificar_archivos,
  eliminar_archivos,
  ver_otras_divisiones
) VALUES (
  'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
  'admin',
  'Administrador del Sistema',
  'DIRECCIÓN GENERAL',
  'Administrador',
  true,
  true,
  true,
  true,
  true
) ON CONFLICT (id) DO NOTHING;

-- 03. Asegurar que el usuario tenga identidades de email registradas
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
  'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
  format('{"sub":"%s","email":"%s"}', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'admin@itse.edu.mx')::jsonb,
  'email',
  now(),
  now(),
  now()
) ON CONFLICT (provider, identity_id) DO NOTHING;
