-- Sistema de Gestión de Turnos — v2 (parte 1: login del dueño de negocio)
--
-- Backfill: esta migración ya estaba aplicada en el proyecto remoto (versión
-- 20260818150841, "business_owner_id") desde antes de que el repo tuviera
-- control de versiones. Se agrega ahora, sin volver a aplicarla, para que
-- 005_rls_v2.sql (que ya usa `owner_id` en sus policies) tenga la columna
-- que necesita si alguien reconstruye el esquema desde cero — sin este
-- archivo, correr las migraciones locales en orden rompía en 005 porque
-- la columna no existía todavía.
--
-- Nullable a propósito: los negocios de prueba creados en v0/v1 (antes de
-- que existiera Auth) no tienen dueño asignado. `ON DELETE SET NULL` en vez
-- de CASCADE: si se borra la cuenta de un dueño, el negocio y su historial
-- de turnos no deberían desaparecer con él.

alter table businesses
  add column owner_id uuid references auth.users(id) on delete set null;

create index idx_businesses_owner on businesses(owner_id);
