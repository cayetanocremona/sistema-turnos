-- Sistema de Gestión de Turnos — v3 (parte 3: conectar catálogo de servicios a turnos)
--
-- Backfill: esta migración ya estaba aplicada en el proyecto remoto (versión
-- 20260819160503, "appointments_insert_anon_validate_shape") desde otra sesión,
-- sin el archivo local correspondiente. Se agrega ahora, sin volver a aplicarla,
-- para que el historial de supabase/migrations/ quede completo (gap ya
-- documentado en AGENTS.md bajo "Estado actual / próxima tarea").
--
-- Hallazgo de auditoría: la policy de INSERT para anon (reserva pública) tenía
-- with_check = true, sin ninguna validación. Cualquiera con la anon key podía
-- insertar un turno con business_id/resource_id que no tuvieran relación entre sí
-- (ej. resource de otro negocio), llamando directo a la API REST de Supabase
-- sin pasar por la app. Se ajusta para exigir que resource_id (y service_id, si
-- viene) realmente pertenezcan al business_id declarado. Sigue sin requerir
-- autenticación (la reserva pública debe seguir funcionando para anon) y no
-- agrega rate limiting (eso queda para más adelante si aparece spam real).
drop policy if exists appointments_insert_anon on public.appointments;

create policy appointments_insert_anon
  on public.appointments
  for insert
  to anon
  with check (
    resource_id in (select id from public.resources where business_id = appointments.business_id)
    and (
      service_id is null
      or service_id in (select id from public.services where business_id = appointments.business_id)
    )
  );
