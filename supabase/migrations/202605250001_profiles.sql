create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  division text not null default '',
  role text not null default 'Usuario de Consulta',
  crear_usuarios boolean not null default false,
  subir_archivos boolean not null default false,
  modificar_archivos boolean not null default false,
  eliminar_archivos boolean not null default false,
  ver_otras_divisiones boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_owner"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "profiles_update_owner"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
