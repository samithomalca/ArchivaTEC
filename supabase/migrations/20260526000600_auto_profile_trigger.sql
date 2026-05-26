-- 01. Función para manejar nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertamos en la tabla 'usuarios' (que es la fuente de verdad)
  INSERT INTO public.usuarios (
    id, 
    nombre, 
    email, 
    password_hash, 
    rol, 
    division,
    crear_usuarios,
    subir_archivos,
    modificar_archivos,
    eliminar_archivos,
    ver_otras_divisiones,
    activo
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), 
    new.email, 
    'SUPABASE_AUTH_EXTERNAL',
    'CONSULTA',
    'NUEVO INGRESO',
    false,
    false,
    false,
    false,
    true,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nombre = EXCLUDED.nombre;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Crear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Habilitar RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.usuarios;
CREATE POLICY "Usuarios pueden ver su propio perfil"
  ON public.usuarios FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins pueden ver todos los usuarios" ON public.usuarios;
CREATE POLICY "Admins pueden ver todos los usuarios"
  ON public.usuarios FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND (rol = 'ADMIN' OR crear_usuarios = true)
    )
  );
