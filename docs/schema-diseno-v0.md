# Diseño de esquema de base de datos — v0 (walking skeleton)

Objetivo de esta etapa: la versión **más simple posible** que ya demuestre la conexión real entre la base de datos (Supabase/Postgres) y la web (Next.js). Nada de horarios complejos, roles, ni multi-tenant todavía — eso viene en v1+.

## Tablas v0

### `businesses` (negocios)
| columna | tipo | notas |
|---|---|---|
| id | uuid, PK | default `gen_random_uuid()` |
| name | text | ej. "Clínica San Martín" |
| slug | text, unique | para URLs amigables, ej. `/negocio/clinica-san-martin` |
| created_at | timestamptz | default `now()` |

### `resources` (recursos reservables)
Representa lo que efectivamente se reserva: una cancha, un sillón, un box, un profesional. Es la pieza clave de la abstracción "agnóstica al rubro": todo negocio tiene N recursos reservables, sin importar el rubro.

| columna | tipo | notas |
|---|---|---|
| id | uuid, PK | |
| business_id | uuid, FK → businesses.id | |
| name | text | ej. "Cancha 1", "Dr. Pérez", "Sillón 3" |
| created_at | timestamptz | |

### `clients` (clientes finales)
**Decisión de diseño:** clientes NO están atados a un negocio (`business_id`), son globales, identificados por teléfono. Motivo: en Fase 2, un mismo número de WhatsApp va a interactuar potencialmente con distintos negocios en la plataforma — si atamos el cliente a un negocio desde ahora, en Fase 2 tenemos que migrar el modelo. Arrancar global evita ese rework.

| columna | tipo | notas |
|---|---|---|
| id | uuid, PK | |
| name | text | |
| phone | text, unique | clave natural, va a ser el ID de WhatsApp en Fase 2 |
| email | text, nullable | |
| created_at | timestamptz | |

### `appointments` (turnos)
| columna | tipo | notas |
|---|---|---|
| id | uuid, PK | |
| business_id | uuid, FK → businesses.id | denormalizado (se podría derivar via resource_id) para simplificar queries y políticas de seguridad después |
| resource_id | uuid, FK → resources.id | |
| client_id | uuid, FK → clients.id | |
| start_time | timestamptz | |
| end_time | timestamptz | |
| status | text | default `'confirmed'` — sin más estados por ahora |
| created_at | timestamptz | |

## Relaciones

```
businesses 1───N resources
businesses 1───N appointments (denormalizado)
resources  1───N appointments
clients    1───N appointments
```

## Deliberadamente fuera de alcance en v0 (se agrega en v1+)

- **Horarios de atención** (`business_hours`) y **bloqueos manuales** (`blocked_slots`) — hoy cualquier horario es válido, sin validación de disponibilidad.
- **Prevención de solapamiento de turnos** — en v1 se agrega un constraint `EXCLUDE` de Postgres (con `btree_gist`) sobre `resource_id` + rango de tiempo, para que la base de datos rechace turnos superpuestos a nivel motor, no solo en el código.
- **Autenticación y roles** (dueño de negocio vs cliente vs empleado) — v0 no tiene Supabase Auth conectado todavía, se opera con la tabla abierta para probar la conexión.
- **Row Level Security (RLS) multi-tenant** — clave para cuando haya varios negocios reales usando la plataforma a la vez; se activa en v1 junto con Auth.
- **Catálogo de servicios** (duración, precio, nombre del servicio) — hoy el turno es solo "recurso + horario", sin servicio asociado.
- **Turnos recurrentes, lista de espera, notificaciones** — quedan para fases posteriores.

## Roadmap incremental propuesto

1. **v0 (hoy):** este esquema, proyecto Supabase creado, Next.js conectado, poder listar negocios/recursos y crear un turno desde la web. Objetivo: demostrar que la conexión DB↔web funciona de punta a punta.
2. **v1:** horarios de atención + bloqueos + constraint anti-solapamiento.
3. **v2:** Supabase Auth (login del dueño del negocio) + RLS multi-tenant.
4. **v3:** catálogo de servicios (duración/precio) y panel de administración real (grilla semanal).
5. **v4 (Fase 2):** integración WhatsApp Cloud API sobre esta misma base.
