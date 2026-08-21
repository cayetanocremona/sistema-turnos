-- Sistema de Gestión de Turnos — v2 (parte 3)
-- Row Level Security multi-tenant. Ya aplicada en el proyecto Supabase remoto vía MCP.
--
-- Modelo de acceso:
-- - businesses / resources / business_hours / blocked_slots: lectura pública (las
--   necesita la página pública "/[slug]" para mostrar el negocio y validar la reserva
--   sin sesión), escritura solo del dueño (owner_id = auth.uid(), vía business_id).
-- - clients: tabla global sin dueño (decisión de diseño para Fase 2 — un mismo
--   teléfono puede reservar en varios negocios). Lectura y alta abiertas a cualquiera,
--   porque la reserva pública necesita buscar/crear un cliente por teléfono sin sesión.
--   LIMITACIÓN DE SEGURIDAD CONOCIDA: cualquiera con la anon key puede leer
--   nombre/teléfono/email de TODOS los clientes de la plataforma. Resolverlo requiere
--   cambiar el modelo (ej. una función RPC que solo confirme "existe/no existe" en vez
--   de exponer la fila) — no se resuelve en este paso, queda documentado como deuda.
-- - appointments: la única tabla realmente privada por negocio. Lectura y edición
--   restringidas al dueño; el alta pública (reserva de un cliente) sigue abierta para
--   el rol anon, pero un usuario autenticado solo puede crear turnos en sus propios
--   negocios (separado en dos policies por rol para no aflojar esa restricción).

alter table businesses enable row level security;
alter table resources enable row level security;
alter table business_hours enable row level security;
alter table blocked_slots enable row level security;
alter table clients enable row level security;
alter table appointments enable row level security;

-- businesses
create policy "businesses_select_public" on businesses
  for select using (true);

create policy "businesses_insert_own" on businesses
  for insert to authenticated
  with check (owner_id = auth.uid());

create policy "businesses_update_own" on businesses
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "businesses_delete_own" on businesses
  for delete to authenticated
  using (owner_id = auth.uid());

-- resources
create policy "resources_select_public" on resources
  for select using (true);

create policy "resources_insert_own" on resources
  for insert to authenticated
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "resources_update_own" on resources
  for update to authenticated
  using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "resources_delete_own" on resources
  for delete to authenticated
  using (business_id in (select id from businesses where owner_id = auth.uid()));

-- business_hours
create policy "business_hours_select_public" on business_hours
  for select using (true);

create policy "business_hours_insert_own" on business_hours
  for insert to authenticated
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "business_hours_update_own" on business_hours
  for update to authenticated
  using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "business_hours_delete_own" on business_hours
  for delete to authenticated
  using (business_id in (select id from businesses where owner_id = auth.uid()));

-- blocked_slots (owner vía resource_id -> business_id)
create policy "blocked_slots_select_public" on blocked_slots
  for select using (true);

create policy "blocked_slots_insert_own" on blocked_slots
  for insert to authenticated
  with check (
    resource_id in (
      select r.id from resources r
      join businesses b on b.id = r.business_id
      where b.owner_id = auth.uid()
    )
  );

create policy "blocked_slots_update_own" on blocked_slots
  for update to authenticated
  using (
    resource_id in (
      select r.id from resources r
      join businesses b on b.id = r.business_id
      where b.owner_id = auth.uid()
    )
  )
  with check (
    resource_id in (
      select r.id from resources r
      join businesses b on b.id = r.business_id
      where b.owner_id = auth.uid()
    )
  );

create policy "blocked_slots_delete_own" on blocked_slots
  for delete to authenticated
  using (
    resource_id in (
      select r.id from resources r
      join businesses b on b.id = r.business_id
      where b.owner_id = auth.uid()
    )
  );

-- clients (global, ver limitación documentada arriba)
create policy "clients_select_public" on clients
  for select using (true);

create policy "clients_insert_public" on clients
  for insert with check (true);

-- appointments (privado por negocio)
create policy "appointments_select_own" on appointments
  for select to authenticated
  using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "appointments_insert_anon" on appointments
  for insert to anon
  with check (true);

create policy "appointments_insert_owner" on appointments
  for insert to authenticated
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "appointments_update_own" on appointments
  for update to authenticated
  using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "appointments_delete_own" on appointments
  for delete to authenticated
  using (business_id in (select id from businesses where owner_id = auth.uid()));
