# Supabase

Esta carpeta contiene la configuración y las migraciones de la base de datos para ArchivaTEC.

## Estructura

- `config.toml`: configuración local del proyecto de Supabase.
- `migrations/`: migraciones SQL versionadas.
- `seed.sql`: datos iniciales para el entorno de desarrollo.

## Flujo de actualización

1. Edita o agrega una migración en `supabase/migrations/` (nombre `YYYYMMDDHHMMSS_descripcion.sql`, mismo estilo que las existentes).
2. Si necesitas datos iniciales, actualiza `supabase/seed.sql`.
3. Sube tu rama y abre un Pull Request (ver flujo de trabajo en el [README principal](../README.md#-flujo-de-trabajo-en-equipo)).

> ⚠️ **No existe CI que aplique migraciones automáticamente** a la base remota — el workflow que hacía eso (`supabase db push --linked`) fue eliminado. Después de mergear el PR, alguien con acceso tiene que aplicar el SQL manualmente: pegándolo en el **SQL Editor** del dashboard de Supabase, o pidiéndole a Claude que lo aplique directo si tiene conexión MCP al proyecto.

## Comandos útiles

```bash
# Iniciar el entorno local de Supabase
supabase start

# Ver el estado del proyecto
supabase status

# Aplicar migraciones locales
supabase db reset

# Aplicar el seed remoto desde el workflow
supabase db query --linked --file supabase/seed.sql

# Generar una nueva migración desde cambios en el schema
supabase db diff --schema public
```
