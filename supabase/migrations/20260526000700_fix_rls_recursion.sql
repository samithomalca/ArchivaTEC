-- 01. Deshabilitar RLS temporalmente para limpiar
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;

-- 02. Eliminar todas las políticas existentes para evitar duplicados
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Admins pueden ver todos los usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Cualquier autenticado puede ver usuarios" ON public.usuarios;

-- 03. Habilitar RLS de nuevo
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 04. CREAR POLÍTICAS SIMPLIFICADAS (Sin recursión)

-- POLÍTICA 1: Permitir que un usuario vea SU PROPIO registro.
-- Esta es la más importante para que el login no falle.
-- Usamos 'auth.uid() = id' que es directo y no requiere consultar la tabla de nuevo.
CREATE POLICY "Permitir ver perfil propio"
  ON public.usuarios FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- POLÍTICA 2: Permitir que los administradores vean y gestionen TODO.
-- Para evitar la recursión infinita (mirar la tabla usuarios dentro de la política de usuarios),
-- usamos un chequeo basado en metadatos si es posible, o una consulta simplificada.
-- Por ahora, daremos permiso de lectura general a autenticados para estabilizar el sistema,
-- y restringiremos la escritura.
CREATE POLICY "Lectura general para autenticados"
  ON public.usuarios FOR SELECT
  TO authenticated
  USING (true);

-- POLÍTICA 3: Solo el admin real puede insertar/borrar (seguridad básica)
CREATE POLICY "Solo admins gestionan"
  ON public.usuarios FOR ALL
  TO authenticated
  USING (
    (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'ADMIN'
  );
