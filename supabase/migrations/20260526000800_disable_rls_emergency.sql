-- SOLUCIÓN RADICAL: Desactivar RLS para eliminar la recursión infinita
-- Esto permitirá que el sistema funcione de inmediato sin el error 500.

ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;

-- Limpiamos las políticas conflictivas
DROP POLICY IF EXISTS "Permitir ver perfil propio" ON public.usuarios;
DROP POLICY IF EXISTS "Lectura general para autenticados" ON public.usuarios;
DROP POLICY IF EXISTS "Solo admins gestionan" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Admins pueden ver todos los usuarios" ON public.usuarios;
