export type BusinessHourBlock = { start_time: string; end_time: string };
export type BusyMinuteRange = { start: number; end: number };

function timeStringToMinutes(t: string): number {
  const [hours, minutes] = t.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTimeLabel(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Horarios de inicio candidatos (en minutos desde medianoche) para un día,
 * combinando los bloques de `business_hours` de ese día con
 * `slot_interval_minutes` del negocio. Un turno de `durationMinutes` que
 * arranca en un slot generado acá siempre termina dentro del mismo bloque de
 * atención -- nunca se ofrece un horario que se pasaría del cierre.
 */
export function generateDaySlotMinutes(
  blocksForDay: BusinessHourBlock[],
  slotIntervalMinutes: number,
  durationMinutes: number
): number[] {
  // Set en vez de array: dos bloques de un mismo día que se pisan (carga
  // manual del dueño, sin validación de solapamiento en `business_hours`)
  // generarían el mismo horario dos veces -- con array plano React tira
  // "two children with the same key" en la lista de botones.
  const slots = new Set<number>();
  for (const block of blocksForDay) {
    const blockStart = timeStringToMinutes(block.start_time);
    const blockEnd = timeStringToMinutes(block.end_time);
    for (let t = blockStart; t + durationMinutes <= blockEnd; t += slotIntervalMinutes) {
      slots.add(t);
    }
  }
  return [...slots].sort((a, b) => a - b);
}

/**
 * Un horario es válido si cae dentro de algún bloque de `business_hours` de
 * ese día, termina antes del cierre, y coincide con la grilla
 * (`slot_interval_minutes` desde el inicio del bloque) -- validación
 * server-side, mismo chequeo que ya generaría `generateDaySlotMinutes` del
 * lado del cliente. Sin esto, alguien que llame directo a la API de Supabase
 * (no por la UI) podría seguir insertando un turno a un horario que no
 * coincide con la grilla del negocio.
 */
export function isSlotAligned(
  startMinutes: number,
  endMinutes: number,
  blocksForDay: BusinessHourBlock[],
  slotIntervalMinutes: number
): boolean {
  return blocksForDay.some((block) => {
    const blockStart = timeStringToMinutes(block.start_time);
    const blockEnd = timeStringToMinutes(block.end_time);
    return (
      startMinutes >= blockStart &&
      endMinutes <= blockEnd &&
      (startMinutes - blockStart) % slotIntervalMinutes === 0
    );
  });
}

/** Saca de la lista de horarios candidatos los que se solapan con algún rango ocupado (turnos existentes o bloqueos). */
export function excludeBusyMinutes(
  candidateStarts: number[],
  durationMinutes: number,
  busyRanges: BusyMinuteRange[]
): number[] {
  return candidateStarts.filter((start) => {
    const end = start + durationMinutes;
    return !busyRanges.some((b) => start < b.end && end > b.start);
  });
}

/** Etiqueta corta de un día (abreviatura + número + mes abreviado) para la tira horizontal del selector -- `dateString` es "YYYY-MM-DD", se formatea en UTC a propósito porque es aritmética de calendario pura, no un instante. */
export function formatDayLabel(dateString: string): { weekday: string; day: number; month: string } {
  const [y, m, d] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const weekday = new Intl.DateTimeFormat("es-AR", { weekday: "short", timeZone: "UTC" }).format(date).replace(".", "");
  const month = new Intl.DateTimeFormat("es-AR", { month: "short", timeZone: "UTC" }).format(date).replace(".", "");
  return { weekday: capitalize(weekday), day: d, month: capitalize(month) };
}
