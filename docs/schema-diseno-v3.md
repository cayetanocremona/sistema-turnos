# Diseño de esquema — v3 parte 1 (catálogo de servicios)

Extiende `docs/schema-diseno-v1.md`. Ya aplicado en Supabase (migración `006_services_v3`).

## Tabla nueva

### `services` (catálogo de servicios del negocio)
Alcance: por **negocio**, no por recurso ni por turno. Cada negocio arma su propia lista de servicios con nombre, duración y precio (ej. una peluquería: "Corte" 30min $1500, "Corte + Barba" 45min $2200).

| columna | tipo | notas |
|---|---|---|
| id | uuid, PK | |
| business_id | uuid, FK → businesses.id | on delete cascade |
| name | text | |
| duration_minutes | integer | check > 0 |
| price | numeric(10,2) | check >= 0, default 0 |
| created_at | timestamptz | |

RLS: mismo modelo que `resources`/`business_hours` — lectura pública (`using (true)`), escritura (`insert`/`update`/`delete`) restringida al dueño del negocio vía `business_id in (select id from businesses where owner_id = auth.uid())`. Lectura pública es deliberada: la página `/[slug]` va a necesitar mostrar el menú de servicios con precio antes de que el cliente reserve, igual que ya muestra recursos y horarios sin requerir sesión.

## v3 parte 3: servicios conectados a turnos

Las preguntas de negocio que quedaron pendientes en la parte 1 ya se resolvieron y están implementadas (`src/app/[slug]/page.tsx`, `src/app/admin/actions.ts`, `src/app/admin/AppointmentForm.tsx`):

- **¿Quién define la duración del turno?** El servicio elegido, siempre que el negocio tenga catálogo cargado. `end_time = start_time + duration_minutes` se calcula en el servidor (Server Action), nunca lo manda el cliente — así un cliente malicioso no puede mandar un `end_time` arbitrario. Helper: `addMinutesToInstant` en `src/lib/datetime.ts`.
- **¿Un recurso puede ofrecer varios servicios?** Sí, sin restricción — igual que hoy no hay restricción entre recurso y horario. `services` no tiene FK a `resources`; el cliente elige recurso y servicio de forma independiente. Si en el futuro hace falta acotar qué servicios aplican a qué recurso, es una tabla puente nueva, no un cambio de este esquema.
- **¿Qué pasa si se borra o edita un servicio con turnos ya creados?** `appointments.service_id` es `on delete set null` (migración `007_appointments_service_id.sql`): el turno histórico sobrevive sin servicio asociado en vez de romperse o arrastrar el borrado. Editar un servicio (precio/duración) no toca los turnos ya creados — el `end_time` ya quedó grabado en el momento de la reserva.
- **¿Y si el negocio todavía no cargó ningún servicio?** No se bloquea la reserva. Con catálogo vacío, el formulario (público y de admin) cae al modo manual de v1/v2: el dueño/cliente escribe `start_time` y `end_time` a mano, `service_id` queda `null`. En cuanto el negocio carga al menos un servicio, el formulario exige elegir uno (ya no se puede reservar "sin servicio") y el campo `end_time` desaparece del form porque se calcula solo. Se decidió así para no cortarle la toma de turnos a un negocio recién dado de alta que todavía no armó su catálogo — un negocio que hoy toma turnos sin servicios no puede quedar bloqueado de un día para el otro por este cambio.

RLS: la policy de alta pública (`anon`) de `appointments` ahora exige que `resource_id` y `service_id` (si viene) pertenezcan al `business_id` declarado (migración `008_appointments_insert_anon_validate_shape.sql`) — antes tenía `with_check = true` sin validar nada, hallazgo de auditoría al implementar esto: cualquiera con la anon key podía insertar un turno llamando directo a la API REST de Supabase con un `resource_id` de otro negocio.

## Moneda del precio

`price` es un `numeric(10,2)` sin columna de moneda — se asume pesos argentinos (ARS), igual que el resto del sistema ya asume timezone `America/Argentina/Buenos_Aires` por defecto. Si en algún momento el sistema se vende a un negocio fuera de Argentina, hace falta agregar una columna `currency` (o tomarla del negocio) antes de confiar en el precio mostrado.

Nota técnica: Postgres `numeric` puede llegar desde PostgREST como string en el JSON (para no perder precisión en JS, que no puede representar todos los decimales de forma exacta con `number`). El código convierte con `Number(p)` antes de formatear — importante tenerlo en cuenta en cualquier lugar nuevo que lea `price`.
