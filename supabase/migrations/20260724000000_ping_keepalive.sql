-- Función RPC de keep-alive: evita que Supabase pause el proyecto (Plan Free)
-- por 7 días de inactividad. Se invoca externamente desde GitHub Actions
-- (.github/workflows/keep_alive.yml) con el ANON_KEY. No lee ni modifica
-- datos de la aplicación.

CREATE OR REPLACE FUNCTION public.ping()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT 'pong'::text;
$$;

-- Se otorga explícito en vez de depender del default de Postgres,
-- ya que este proyecto revoca privilegios agresivamente (ver migraciones de RLS).
GRANT EXECUTE ON FUNCTION public.ping() TO anon;
