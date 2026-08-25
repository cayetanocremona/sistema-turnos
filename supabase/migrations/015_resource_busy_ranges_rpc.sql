-- Sistema de Gestión de Turnos — RPC de disponibilidad pública
--
-- El rediseño del selector de fecha/hora (tira de días + lista de horarios,
-- ver AGENTS.md) necesita saber qué horarios de un recurso ya están ocupados
-- para no ofrecerlos en la grilla -- si se ofrecen igual y recién al confirmar
-- tira el error de solapamiento (23P01), la fricción que se quería sacar
-- vuelve por otro lado.
--
-- Pero `appointments` no tiene lectura pública (solo el dueño logueado puede
-- hacer SELECT, ver 005_rls_v2.sql) -- expone nombre y teléfono del cliente,
-- que no es dato público. Esta función security definer bypassa RLS a
-- propósito (mismo patrón que upsert_client, ver 006_clients_rpc.sql) pero
-- devuelve solo start_time/end_time de turnos confirmados de UN recurso
-- puntual en un rango acotado -- nunca datos de cliente, nunca de otros
-- recursos o negocios. Quien la llama ya necesita conocer el resource_id
-- (viene de una lectura pública de `resources`), así que no filtra nada que
-- no fuera ya inferible a prueba y error reservando un horario y viendo si
-- rebota -- solo evita esa fricción.
create or replace function get_resource_busy_ranges(
  p_resource_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (start_time timestamptz, end_time timestamptz)
language sql
security definer
set search_path = public
as $$
  select a.start_time, a.end_time
  from appointments a
  where a.resource_id = p_resource_id
    and a.status = 'confirmed'
    and a.start_time < p_to
    and a.end_time > p_from;
$$;

grant execute on function get_resource_busy_ranges(uuid, timestamptz, timestamptz) to anon, authenticated;
