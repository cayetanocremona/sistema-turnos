"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { getAvailableSlots } from "./availability";
import { addDaysToDateString, dayOfWeekFromDateString, getTodayDateString } from "@/lib/datetime";

type BusinessHour = { day_of_week: number; start_time: string; end_time: string };

/**
 * Estado + fetch de disponibilidad compartido entre el picker Tailwind
 * (DateTimePicker, preset "clasico") y el de estilos inline (BrandedDateTimePicker,
 * "elegante"/"deportivo"/"minimal") -- misma lógica, dos presentaciones.
 */
export function useAvailability({
  businessId,
  resourceId,
  timezone,
  slotIntervalMinutes,
  bookingWindowDays,
  durationMinutes,
  hoursList,
}: {
  businessId: string;
  resourceId: string;
  timezone: string;
  slotIntervalMinutes: number;
  bookingWindowDays: number;
  durationMinutes: number;
  hoursList: BusinessHour[];
}) {
  const today = useMemo(() => getTodayDateString(timezone), [timezone]);
  const days = useMemo(
    () => Array.from({ length: bookingWindowDays + 1 }, (_, i) => addDaysToDateString(today, i)),
    [today, bookingWindowDays]
  );
  const openDaySet = useMemo(() => new Set(hoursList.map((h) => h.day_of_week)), [hoursList]);

  const [selectedDate, setSelectedDateState] = useState<string>(
    () => days.find((d) => openDaySet.has(dayOfWeekFromDateString(d))) ?? days[0]
  );
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  function setSelectedDate(date: string) {
    setSelectedTime("");
    setSelectedDateState(date);
  }

  useEffect(() => {
    startTransition(async () => {
      setSelectedTime("");
      if (!resourceId) {
        setSlots([]);
        return;
      }
      const result = await getAvailableSlots({
        businessId,
        resourceId,
        dateString: selectedDate,
        durationMinutes,
        timezone,
        slotIntervalMinutes,
      });
      setSlots(result);
    });
  }, [businessId, resourceId, selectedDate, durationMinutes, timezone, slotIntervalMinutes]);

  return { days, openDaySet, selectedDate, setSelectedDate, slots, selectedTime, setSelectedTime, isPending };
}
