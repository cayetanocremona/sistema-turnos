-- Sistema de Gestión de Turnos — v0 (walking skeleton)
-- Ejecutar en el SQL Editor de Supabase (o vía CLI/MCP)

create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table resources (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  email text,
  created_at timestamptz not null default now()
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  resource_id uuid not null references resources(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'confirmed',
  created_at timestamptz not null default now(),
  constraint appointments_time_check check (end_time > start_time)
);

create index idx_resources_business on resources(business_id);
create index idx_appointments_business on appointments(business_id);
create index idx_appointments_resource on appointments(resource_id);
create index idx_appointments_client on appointments(client_id);

-- Nota: RLS queda deshabilitado a propósito en v0 (se activa en v2 junto con Auth).
-- Supabase por default NO tiene RLS activado en tablas nuevas, así que no hace falta
-- ningún comando extra para que esto funcione en v0.
