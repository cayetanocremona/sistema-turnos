# Panel de administración — v3 parte 2

Reemplaza la página única `/` (que mezclaba directorio público + gestión del dueño) por un
panel de administración real en rutas dedicadas bajo `/admin`.

## Estructura de rutas

```
src/app/admin/
  layout.tsx       # guard de sesión + nav — envuelve todas las subrutas
  actions.ts        # todas las Server Actions (mutaciones), "use server" a nivel de módulo
  data.ts            # queries de lectura compartidas (getMyBusinesses, getMyResources)
  page.tsx            # /admin — resumen
  businesses/page.tsx # /admin/businesses
  resources/page.tsx  # /admin/resources
  services/page.tsx   # /admin/services
  hours/page.tsx       # /admin/hours
  blocked-slots/page.tsx
  appointments/page.tsx
```

Los segmentos de URL van en inglés (`resources`, `hours`, `blocked-slots`) para no romper la
convención de "código en inglés" de AGENTS.md — son nombres técnicos, no texto de cara al
cliente final (que sigue en español en toda la UI). `admin` ya estaba en la lista de
`RESERVED_SLUGS` desde v1, así que ningún negocio puede pisar la ruta con su slug.

## Por qué un guard de sesión en el `layout`, no por página

Antes, cada sección de la página única repetía `{!user && <p>Iniciá sesión...</p>}`. Ahora
`admin/layout.tsx` hace `redirect("/login")` una sola vez si no hay sesión, así que ninguna
página hijo necesita ese chequeo — si el Server Component de la página corrió, es porque ya hay
usuario. Esto es lo mismo que hacía `middleware`/`proxy.ts` para refrescar cookies de sesión,
pero a nivel de ruta en vez de a nivel de request: `proxy.ts` sigue encargándose de refrescar el
token, `admin/layout.tsx` decide si con ese token alcanza para entrar.

Consecuencia para el negocio: si alguien comparte un link a `/admin/turnos` sin estar logueado,
nunca ve ni el layout ni los datos — Next.js corta en el Server Component antes de renderizar
nada, no es una redirección del lado del cliente que se pueda saltear.

## Por qué las Server Actions viven en `actions.ts` y no en cada página

Ya estaban separadas en funciones individuales (`addResource`, `addService`, etc.) en la página
única; acá simplemente se juntan en un módulo aparte en vez de duplicarlas. Cada página importa
solo la acción que usa. La lógica de autorización (verificar `owner_id = auth.uid()` antes de
insertar) no cambió — sigue siendo defensa en profundidad además de RLS, no en reemplazo: si se
rompiera esta verificación en el código, las policies de `supabase/migrations/004_rls_v2.sql`
igual bloquean el insert en la base.

## Decisión de alcance: selector de negocio por formulario, no contexto global

Un dueño puede tener más de un negocio. En vez de agregar un "negocio activo" persistente (en
cookie, query param o contexto de React), cada formulario de creación sigue pidiendo elegir el
negocio en un `<select>`, igual que en v1/v2. Es más clicks si tenés muchos negocios, pero evita
sumar estado global antes de que haga falta — coherente con la filosofía incremental del
proyecto. Si en algún momento la mayoría de los dueños reales tienen 3+ negocios y esto se siente
lento, ahí vale la pena agregar un selector de "negocio activo" en el nav.

## Qué NO cambió

- El modelo de datos, RLS, y la RPC `upsert_client` — sin cambios.
- La página pública `/[slug]` (donde el cliente final reserva) — sin cambios.
- `/` sigue existiendo, pero ahora es solo landing pública: directorio de negocios + link a
  `/admin` si hay sesión, o a `/login` si no. Ya no gestiona nada.
