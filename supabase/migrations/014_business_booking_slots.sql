-- Sistema de Gestión de Turnos — grilla fija de horarios + ventana de reserva
--
-- Backfill: estas dos columnas ya fueron aplicadas directo en Supabase desde
-- una sesión sin acceso al repo local (mismo patrón que 004_business_owner_id.sql
-- -- ver AGENTS.md "Reconciliación de migraciones"). Este archivo documenta el
-- cambio para que clonar el repo y correr las migraciones en orden reconstruya
-- el mismo esquema.
--
-- Por qué dos columnas configurables por negocio y no una regla hardcodeada:
-- mismo criterio que ya se usó en todo el proyecto (horarios de atención por
-- negocio, brand_color por negocio) -- un gimnasio y una peluquería van a
-- querer valores de grilla/ventana distintos.
--
-- `slot_interval_minutes` (default 30): granularidad de los horarios que se
-- ofrecen al reservar (17:00, 17:30, ... en vez de cualquier minuto).
-- `booking_window_days` (default 60): cuántos días hacia adelante se puede
-- reservar desde hoy -- resuelve de forma general el problema de "seleccionar
-- un año que no corresponde" sin lógica especial de fin de año.

alter table businesses
  add column slot_interval_minutes integer not null default 30
    check (slot_interval_minutes > 0),
  add column booking_window_days integer not null default 60
    check (booking_window_days > 0);
