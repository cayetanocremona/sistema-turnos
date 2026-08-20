<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Contexto del proyecto — Sistema de Gestión de Turnos

Actuá como Tech Lead del usuario. Es estudiante de ingeniería en sistemas: priorizá explicar el porqué de las decisiones técnicas, no solo tirar código. Priorizá siempre herramientas de nivel free tier.

## Requisito del dueño del proyecto (Cayetano)
Soy estudiante de ingeniería en sistemas (~1.5 años de cursada) y voy a vender este sistema a dueños de negocios reales, así que necesito poder explicar y defender cómo funciona, no solo que funcione. Cuando una tarea toque algo con impacto de cara al negocio o al cliente final — seguridad de datos, costos, comportamiento ante fallos, por qué se eligió una solución y no otra — explicámelo en el reporte de la tarea: qué se hizo, por qué, y qué pasaría si no se hacía. Si el concepto de fondo es grande (por ejemplo un mecanismo de Postgres/Supabase, un protocolo de auth, etc.), no hace falta que me des un curso completo: una explicación corta aplicada al caso + un recurso externo (doc oficial o video) para profundizar por mi cuenta alcanza. Si es una decisión puramente interna de implementación sin impacto de negocio, no hace falta parar a explicar nada.

## Qué es esto
Sistema de gestión de reservas/turnos genérico y agnóstico al rubro (sirve para canchas, clínicas, salones, consultorios, etc. — no es específico de ningún negocio).

- **Fase 1** (actual): plataforma web — panel de administración para dueños de negocio + web pública para que el cliente final saque turno.
- **Fase 2** (futura): asistente conversacional por WhatsApp Cloud API + LLM, consumiendo la misma base de datos de Fase 1.

