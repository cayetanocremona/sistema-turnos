-- Sistema de Gestión de Turnos — v3 (parte 4: cancelar/reagendar turnos)
--
-- Backfill: estos dos cambios ya están aplicados en el proyecto remoto, pero
-- se hicieron con un execute_sql directo en la misma sesión que el fix del
-- EXCLUDE parcial (010_appointments_no_overlap_only_confirmed.sql) y nunca
-- quedaron registrados -- ni como archivo local ni en list_migrations de
-- Supabase. Este archivo cierra ese gap (auditoría de reconciliación de
-- migraciones, ver AGENTS.md "Estado actual").
--
-- 1) `appointments_status_check`: antes `status` no tenía ningún CHECK, solo
--    un default ('confirmed'). Sin esto, nada impedía que apareciera un
--    status distinto de 'confirmed'/'cancelled' (typo en un update manual,
--    futuro bug de la app) y que el EXCLUDE parcial de 010
--    (WHERE status = 'confirmed') dejara de proteger ese turno sin que nadie
--    lo notara.
--
-- 2) `appointments_insert_owner` / `appointments_update_own`: la policy de
--    alta pública (`appointments_insert_anon`, ver 009) ya exigía que
--    resource_id/service_id pertenecieran al business_id declarado. Esa
--    misma validación de "shape" faltaba en las dos policies del lado
--    autenticado -- el dueño logueado podía, en teoría, crear o reagendar un
--    turno propio (business_id correcto) apuntando a un resource_id o
--    service_id de OTRO negocio. Se corrige agregando la misma condición.

alter table appointments
  add constraint appointments_status_check
  check (status = any (array['confirmed', 'cancelled']));

drop policy if exists appointments_insert_owner on public.appointments;

create policy appointments_insert_owner
  on public.appointments
  for insert
  to authenticated
  with check (
    business_id in (select id from businesses where owner_id = auth.uid())
    and resource_id in (select id from public.resources where business_id = appointments.business_id)
    and (
      service_id is null
      or service_id in (select id from public.services where business_id = appointments.business_id)
    )
  );

drop policy if exists appointments_update_own on public.appointments;

create policy appointments_update_own
  on public.appointments
  for update
  to authenticated
  using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (
    business_id in (select id from businesses where owner_id = auth.uid())
    and resource_id in (select id from public.resources where business_id = appointments.business_id)
    and (
      service_id is null
      or service_id in (select id from public.services where business_id = appointments.business_id)
    )
  );
