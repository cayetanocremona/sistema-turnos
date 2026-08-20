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

/**
 * Convierte el valor crudo de un <input type="datetime-local"> (sin offset,
 * "YYYY-MM-DDTHH:mm") en el instante UTC correcto, interpretándolo en la
 * zona horaria del negocio.
 */
export function localInputToInstant(value: string, timeZone: string): string {
  const naiveUTC = new Date(`${value}:00Z`);
  const offsetMinutes = getTimeZoneOffsetMinutes(naiveUTC, timeZone);
  return new Date(naiveUTC.getTime() - offsetMinutes * 60000).toISOString();
}

/** Suma minutos a un instante (ISO/timestamptz) ya calculado — para derivar end_time desde la duración de un servicio. */
export function addMinutesToInstant(instant: string, minutes: number): string {
  return new Date(new Date(instant).getTime() + minutes * 60000).toISOString();
}

/** Convierte un instante guardado (ISO/timestamptz) al formato crudo de un <input type="datetime-local">, en la zona horaria del negocio — para precargar un form de edición. */
export function instantToLocalInputValue(instant: string, timeZone: string): string {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(new Date(instant)).filter((p) => p.type !== "literal").map((p) => [p.type, p.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** Formatea un timestamp guardado (ISO/timestamptz) en la zona horaria del negocio. */
export function formatInTimeZone(isoString: string, timeZone: string): string {
  return new Date(isoString).toLocaleString("es-AR", {
    timeZone,
    dateStyle: "short",
    timeStyle: "short",
  });
}

/** Descompone un instante en día de la semana (0=domingo) y minutos desde medianoche, en la zona horaria dada. */
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
