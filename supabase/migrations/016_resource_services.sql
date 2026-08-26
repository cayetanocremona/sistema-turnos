-- Sistema de Gestión de Turnos — compatibilidad opcional recurso-servicio
--
-- Backfill: esta tabla ya estaba aplicada en Supabase (migración remota
-- "add_resource_service_compatibility", 20260826172634) antes de que existiera
-- este archivo -- se sumó directo por otra vía, no por el flujo normal de
-- "escribir migración local, el usuario la aplica" (ver AGENTS.md, "Proceso:
-- migraciones de base de datos"). Este archivo es solo para que el historial
-- local quede completo y reconstruible desde cero, mismo criterio que la
-- sesión de "Reconciliación de migraciones" documentada en AGENTS.md.
--
-- Regla de negocio: sin ninguna fila para un resource_id, ese recurso acepta
-- cualquier servicio del negocio (default, compatible con todos los negocios
-- existentes al momento de sumar esta tabla). Con al menos una fila, solo esos
-- servicios son válidos para ese recurso -- la UI (esta tarea, ver AGENTS.md)
-- filtra el selector de servicio en base a esto; la validación real ya vivía
-- de antes en las policies de `appointments` (ver 009/011), esta tabla solo
-- describe qué combinaciones son válidas.
create table resource_services (
  business_id uuid not null references businesses(id) on delete cascade,
  resource_id uuid not null,
  service_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (resource_id, service_id),
  -- FKs compuestas contra (id, business_id) de resources/services: garantizan
  -- que el recurso y el servicio de una fila sean del mismo negocio que
  -- business_id, no solo que existan.
  foreign key (resource_id, business_id) references resources(id, business_id) on delete cascade,
  foreign key (service_id, business_id) references services(id, business_id) on delete cascade
);

comment on table resource_services is
  'Compatibilidad opcional recurso-servicio. Sin filas para un resource_id = acepta cualquier servicio del negocio (default, compatible con negocios existentes). Con al menos una fila = solo esos servicios son válidos para ese recurso.';

alter table resource_services enable row level security;

-- Lectura pública: la necesita el storefront /[slug] para filtrar el
-- selector de servicio sin que el cliente final tenga sesión.
create policy resource_services_select_public
  on resource_services for select
  to public
  using (true);

create policy resource_services_insert_own
  on resource_services for insert
  to authenticated
  with check (
    business_id in (select id from businesses where owner_id = auth.uid())
  );

create policy resource_services_update_own
  on resource_services for update
  to authenticated
  using (
    business_id in (select id from businesses where owner_id = auth.uid())
  )
  with check (
    business_id in (select id from businesses where owner_id = auth.uid())
  );

create policy resource_services_delete_own
  on resource_services for delete
  to authenticated
  using (
    business_id in (select id from businesses where owner_id = auth.uid())
  );
