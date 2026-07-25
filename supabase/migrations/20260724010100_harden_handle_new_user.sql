-- Endurece handle_new_user() (trigger de Supabase Auth que crea el
-- perfil en public.usuarios al registrarse un usuario nuevo):
--   1. Fija search_path (cierra "Function Search Path Mutable").
--   2. Quita EXECUTE a anon/authenticated (cierra "Public Can Execute
--      SECURITY DEFINER Function"). No afecta el disparo del trigger,
--      que no depende de este permiso — solo impide que alguien la
--      invoque directo vía /rest/v1/rpc/handle_new_user.

ALTER FUNCTION public.handle_new_user() SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
