# Diseño de esquema — v1 (horarios, bloqueos, anti-solapamiento)

Extiende `docs/schema-diseno-v0.md`. Ya aplicado en Supabase (migración `002_schema_v1_hours_blocks_overlap`).

## Tablas nuevas

### `business_hours` (horario general de atención)
Alcance: por **negocio**, no por recurso — en v1 asumimos que todos los recursos de un negocio comparten el mismo horario general. Si más adelante hace falta horario distinto por recurso (ej. un profesional part-time en una clínica), se agrega `resource_id` opcional en una versión futura.

| columna | tipo | notas |
|---|---|---|
| id | uuid, PK | |
| business_id | uuid, FK → businesses.id | |
| day_of_week | smallint | 0=domingo … 6=sábado |
| start_time | time | |
| end_time | time | |
| created_at | timestamptz | |

### `blocked_slots` (bloqueos manuales)
Alcance: por **recurso** — el dueño bloquea un recurso puntual (mantenimiento, feriado, vacaciones del profesional, etc.), no todo el negocio.

| columna | tipo | notas |
|---|---|---|
| id | uuid, PK | |
| resource_id | uuid, FK → resources.id | |
| start_time | timestamptz | |
| end_time | timestamptz | |
| reason | text, nullable | |
| created_at | timestamptz | |

## Anti-solapamiento de turnos
Constraint `EXCLUDE` (Postgres, extensión `btree_gist`) sobre `appointments`: rechaza a nivel de motor cualquier INSERT/UPDATE que genere dos turnos con el mismo `resource_id` y rangos de tiempo superpuestos. Esto es más confiable que validarlo solo en el código de la app, porque protege incluso ante inserts concurrentes o hechos directo en la base.

Nota importante: este constraint protege **solo** contra doble-reserva del mismo recurso. **No** valida todavía que el turno caiga dentro de `business_hours` ni que no choque con un `blocked_slots` — esa validación de negocio queda pendiente para una iteración siguiente (se puede hacer en la Server Action antes del insert, o con un trigger). Por ahora v1 se limita a tener el modelo de datos y la protección de solapamiento funcionando.
