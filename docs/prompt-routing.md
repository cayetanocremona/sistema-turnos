Vamos a agregar el modelo de rutas multi-tenant del roadmap. Contexto en AGENTS.md. Decisión ya tomada con el usuario: el slug de cada negocio vive en la raíz (`/peluqueria-pepe`), y para evitar que choque con rutas propias del sistema (`/admin`, `/login`, etc., aunque hoy no existan todavía) vamos a mantener una lista de slugs reservados que se valida al crear un negocio.

Hice un cambio en Supabase que tenés que tener en cuenta: activé Row Level Security en `businesses`, `resources` y `business_hours` con lectura pública (`for select using (true)`) y escritura todavía abierta sin restricción (`temp_open_write_pending_auth`, pendiente de reemplazar en v2 cuando haya Auth). `clients`, `appointments` y `blocked_slots` siguen sin RLS por ahora. Esto no debería romper nada de lo que ya funciona, pero si ves algún error de permisos al escribir en esas 3 tablas, avisame.

Hacé esto, en orden:

1. **Lista de slugs reservados**: creá `src/lib/reservedSlugs.ts` que exporte un array con al menos: `admin`, `login`, `logout`, `signup`, `register`, `api`, `dev`, `docs`, `app`, `dashboard`, `settings`, `account`, `turnos`, `negocio`, `negocios`, `about`, `contact`, `contacto`, `terms`, `privacy`, `legal`, `help`, `ayuda`, `support`, `soporte`, `static`, `public`, `www`, `auth`, `new`, `edit`, `delete`. Agregá también una función `isReservedSlug(slug: string): boolean` (case-insensitive).

2. **Validar en la creación de negocios**: en la Server Action que crea un `business` (donde está hoy el formulario de "crear negocio"), antes del insert, chequeá `isReservedSlug(slug)`. Si es reservado, no insertes y mostrale al usuario un mensaje claro tipo "Ese nombre de URL está reservado, elegí otro". Aprovechá también para validar que el slug tenga un formato razonable (minúsculas, números, guiones — sin espacios ni caracteres raros); si no cumple, normalizalo o rechazalo con un mensaje claro, lo que te parezca más simple de implementar bien.

3. **Ruta dinámica pública**: creá `src/app/[slug]/page.tsx`. Server Component que:
   - Busca en `businesses` el registro con `slug = params.slug`. Si no existe, usá `notFound()` de `next/navigation` (404 estándar de Next.js).
   - Si existe, busca en `resources` todos los que tengan ese `business_id`, y en `business_hours` todos los que tengan ese `business_id` (ordenados por `day_of_week`, mapeando 0-6 a nombres de día en español: domingo, lunes, martes, miércoles, jueves, viernes, sábado).
   - Renderiza una página simple (mismo estilo inline que ya usamos, sin Tailwind ni librerías nuevas) mostrando: nombre del negocio, lista de recursos disponibles, y horarios de atención por día.
   - Importante: **no hay catálogo de servicios todavía** (eso es v3 del roadmap) — no inventes precios ni duraciones, solo mostrá los recursos tal cual están en la tabla (por ahora es solo `name`). Tampoco agregues un formulario de reserva en esta página todavía — eso es la iteración siguiente, hoy el objetivo es solo la vista dinámica funcionando.

4. Cuando termines:
   - `npm run build` sin errores.
   - `npm run dev`, probá: entrar a la URL de un negocio que ya exista (ej. el que usaste para probar v0) y confirmar que se ve su info; entrar a una URL que no exista y confirmar que da 404; intentar crear un negocio con slug `admin` y confirmar que se rechaza con el mensaje claro.
   - Contame qué archivos tocaste y si encontraste algo raro.