## Stack
- Frontend/backend: Next.js (TypeScript, App Router, **sin Tailwind** — estilos inline por ahora, no asumas Tailwind).
- Base de datos / BaaS: Supabase (Postgres + Auth + Storage), plan free tier.
  - Proyecto: `sistema-turnos`, project ref `zyudlxiclhocvnshygia`, región `sa-east-1` (São Paulo).
  - Dashboard: https://supabase.com/dashboard/project/zyudlxiclhocvnshygia
  - Cliente en `src/lib/supabaseClient.ts`, usa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` desde `.env.local` (ya creado, no lo pises).
- Deploy futuro: Vercel o Netlify (free tier).

## Filosofía de desarrollo
Incremental: arrancar con lo más simple posible (walking skeleton) y sumar complejidad de a poco. No adelantes funcionalidad de una versión futura sin que se hable primero.

## Roadmap
- **v0 (listo):** schema mínimo, sin Auth, sin RLS, sin validación de horarios. La página `/` lee y escribe en `businesses` — objetivo era solo probar que Next.js y Supabase se conectan.
- **v1 (listo):** `business_hours` (horarios de atención) + `blocked_slots` (bloqueos manuales) + constraint `EXCLUDE` (con `btree_gist`) para prevenir solapamiento de turnos sobre el mismo `resource_id`.
- **v2 (listo):** Supabase Auth (login del dueño de negocio) + Row Level Security multi-tenant.
  - Parte 1: login por magic link + columna `owner_id` en `businesses`.
  - Parte 2: la página `/` quedó auth-aware — gestionar recursos/horarios/bloqueos/turnos requiere sesión y queda restringido a los negocios propios del dueño logueado (no se rediseñó la UI, es la misma página de v1, ahora con las Server Actions cableadas al cliente autenticado y filtradas por `owner_id`).
  - Parte 3: políticas RLS multi-tenant en las 6 tablas, en `supabase/migrations/004_rls_v2.sql`.
  - Auditoría post-RLS: se encontró y corrigió una policy vieja que anulaba las restricciones nuevas, y `clients` pasó a usar una función RPC `upsert_client` en vez de exponer lectura/escritura pública — ver `supabase/migrations/005_clients_rpc.sql` y "Estado actual / próxima tarea" abajo.
- **v3 (listo):** catálogo de servicios (duración, precio), conectado a la reserva real de turnos, + panel de administración real en rutas dedicadas `/admin/*` (en vez de la página única `/`) — ver "Estado actual" abajo.
- **v4 (Fase 2):** integración WhatsApp Cloud API sobre esta misma base.

## Modelo de datos v0
Detalle completo y razonamiento en `docs/schema-diseno-v0.md` y diagrama en `docs/schema-v0.mermaid`. Ya aplicado en Supabase vía `supabase/migrations/001_schema_v0.sql`.

- `businesses(id, name, slug unique, created_at)`
- `resources(id, business_id FK, name, created_at)` — lo que efectivamente se reserva: cancha, sillón, box, profesional. Es la pieza clave de la abstracción agnóstica al rubro.
- `clients(id, name, phone unique, email, created_at)` — **clientes globales, NO atados a un negocio.** Decisión deliberada pensando en Fase 2: un mismo número de WhatsApp puede interactuar con varios negocios de la plataforma.
- `appointments(id, business_id FK denormalizado, resource_id FK, client_id FK, start_time, end_time, status default 'confirmed', created_at)`

## Convenciones
- Nombres de tablas/columnas: snake_case, en inglés.
- Código de la app (componentes, variables, funciones): en inglés.
- Comentarios, docs y respuestas al usuario: en español (el usuario es hispanohablante, Argentina).
- Cuando una tarea cambie algo relevante de arquitectura o decisiones, actualizá el doc correspondiente en `docs/`.

## Proceso: migraciones de base de datos
Este entorno tiene conexión MCP a Supabase, directo contra el proyecto `sistema-turnos` (mismo project ref de arriba) — no es una posibilidad teórica, se usó en sesiones anteriores para aplicar cambios reales (ver "Estado actual" abajo). Incluye tools de lectura (`list_tables`, `list_migrations`, `get_advisors`, `execute_sql` de solo lectura) y de escritura (`apply_migration`, `execute_sql` de escritura).

- **Lectura/auditoría: libre.** Usalas para investigar el estado real de la base (schema, políticas RLS, migraciones aplicadas) cuando haga falta.
- **Escritura: nunca directo contra Supabase remoto sin que el usuario lo pida explícitamente en el chat.** Todo cambio de esquema/policy se escribe como archivo nuevo en `supabase/migrations/` (numerado, con comentario explicando el porqué) y lo aplica el usuario desde su lado. Es deliberado: así puede auditarlo antes de que quede en producción, que es justamente cómo se encontraron los dos problemas de RLS de v2 (ver `docs/prompt-clients-rpc.md`).

## Estado actual / próxima tarea
v3 parte 3 (catálogo de servicios conectado a la reserva real) lista:

- **Cálculo de `end_time`:** ahora se deriva en el servidor como `start_time + duration_minutes` del servicio elegido (`addMinutesToInstant` en `src/lib/datetime.ts`), en vez de que el dueño/cliente lo escriba a mano — el cliente nunca manda un `end_time` propio cuando hay servicio de por medio, así no puede falsificarlo.
- **`service_id` en `appointments`:** columna nullable con `on delete set null`, migración `supabase/migrations/007_appointments_service_id.sql`. RLS de alta pública ajustada para exigir que `resource_id`/`service_id` pertenezcan al `business_id` declarado, migración `supabase/migrations/008_appointments_insert_anon_validate_shape.sql` — ambas ya estaban aplicadas en Supabase desde el pedido de esta tarea (ver mensaje del usuario), los archivos locales son backfill para que el historial quede completo (cierra parte del gap de la nota de v3 parte 1, abajo).
- **Negocio sin catálogo de servicios:** no se bloquea la reserva. El form (público en `/[slug]` y el de `/admin/appointments`) cae al modo manual de v1/v2 (`start_time`+`end_time` a mano, `service_id` null) mientras el negocio no tenga servicios cargados; en cuanto carga al menos uno, el form exige elegir un servicio y el campo `end_time` desaparece porque se calcula solo. Decisión de producto completa en `docs/schema-diseno-v3.md`.
- **Alcance:** el servicio elegido es independiente del recurso — cualquier servicio del negocio se puede reservar en cualquier recurso del negocio, sin tabla puente. Si en el futuro hace falta acotar qué servicios ofrece cada recurso, es un cambio de esquema nuevo, no de este.
- **Hallazgo de auditoría (no buscado, apareció al escribir la policy nueva):** la policy de alta pública de `appointments` tenía `with_check = true` sin validar nada — cualquiera con la anon key podía insertar un turno con `resource_id` de otro negocio llamando directo a la API REST de Supabase, sin pasar por la app. Ya corregido en `008_appointments_insert_anon_validate_shape.sql`.
- Verificado: `npm run lint` y `npm run build` sin errores. Probado de punta a punta en el browser contra "Negocio de Prueba": con un servicio de prueba (30 min, $1500) cargado temporalmente vía SQL (con permiso explícito del usuario en el chat, borrado al terminar), la reserva pública calculó `end_time` correctamente (start + 30 min, verificado en la base) y guardó el `service_id`; un segundo intento a un horario que pisaba un turno ya existente en el mismo recurso fue rechazado por el constraint `appointments_no_overlap`, como antes. **Falta probar a mano el flujo logueado desde `/admin/appointments`** (mismo límite de siempre: login por magic link, no automatizable en esta sesión) — el código es simétrico al de la reserva pública (mismo cálculo de `end_time`, misma Server Action `addAppointment` extendida), pero no se ejecutó ese camino específico en el browser.

v3 parte 2 (panel de administración real en `/admin/*`) lista:

- **Rutas nuevas:** `src/app/admin/{layout,page,actions,data}.ts` + una carpeta por sección (`businesses`, `resources`, `services`, `hours`, `blocked-slots`, `appointments`), cada una con su propio `page.tsx`. Razonamiento completo en `docs/admin-panel-v3.md`.
- **Guard de sesión centralizado:** `admin/layout.tsx` hace `redirect("/login")` si no hay usuario — ninguna página hija repite el chequeo `if (!user)` que antes estaba duplicado en cada sección de la página única.
- **Server Actions centralizadas:** todas las mutaciones (`addBusiness`, `addResource`, `addService`, `addBusinessHour`, `addBlockedSlot`, `addAppointment`, `signOut`) se movieron a `admin/actions.ts`, sin cambios de lógica (la verificación de `owner_id` antes de insertar sigue igual, como defensa en profundidad además de RLS).
- **`/` quedó solo como landing pública:** directorio de negocios (nombre + link `/slug`) y, si hay sesión, un link a `/admin`. Ya no gestiona recursos/servicios/horarios/bloqueos/turnos — eso vive únicamente en `/admin/*` ahora.
- **Redirect post-login:** `src/app/auth/callback/route.ts` ahora manda a `/admin` en vez de `/` (es el destino real del dueño después de loguearse).
- **`admin` como slug reservado:** ya estaba en `RESERVED_SLUGS` desde v1 (pensado justo para este momento), así que ningún negocio puede pisar la ruta con su propio slug.
- Verificado: `npm run lint` y `npm run build` sin errores (13 rutas generadas, incluidas las 8 de `/admin/*`). Probado en el browser sin sesión: `/` muestra el directorio correctamente, `/admin` redirige a `/login`, y `/[slug]` (reserva pública) sigue funcionando sin cambios. **Falta probar a mano el flujo logueado** (crear negocio/recurso/servicio/horario/bloqueo/turno desde las páginas nuevas) — no se pudo automatizar en esta sesión porque el login es por magic link (requiere abrir el mail), mismo límite que quedó registrado en v3 parte 1.

v3 parte 1 (catálogo de servicios) lista:

- **Tabla `services`:** `business_id`, `name`, `duration_minutes` (check > 0), `price` numeric(10,2) (check >= 0). Migración `supabase/migrations/006_services_v3.sql`, razonamiento completo en `docs/schema-diseno-v3.md`.
- **RLS:** mismo modelo que `resources`/`business_hours` — lectura pública, escritura solo del dueño del negocio.
- **Alcance en su momento acotado, ya conectado en v3 parte 3:** el catálogo se gestiona en `/admin/services` (movido ahí en v3 parte 2 — misma sesión/`owner_id` que Recursos) y desde v3 parte 3 (arriba) ya está conectado a `appointments` y a la reserva pública en `/[slug]` — ver "v3 parte 3" arriba.
- **Moneda:** `price` asume ARS sin columna de moneda, mismo criterio que el timezone default. Documentado como deuda si el sistema se vende fuera de Argentina.
- Verificado: `npm run lint` y `npm run build` sin errores. Insert/delete de prueba contra Supabase (vía SQL directo, bypass RLS) confirmó los constraints (`duration_minutes > 0`, `price >= 0`, FK a `businesses`). La sección "Servicios" se probó en el browser en estado deslogueado (mensaje correcto de "iniciá sesión"), sin errores de consola ni de servidor. **Falta probar a mano el flujo logueado** (crear un servicio real desde el form) — no se pudo automatizar en esta sesión porque el login es por magic link (requiere abrir el mail).
- **Nota aparte, no bloqueante:** el proyecto remoto de Supabase tiene migraciones aplicadas que no están en `supabase/migrations/` local — verificado con `list_migrations` vía MCP: `business_owner_id`, `debug_whoami_temp` + su rollback `drop_debug_whoami_temp`, `drop_duplicate_public_select_policies` (la limpieza de policies duplicadas que había quedado pendiente en el reporte de v2), y una más no documentada hasta ahora, `public_read_rls_storefront_tables` (del arranque de v1, ver `docs/prompt-routing.md` — quedó totalmente superada por `004_rls_v2.sql`, no tiene efecto hoy). Sería bueno en algún momento bajar esas migraciones a archivos locales para que el historial quede completo, pero no afecta el funcionamiento actual. **Actualización v3 parte 3:** las dos migraciones remotas de esa tarea (`appointments_service_id`, `appointments_insert_anon_validate_shape`) ya se bajaron a `007_appointments_service_id.sql`/`008_appointments_insert_anon_validate_shape.sql` porque eran las que esta tarea necesitaba explicar; las 4 de este párrafo (más viejas, sin relación con el trabajo de esta sesión) siguen pendientes. Ver "Proceso: migraciones de base de datos" arriba — de acá en más este tipo de gap no debería repetirse.

v2 completa (login + dashboard auth-aware + RLS):

- **Auth:** magic link con Supabase Auth (sin contraseñas). Cliente de browser en `src/lib/supabase/client.ts` (`createBrowserClient`), cliente de servidor en `src/lib/supabase/server.ts` (`createServerClient`, cookies vía `next/headers`). Dependencia nueva: `@supabase/ssr`.
- **Refresh de sesión:** `src/proxy.ts` (⚠️ en Next.js 16 `middleware.ts` está deprecado y renombrado a `proxy.ts`/`export function proxy` — mismo comportamiento, otro nombre de archivo/export; va en `src/` porque `app/` vive en `src/app/`).
- **Login:** `src/app/login/page.tsx` (Client Component, `signInWithOtp`) + `src/app/auth/callback/route.ts` (Route Handler, `exchangeCodeForSession`, redirige a `/`).
- **`businesses.owner_id`:** columna `uuid references auth.users(id)`, nullable (los 2 negocios de prueba originales quedaron con `owner_id` null; "Negocio de Prueba" se le asignó al usuario vía SQL para poder probar). `addBusiness` exige sesión y setea `owner_id: user.id`.
- **Página `/` auth-aware:** las Server Actions de `resources`/`business_hours`/`blocked_slots`/`appointments` ahora usan el cliente de servidor autenticado (antes usaban el anónimo) y verifican que el `business_id` pertenezca al usuario logueado antes de insertar. Los formularios y listados de esas 4 secciones se filtran a `myBusinessList`/`myResourceList` (los negocios del dueño logueado) y se ocultan si no hay sesión. El listado de "Negocios" de arriba (nombre + link `/slug`) sigue siendo público, sin cambios — es un directorio, no dato sensible.
- **RLS multi-tenant:** activado en las 6 tablas, `supabase/migrations/004_rls_v2.sql`. Modelo: `businesses`/`resources`/`business_hours`/`blocked_slots` con lectura pública (las necesita `/[slug]`) y escritura solo del dueño (`owner_id = auth.uid()`, vía `business_id`); `appointments` con lectura y edición restringidas al dueño, pero alta pública abierta para el rol `anon` (la reserva de un cliente no requiere sesión) separada de la del dueño (`to authenticated`, solo en sus propios negocios).
- **Auditoría post-RLS (`supabase/migrations/005_clients_rpc.sql`, aplicada directo en Supabase desde otra sesión, no desde acá):** apareció una policy vieja `temp_open_write_pending_auth` en `businesses`/`resources`/`business_hours` que anulaba las restricciones por dueño (RLS combina policies permisivas con OR — una sola abierta invalida a todas las demás); se eliminó. Y se cerró la limitación de seguridad que habíamos dejado documentada sobre `clients` (cualquiera con la anon key podía leer nombre/teléfono/email de todos los clientes): ahora `clients` no tiene ninguna policy pública, la lectura queda restringida a "clientes que tuvieron un turno en un negocio del dueño logueado" (`clients_select_own_business`), y toda alta/búsqueda de cliente por teléfono pasa por la función `security definer` `upsert_client(p_name, p_phone)` (bypassa RLS a propósito, expuesta vía `supabase.rpc(...)`). Se actualizó el código en esta sesión para usar esa RPC en los dos lugares donde se hacía "buscar cliente por teléfono, si no existe crearlo": `addAppointment` en `src/app/page.tsx` y `addPublicAppointment` en `src/app/[slug]/page.tsx`.
- **Resuelto (era "pendiente de decisión"):** las policies `SELECT` duplicadas en `businesses`/`resources`/`business_hours` ya se limpiaron — se aplicó `drop_duplicate_public_select_policies` directo en Supabase desde otra sesión (no está en `supabase/migrations/` local, ver nota en "Estado actual" de v3). Verificado en esta sesión: cada tabla tiene una sola policy por comando (`select`/`insert`/`update`/`delete`).
- Verificado: `npm run build` y `npm run lint` sin errores en cada paso. El usuario probó a mano login, dashboard auth-aware y RLS. La reserva pública con la RPC nueva se probó de punta a punta en el browser: turno creado, y el cliente existente se reusó (no se duplicó) en una segunda reserva con el mismo teléfono. `get_advisors` (security) de Supabase solo deja warnings esperados (extensión en schema public, protección de contraseñas filtradas — no aplica sin contraseñas, y que `upsert_client` sea ejecutable por `anon`/`authenticated`, que es intencional).

**Próxima tarea:** v3 está completa (catálogo de servicios conectado a la reserva + panel `/admin/*`, ver "Estado actual" arriba). v4 es Fase 2 (WhatsApp) y todavía no se habló el alcance — no arrancar sin hablarlo antes primero, como marca la filosofía de desarrollo incremental del proyecto. Mientras tanto, quedan sueltos: probar a mano el flujo logueado completo (panel nuevo, y ahora también reservar un turno con servicio desde `/admin/appointments`), y bajar a migraciones locales los cambios más viejos que siguen aplicados directo en Supabase sin archivo local (ver nota de v3 parte 1 arriba).
