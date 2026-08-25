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

/** Fecha local ("YYYY-MM-DD") de un instante en la zona horaria dada -- para comparar fechas de calendario sin arrastrar hora/offset. */
export function getLocalDateString(instant: string | Date, timeZone: string): string {
  const date = typeof instant === "string" ? new Date(instant) : instant;
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

/** Fecha local ("YYYY-MM-DD") de "ahora" en la zona horaria del negocio -- punto de partida de la ventana de reserva (`booking_window_days`) y del selector de fecha/hora. */
export function getTodayDateString(timeZone: string): string {
  return getLocalDateString(new Date(), timeZone);
}

/** Suma días de calendario a una fecha "YYYY-MM-DD" (aritmética pura en UTC, no interpreta la fecha en ninguna zona horaria) -- para generar la tira de días de la ventana de reserva. */
export function addDaysToDateString(dateString: string, days: number): string {
  const [y, m, d] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return getLocalDateString(date, "UTC");
}

/** Día de la semana (0=domingo) de una fecha "YYYY-MM-DD" -- misma aritmética pura que `addDaysToDateString`. */
export function dayOfWeekFromDateString(dateString: string): number {
  const [y, m, d] = dateString.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Días de calendario desde "hoy" (zona del negocio) hasta `dateString` -- negativo si ya pasó. Valida `booking_window_days` del lado del servidor: sin esto, alguien que llame directo a la API podría seguir reservando para un año que no corresponde. */
export function daysFromToday(dateString: string, timeZone: string): number {
  const todayStr = getTodayDateString(timeZone);
  const [ty, tm, td] = todayStr.split("-").map(Number);
  const [dy, dm, dd] = dateString.split("-").map(Number);
  const todayUTC = Date.UTC(ty, tm - 1, td);
  const targetUTC = Date.UTC(dy, dm - 1, dd);
  return Math.round((targetUTC - todayUTC) / 86400000);
}
