-- Sistema de Gestión de Turnos — v3 (parte 3: conectar catálogo de servicios a turnos)
--
-- Backfill: esta migración ya estaba aplicada en el proyecto remoto (versión
-- 20260819160427, "appointments_service_id") desde otra sesión, sin el archivo
-- local correspondiente. Se agrega ahora, sin volver a aplicarla, para que el
-- historial de supabase/migrations/ quede completo (gap ya documentado en
-- AGENTS.md bajo "Estado actual / próxima tarea").
--
-- Conecta el catálogo de servicios con los turnos reales.
-- Nullable a propósito: hay turnos históricos de prueba sin servicio asignado,
-- y no tiene sentido inventarles uno. La app (Server Actions) debe exigirlo
-- como obligatorio para turnos NUEVOS cuando el negocio tiene catálogo cargado;
-- la base de datos permite el histórico.
alter table public.appointments
  add column service_id uuid references public.services(id) on delete set null;

create index if not exists appointments_service_id_idx
  on public.appointments (service_id);
