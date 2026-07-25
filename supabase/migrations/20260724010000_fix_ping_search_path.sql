-- Fija el search_path de ping() para cerrar el warning de seguridad
-- "Function Search Path Mutable" reportado por el linter de Supabase.
-- Sin search_path fijo, una función es teóricamente vulnerable a que
-- alguien "secuestre" a qué objeto apunta un nombre sin schema explícito.

CREATE OR REPLACE FUNCTION public.ping()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT 'pong'::text;
$$;
