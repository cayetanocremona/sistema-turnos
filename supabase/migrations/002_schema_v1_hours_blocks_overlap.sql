-- Sistema de Gestión de Turnos — v1
-- Horarios de atención, bloqueos manuales, y anti-solapamiento de turnos.
-- Ya aplicada en el proyecto Supabase remoto vía MCP (project ref zyudlxiclhocvnshygia).

create table business_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0=domingo .. 6=sábado
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  constraint business_hours_time_check check (end_time > start_time)
);

create index idx_business_hours_business on business_hours(business_id);

create table blocked_slots (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references resources(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint blocked_slots_time_check check (end_time > start_time)
);

create index idx_blocked_slots_resource on blocked_slots(resource_id);

create extension if not exists btree_gist;

alter table appointments
  add constraint appointments_no_overlap
  exclude using gist (
    resource_id with =,
    tstzrange(start_time, end_time) with &&
  );
