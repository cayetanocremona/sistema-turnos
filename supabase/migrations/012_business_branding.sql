-- Sistema de Gestión de Turnos — branding por negocio (presets configurables)
--
-- Decisión de arquitectura (acordada con el Tech Lead): un sistema de presets
-- cerrados, no una página a medida por negocio. `brand_color` es el único
-- valor libre que elige el dueño; el resto del look (tipografía, tratamiento
-- de portada, etc.) lo define `brand_style_preset` en el código de
-- `src/app/[slug]/`. Así escala a negocio #3, #4, etc. sin tocar código de
-- nuevo -- alta de un negocio nuevo es solo una fila.
--
-- `brand_style_preset` es un enum cerrado (CHECK, no texto libre) a propósito:
-- un valor inválido ahí rompería silenciosamente el theming de la página
-- pública en vez de fallar rápido al insertar. 'clasico' es el default y
-- reproduce el look actual sin cambios -- ya hay 3 negocios reales en la base
-- y ninguno debe romperse visualmente con esta migración.
--
-- `logo_url`/`hero_image_url` nullable a propósito: sin imagen cargada, la UI
-- genera un placeholder (badge circular con iniciales / monograma) en vez de
-- romperse o mostrar un ícono roto.
--
-- No hace falta tocar RLS: las policies de `businesses`
-- (`businesses_select_public`, `businesses_update_own`) no son column-level,
-- así que ya cubren estas columnas nuevas.

alter table public.businesses
  add column brand_color text not null default '#111827',
  add column brand_style_preset text not null default 'clasico',
  add column logo_url text,
  add column hero_image_url text;

alter table public.businesses
  add constraint businesses_brand_color_format check (brand_color ~ '^#[0-9a-fA-F]{6}$');

alter table public.businesses
  add constraint businesses_brand_style_preset_check check (brand_style_preset in ('clasico','elegante','deportivo','minimal'));
