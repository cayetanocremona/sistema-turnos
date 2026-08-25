"use client";

import { useRef } from "react";
import { dayOfWeekFromDateString } from "@/lib/datetime";
import { formatDayLabel } from "@/lib/slots";
import { useAvailability } from "./useAvailability";

type BusinessHour = { day_of_week: number; start_time: string; end_time: string };

/** Selector de fecha/hora del preset "clasico" (Tailwind) -- tira de días + lista de horarios disponibles, en vez de un input de fecha/hora libre. Ver AGENTS.md "Rediseño del selector de fecha/hora". */
export default function DateTimePicker({
  businessId,
  resourceId,
  timezone,
  slotIntervalMinutes,
  bookingWindowDays,
  durationMinutes,
  hoursList,
  onChange,
}: {
  businessId: string;
  resourceId: string;
  timezone: string;
  slotIntervalMinutes: number;
  bookingWindowDays: number;
  durationMinutes: number;
  hoursList: BusinessHour[];
  onChange: (value: string) => void;
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const { days, openDaySet, selectedDate, setSelectedDate, slots, selectedTime, setSelectedTime, isPending } =
    useAvailability({ businessId, resourceId, timezone, slotIntervalMinutes, bookingWindowDays, durationMinutes, hoursList });

  function pickDay(d: string) {
    setSelectedDate(d);
    onChange("");
  }

  function pickTime(t: string) {
    setSelectedTime(t);
    onChange(`${selectedDate}T${t}`);
  }

  function scrollStrip(dir: 1 | -1) {
    stripRef.current?.scrollBy({ left: dir * 160, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => scrollStrip(-1)}
          className="hidden shrink-0 rounded-full p-1.5 text-neutral-400 hover:bg-black/[0.05] hover:text-neutral-700 sm:block"
          aria-label="Días anteriores"
        >
          ‹
        </button>
        <div ref={stripRef} className="flex flex-1 gap-2 overflow-x-auto scroll-smooth pb-1">
          {days.map((d) => {
            const isOpen = openDaySet.has(dayOfWeekFromDateString(d));
            const isSelected = d === selectedDate;
            const { weekday, day, month } = formatDayLabel(d);
            return (
              <button
                key={d}
                type="button"
                disabled={!isOpen}
                onClick={() => pickDay(d)}
                className={`flex shrink-0 flex-col items-center gap-0.5 rounded-2xl px-3.5 py-2.5 text-[11px] font-semibold transition-colors ${
                  isSelected
                    ? "bg-[var(--brand-accent)] text-[var(--brand-accent-contrast)]"
                    : isOpen
                      ? "bg-black/[0.04] text-neutral-700 hover:bg-black/[0.08]"
                      : "cursor-not-allowed bg-black/[0.02] text-neutral-300"
                }`}
              >
                <span className="uppercase">{weekday}</span>
                <span className="text-base font-extrabold">{day}</span>
                <span className="uppercase">{month}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => scrollStrip(1)}
          className="hidden shrink-0 rounded-full p-1.5 text-neutral-400 hover:bg-black/[0.05] hover:text-neutral-700 sm:block"
          aria-label="Días siguientes"
        >
          ›
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {isPending && <p className="text-xs text-neutral-500">Buscando horarios...</p>}
        {!isPending && slots.length === 0 && (
          <p className="text-xs text-neutral-500">No hay horarios disponibles ese día.</p>
        )}
        {!isPending && slots.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => pickTime(t)}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  t === selectedTime
                    ? "bg-[var(--brand-accent)] text-[var(--brand-accent-contrast)]"
                    : "bg-black/[0.04] text-neutral-800 hover:bg-black/[0.08]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
