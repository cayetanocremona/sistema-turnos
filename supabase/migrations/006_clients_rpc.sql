-- Sistema de Gestión de Turnos — v2 (auditoría de seguridad post-RLS)
-- Aplicada directamente en Supabase desde otra sesión (sin pasar por este repo);
-- este archivo documenta el estado real, ver docs/prompt-clients-rpc.md para el
-- contexto completo. El código de la app se actualizó después, en esta sesión,
-- para usar la RPC en vez de select+insert directo contra `clients`.
--
-- 1) Quedó una policy `temp_open_write_pending_auth` en businesses/resources/
--    business_hours de antes de v2 (escritura pública sin condición) que las
--    policies por dueño de 005_rls_v2.sql no anulaban — RLS combina policies
--    permisivas con OR, así que una sola policy abierta las volvía inútiles a
--    todas. Se eliminó.
--
-- 2) `clients` ya no tiene ninguna policy pública (ni lectura ni escritura).
--    Antes cualquiera con la anon key podía leer nombre/teléfono/email de todos
--    los clientes de la plataforma (limitación que quedó documentada en
--    005_rls_v2.sql). En su lugar: lectura restringida a "clientes que tuvieron
--    un turno en un negocio del dueño logueado", y toda alta/búsqueda de cliente
--    por teléfono pasa por una función `security definer` que sortea RLS
--    deliberadamente (por diseño, ver advisors de Supabase: es two warnings
--    esperados, no un hallazgo nuevo).

drop policy if exists "temp_open_write_pending_auth" on businesses;
drop policy if exists "temp_open_write_pending_auth" on resources;
drop policy if exists "temp_open_write_pending_auth" on business_hours;

drop policy if exists "clients_select_public" on clients;
drop policy if exists "clients_insert_public" on clients;

create policy "clients_select_own_business" on clients
  for select to authenticated
  using (
    id in (
      select appointments.client_id from appointments
      where appointments.business_id in (
        select id from businesses where owner_id = auth.uid()
      )
    )
  );

create or replace function upsert_client(p_name text, p_phone text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id from clients where phone = p_phone;
  if v_id is not null then
    return v_id;
  end if;

  insert into clients (name, phone) values (p_name, p_phone)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function upsert_client(text, text) to anon, authenticated;
