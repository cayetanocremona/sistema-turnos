-- Sistema de Gestión de Turnos — v3 (parte 1: catálogo de servicios)
-- Catálogo de servicios por negocio: nombre, duración, precio.
--
-- Alcance deliberadamente acotado: esta tabla todavía NO está conectada a
-- appointments (no hay columna service_id ahí). Se agrega el catálogo como
-- pieza de dominio independiente primero (walking skeleton); cómo el cliente
-- elige un servicio al reservar, y cómo eso interactúa con la duración del
-- turno, queda para una iteración siguiente.

create table services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price numeric(10, 2) not null default 0 check (price >= 0),
  created_at timestamptz not null default now()
);

create index idx_services_business on services(business_id);

alter table services enable row level security;

-- Mismo modelo de acceso que resources/business_hours: lectura pública
-- (la va a necesitar la página "/[slug]" para mostrar precios y duración
-- antes de reservar), escritura solo del dueño del negocio.
create policy "services_select_public" on services
  for select using (true);

create policy "services_insert_own" on services
  for insert to authenticated
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "services_update_own" on services
  for update to authenticated
  using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "services_delete_own" on services
  for delete to authenticated
  using (business_id in (select id from businesses where owner_id = auth.uid()));
