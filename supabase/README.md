# Supabase

Esta carpeta contiene la configuración y las migraciones de la base de datos para ArchivaTEC.

## Estructura

- `config.toml`: configuración local del proyecto de Supabase.
- `migrations/`: migraciones SQL versionadas.
- `seed.sql`: datos iniciales para el entorno de desarrollo.

## Flujo de actualización

1. Edita o agrega una migración en `supabase/migrations/`.
2. Si necesitas datos iniciales, actualiza `supabase/seed.sql`.
3. Haz push a `main`.
4. El workflow de GitHub Actions ejecuta `supabase db push --linked` y luego aplica `supabase/db query --linked --file supabase/seed.sql` para dejar el entorno remoto en estado consistente.

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
