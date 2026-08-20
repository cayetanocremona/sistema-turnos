Arrancamos v2 del roadmap (contexto en AGENTS.md — actualizalo vos mismo al final con lo que agreguemos acá, en la sección de Estado actual). Vamos a ir de a partes; esta primera parte es SOLO login del dueño de negocio + asignarle el negocio que crea. Todavía NO toques las políticas RLS de las otras tablas (resources, business_hours, clients, appointments, blocked_slots) ni conviertas la página interna en un dashboard completo — eso son las próximas dos tareas, aparte.

Decisión ya tomada con el usuario: login por **magic link** (sin contraseñas), usando Supabase Auth. Ya agregué la columna `owner_id uuid references auth.users(id)` a `businesses` en Supabase (nullable — los 2 negocios de prueba que ya existen van a quedar con `owner_id` null, no hace falta migrarlos).

## Excepción a la regla de "no agregar librerías nuevas"

Para que Supabase Auth funcione bien con Server Components y Server Actions de Next.js (que no pueden leer `localStorage` del browser), hace falta el paquete oficial `@supabase/ssr`, que maneja la sesión vía cookies. Esta sí es una dependencia nueva justificada — es el patrón oficial recomendado por Supabase para Next.js App Router, no una librería de UI. Instalala con `npm install @supabase/ssr`.

## Qué armar

1. **`src/lib/supabase/server.ts`**: factory que crea un cliente de Supabase para usar en Server Components y Server Actions, leyendo/escribiendo cookies con la API `cookies()` de `next/headers` (patrón estándar de `@supabase/ssr`, `createServerClient` con los métodos `getAll`/`setAll` sobre el cookie store de Next.js).

2. **`src/lib/supabase/client.ts`**: factory que crea un cliente de Supabase para usar en Client Components (`createBrowserClient` de `@supabase/ssr`).

3. **`middleware.ts`** en la raíz del proyecto: el middleware estándar de Supabase SSR que refresca la sesión en cada request (podés guiarte por la doc oficial "Setting up Server-Side Auth for Next.js" de Supabase si no la tenés memorizada — buscala, es un patrón muy estandarizado).

4. **`src/app/login/page.tsx`**: página simple (Client Component) con un input de email y un botón "Enviarme el link de acceso". Al submit, llama a `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/auth/callback` } })` (usando el cliente de browser). Mostrá un mensaje "Revisá tu email" después de enviarlo, y los errores si falla.

5. **`src/app/auth/callback/route.ts`**: Route Handler que recibe el `code` de la URL, hace `exchangeCodeForSession(code)` con el cliente de servidor, y redirige a `/`.

6. **Actualizá la Server Action que crea un `business`** (en `src/app/page.tsx`): ahora requiere sesión iniciada. Si no hay usuario logueado, no insertes y mostrá un mensaje pidiendo iniciar sesión (con un link a `/login`). Si hay usuario, insertá el negocio con `owner_id: user.id`.

7. En `src/app/page.tsx`, agregá arriba de todo un indicador simple: si hay sesión, "Sesión iniciada como {email}" + un botón "Cerrar sesión" (Server Action que hace `supabase.auth.signOut()`); si no hay sesión, un link a `/login`.

No toques todavía las Server Actions de resources/business_hours/blocked_slots/appointments — esas siguen funcionando igual que hasta ahora, sin requerir login (eso se resuelve en la próxima tarea, cuando reescribamos las políticas RLS).

## Al terminar
- `npm run build` sin errores.
- `npm run dev`, probá: ir a `/login`, poner tu email, revisar la casilla, hacer click en el link, confirmar que volvés logueado a `/` y ves tu email. Crear un negocio nuevo estando logueado y confirmar que funciona. Cerrar sesión e intentar crear un negocio sin sesión, confirmar que te frena con el mensaje correspondiente.
- Ojo con un detalle del free tier: Supabase por default manda los magic links con su servicio de email interno, que tiene un límite bajo de envíos por hora (pensado solo para pruebas, no producción) — si te tira un error de rate limit al pedir varios links seguidos, esperá un rato entre pruebas, es esperable y no es un bug del código.
- Contame qué archivos tocaste y si encontraste algo raro.
