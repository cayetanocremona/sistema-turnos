"use server";

import { supabase } from "@/lib/supabaseClient";
import { generateDaySlotMinutes, excludeBusyMinutes, minutesToTimeLabel } from "@/lib/slots";
import { addDaysToDateString, dayOfWeekFromDateString, getTodayDateString, localInputToInstant } from "@/lib/datetime";

export type AvailabilityParams = {
  businessId: string;
  resourceId: string;
  dateString: string; // "YYYY-MM-DD"
  durationMinutes: number;
  timezone: string;
  slotIntervalMinutes: number;
};

function minutesFromDayStart(instant: string, dayStartInstant: string): number {
  const diff = Math.round((new Date(instant).getTime() - new Date(dayStartInstant).getTime()) / 60000);
  return Math.max(0, Math.min(24 * 60, diff));
}

/**
 * Horarios de inicio disponibles para un recurso en un día puntual: combina
 * business_hours + slot_interval_minutes (grilla) con blocked_slots y turnos
 * confirmados ya existentes (vía RPC get_resource_busy_ranges, porque
 * `appointments` no tiene lectura pública -- ver 015_resource_busy_ranges_rpc.sql).
 * Devuelve horarios en formato "HH:MM", sin los que ya pasaron si el día
 * elegido es hoy.
 */
export async function getAvailableSlots(params: AvailabilityParams): Promise<string[]> {
  const { businessId, resourceId, dateString, durationMinutes, timezone, slotIntervalMinutes } = params;

  if (!resourceId || durationMinutes <= 0) return [];

  const dayOfWeek = dayOfWeekFromDateString(dateString);
  const dayStart = localInputToInstant(`${dateString}T00:00`, timezone);
  const dayEndExclusive = localInputToInstant(`${addDaysToDateString(dateString, 1)}T00:00`, timezone);

  const [{ data: hoursForDay }, { data: blockedSlots }, { data: busyAppointments }] = await Promise.all([
    supabase
      .from("business_hours")
      .select("start_time, end_time")
      .eq("business_id", businessId)
      .eq("day_of_week", dayOfWeek),
    supabase
      .from("blocked_slots")
      .select("start_time, end_time")
      .eq("resource_id", resourceId)
      .lt("start_time", dayEndExclusive)
      .gt("end_time", dayStart),
    supabase.rpc("get_resource_busy_ranges", {
      p_resource_id: resourceId,
      p_from: dayStart,
      p_to: dayEndExclusive,
    }),
  ]);

  const candidateMinutes = generateDaySlotMinutes(hoursForDay ?? [], slotIntervalMinutes, durationMinutes);

  const busyRangesMinutes = [...(blockedSlots ?? []), ...(busyAppointments ?? [])].map((r) => ({
    start: minutesFromDayStart(r.start_time, dayStart),
    end: minutesFromDayStart(r.end_time, dayStart),
  }));

  let availableMinutes = excludeBusyMinutes(candidateMinutes, durationMinutes, busyRangesMinutes);

  if (dateString === getTodayDateString(timezone)) {
    const nowMinutes = minutesFromDayStart(new Date().toISOString(), dayStart);
    availableMinutes = availableMinutes.filter((m) => m > nowMinutes);
  }

  return availableMinutes.map(minutesToTimeLabel);
}
