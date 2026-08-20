Buen catch con el tema de zona horaria. Lo pensé y esta es la decisión: en vez de asumir Argentina a fuego en el código, agregué una columna `timezone` a `businesses` (default `'America/Argentina/Buenos_Aires'`, ya aplicada en Supabase — la migración de referencia está en `supabase/migrations/003_business_timezone.sql`, no hace falta correrla). Así el dato vive en el modelo, no hardcodeado, y el día que haya un negocio en otro huso solo se cambia ese campo, no el código. No agregues ninguna librería nueva (nada de `date-fns-tz`, `luxon`, etc.) — se puede resolver bien con la API `Intl` nativa.

Hacé esto:

1. **Creá `src/lib/datetime.ts`** con dos funciones:

   - `localInputToInstant(value: string, timeZone: string): string` — recibe el valor crudo de un `<input type="datetime-local">` (formato `"YYYY-MM-DDTHH:mm"`, sin offset) y el IANA timezone del negocio, y devuelve el ISO string UTC correcto para mandar a Supabase. Usá este algoritmo (es el truco estándar para resolver el offset de cualquier zona sin librerías, funciona bien incluso con DST aunque acá no aplique):

     ```ts
     function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
       const dtf = new Intl.DateTimeFormat("en-US", {
         timeZone,
         hourCycle: "h23",
         year: "numeric",
         month: "2-digit",
         day: "2-digit",
         hour: "2-digit",
         minute: "2-digit",
         second: "2-digit",
       });
       const parts = Object.fromEntries(
         dtf.formatToParts(date).filter((p) => p.type !== "literal").map((p) => [p.type, p.value])
       );
       const asUTC = Date.UTC(
         Number(parts.year), Number(parts.month) - 1, Number(parts.day),
         Number(parts.hour), Number(parts.minute), Number(parts.second)
       );
       return (asUTC - date.getTime()) / 60000;
     }

     export function localInputToInstant(value: string, timeZone: string): string {
       const naiveUTC = new Date(`${value}:00Z`);
       const offsetMinutes = getTimeZoneOffsetMinutes(naiveUTC, timeZone);
       return new Date(naiveUTC.getTime() - offsetMinutes * 60000).toISOString();
     }
     ```

   - `formatInTimeZone(isoString: string, timeZone: string): string` — formatea un timestamp guardado (ISO/timestamptz) para mostrarlo, pasando `timeZone` explícito a `toLocaleString` en vez de depender de la zona de la máquina:

     ```ts
     export function formatInTimeZone(isoString: string, timeZone: string): string {
       return new Date(isoString).toLocaleString("es-AR", {
         timeZone,
         dateStyle: "short",
         timeStyle: "short",
       });
     }
     ```

2. **Usalas en los formularios de Turnos y Bloqueos**: donde hoy se toma el valor del `datetime-local` y se manda directo a Supabase, primero resolvé el `timezone` del negocio correspondiente (para Turnos ya tenés el `business_id` elegido; para Bloqueos el recurso está atado a un negocio, así que traé `businesses.timezone` haciendo el join o una consulta extra por `resource.business_id`), y pasá el valor por `localInputToInstant(value, business.timezone)` antes del insert.

3. **Usalas también donde se muestran las listas de turnos y bloqueos**: reemplazá el `toLocaleString("es-AR")` actual (sin `timeZone`) por `formatInTimeZone(appointment.start_time, business.timezone)`.

4. Cuando termines:
   - `npm run build` sin errores.
   - `npm run dev`, cargá un turno para las "10:00" y confirmá que se muestra de vuelta como "10:00" (no "7:00"), y que en el dashboard de Supabase el valor guardado en UTC sea las 13:00 (10:00 -03:00 = 13:00 UTC) — podés chequear eso último si tenés forma fácil de verlo, si no, con que la UI redondee bien alcanza.
   - Confirmame que el bug quedó resuelto y contame si tocaste algo más aparte de lo que pedí acá.
