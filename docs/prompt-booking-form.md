Seguimos con el roadmap del Sistema de Gestión de Turnos (contexto completo en AGENTS.md — leelo antes de arrancar si es una sesión nueva). Ya tenés armada la ruta pública `src/app/[slug]/page.tsx` que muestra nombre del negocio, recursos y horarios de atención. Ahora hay que agregarle un formulario real de reserva de turno, porque esta sí es la página que va a usar un cliente desconocido (a diferencia del formulario de turnos que ya existe en la página interna `/`, que queda como está, sirve como panel de pruebas).

Decisión tomada con el usuario: a diferencia del formulario interno (que solo depende de la protección de solapamiento a nivel de base de datos), acá **sí hay que validar contra `business_hours` y `blocked_slots` antes de insertar**, porque es la cara pública real del producto.

## Qué agregar a `src/app/[slug]/page.tsx`

Un formulario de reserva con: selector de `resource` (de los recursos ya cargados de ese negocio), nombre del cliente, teléfono del cliente, fecha/hora de inicio y fin (`datetime-local`, igual que en el formulario interno).

La Server Action que procesa el submit tiene que, en este orden:

1. **Convertir los horarios**: usá `localInputToInstant(value, business.timezone)` de `src/lib/datetime.ts` (ya existe) para pasar start/end a instantes UTC correctos.

2. **Validar que el turno entra en el horario de atención**: traé los `business_hours` de ese `business_id`. Necesitás calcular en qué día de la semana y a qué hora cae el turno, pero **en la zona horaria del negocio**, no en UTC ni en la del server. Usá este helper (mismo truco de `Intl` que ya usamos en `datetime.ts`, agregalo ahí):

   ```ts
   export function getLocalDateParts(date: Date, timeZone: string): { dayOfWeek: number; timeMinutes: number } {
     const dtf = new Intl.DateTimeFormat("en-US", {
       timeZone,
       hourCycle: "h23",
       weekday: "short",
       hour: "2-digit",
       minute: "2-digit",
     });
     const parts = Object.fromEntries(
       dtf.formatToParts(date).filter((p) => p.type !== "literal").map((p) => [p.type, p.value])
     );
     const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
     return {
       dayOfWeek: weekdayMap[parts.weekday],
       timeMinutes: Number(parts.hour) * 60 + Number(parts.minute),
     };
   }
   ```

   Con eso: calculá `dayOfWeek`/`timeMinutes` del inicio y el fin del turno. Si el `dayOfWeek` del inicio y el fin no coinciden, rechazá con el mensaje "Los turnos deben empezar y terminar el mismo día" (no soportamos turnos que cruzan medianoche todavía, es una limitación conocida, no hace falta resolverla ahora). Si coinciden, buscá si existe alguna fila de `business_hours` para ese `business_id` y ese `day_of_week` tal que `start_time` (convertido a minutos) sea ≤ al inicio del turno y `end_time` (en minutos) sea ≥ al fin del turno. Si no hay ninguna fila que cumpla, rechazá con "Ese horario está fuera del horario de atención del negocio."

3. **Validar que no choque con un bloqueo**: consultá `blocked_slots` para ese `resource_id` buscando solapamiento (`start_time < finDelTurno AND end_time > inicioDelTurno`). Si hay alguna coincidencia, rechazá con "Ese horario no está disponible (bloqueado por el negocio)."

4. **Cliente**: buscá por `phone` en `clients`; si existe reusalo, si no creá uno nuevo (mismo patrón que ya usamos en el formulario interno).

5. **Insertar el turno**: si algo falla acá igual, seguí manejando el error `23P01` (exclusion_violation) del constraint anti-solapamiento como red de seguridad final, con el mismo mensaje claro que ya usamos ("Ese horario se superpone con otro turno ya reservado en este recurso").

6. Mostrale al cliente un mensaje de éxito simple cuando el turno se crea bien, y `revalidatePath` de la ruta del negocio.

Mismo estilo que el resto del proyecto: estilos inline, sin librerías nuevas, sin Tailwind.

## Al terminar
- `npm run build` sin errores.
- `npm run dev` y probá, sobre un negocio con horarios y recursos cargados:
  - Reservar dentro del horario de atención → debería funcionar.
  - Intentar reservar fuera del horario de atención → debería rechazar con el mensaje correspondiente.
  - Cargar un bloqueo desde la página interna y después intentar reservar ahí desde la página pública → debería rechazar.
  - Reservar dos veces el mismo horario y recurso → debería rechazar por el constraint de solapamiento.
- Contame qué archivos tocaste y si encontraste algo raro.
