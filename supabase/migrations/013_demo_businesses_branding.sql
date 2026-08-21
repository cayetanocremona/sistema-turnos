-- Sistema de Gestión de Turnos — 2 negocios de demo para mostrarle a prospectos
--
-- "Estilo Urbano" (peluquería, preset "elegante") y "La Bombonerita F5"
-- (cancha de fútbol 5, preset "deportivo") -- pensados para probar/mostrar el
-- sistema de branding en dos rubros bien distintos. `owner_id` queda null a
-- propósito: son solo para mostrar el flujo público de reserva (/[slug]), no
-- tienen dueño logueado todavía.
--
-- Idempotente: cada bloque chequea que el slug no exista antes de insertar,
-- para poder re-correr esta migración sin duplicar datos.

do $$
declare
  v_business_id uuid;
begin
  if not exists (select 1 from public.businesses where slug = 'estilo-urbano') then
    insert into public.businesses (name, slug, brand_color, brand_style_preset)
    values ('Estilo Urbano', 'estilo-urbano', '#c9973f', 'elegante')
    returning id into v_business_id;

    insert into public.resources (business_id, name)
    values (v_business_id, 'Silla 1');

    -- Martes(2) a sábado(6), 10:00-19:00 -- cerrado domingo(0) y lunes(1).
    insert into public.business_hours (business_id, day_of_week, start_time, end_time)
    select v_business_id, dow, '10:00', '19:00'
    from unnest(array[2, 3, 4, 5, 6]) as dow;

    insert into public.services (business_id, name, duration_minutes, price)
    values
      (v_business_id, 'Corte clásico', 30, 8000),
      (v_business_id, 'Coloración', 90, 25000),
      (v_business_id, 'Barba', 20, 4000);
  end if;
end $$;

do $$
declare
  v_business_id uuid;
begin
  if not exists (select 1 from public.businesses where slug = 'la-bombonerita-f5') then
    insert into public.businesses (name, slug, brand_color, brand_style_preset)
    values ('La Bombonerita F5', 'la-bombonerita-f5', '#2f8f52', 'deportivo')
    returning id into v_business_id;

    insert into public.resources (business_id, name)
    values
      (v_business_id, 'Cancha 1'),
      (v_business_id, 'Cancha 2 (techada)'),
      (v_business_id, 'Cancha 3');

    -- Todos los días, 09:00-23:00.
    insert into public.business_hours (business_id, day_of_week, start_time, end_time)
    select v_business_id, dow, '09:00', '23:00'
    from unnest(array[0, 1, 2, 3, 4, 5, 6]) as dow;

    insert into public.services (business_id, name, duration_minutes, price)
    values
      (v_business_id, 'Cancha 1', 60, 15000),
      (v_business_id, 'Cancha 2 (techada)', 60, 18000),
      (v_business_id, 'Cancha 3', 60, 15000);
  end if;
end $$;
