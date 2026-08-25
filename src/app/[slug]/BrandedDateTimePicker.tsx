"use client";

import { useRef } from "react";
import type { CSSProperties } from "react";
import { dayOfWeekFromDateString } from "@/lib/datetime";
import { formatDayLabel } from "@/lib/slots";
import type { StorefrontTheme } from "./theme";
import { useAvailability } from "./useAvailability";

type BusinessHour = { day_of_week: number; start_time: string; end_time: string };

/** Mismo selector de fecha/hora que DateTimePicker (Tailwind), pero con estilos inline dirigidos por `theme` -- para "elegante"/"deportivo"/"minimal", que no usan el sistema Tailwind nuevo (ver AGENTS.md). */
export default function BrandedDateTimePicker({
  businessId,
  resourceId,
  timezone,
  slotIntervalMinutes,
  bookingWindowDays,
  durationMinutes,
  hoursList,
  theme,
  onChange,
}: {
  businessId: string;
  resourceId: string;
  timezone: string;
  slotIntervalMinutes: number;
  bookingWindowDays: number;
  durationMinutes: number;
  hoursList: BusinessHour[];
  theme: StorefrontTheme;
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

  const arrowStyle: CSSProperties = {
    flexShrink: 0,
    border: "none",
    background: "transparent",
    color: theme.mutedText,
    fontSize: 18,
    cursor: "pointer",
    padding: "0 4px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button type="button" onClick={() => scrollStrip(-1)} style={arrowStyle} aria-label="Días anteriores">
          ‹
        </button>
        <div ref={stripRef} style={{ display: "flex", flex: 1, gap: 8, overflowX: "auto", scrollBehavior: "smooth", paddingBottom: 2 }}>
          {days.map((d) => {
            const isOpen = openDaySet.has(dayOfWeekFromDateString(d));
            const isSelected = d === selectedDate;
            const { weekday, day, month } = formatDayLabel(d);
            const dayStyle: CSSProperties = {
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              borderRadius: 14,
              padding: "10px 14px",
              fontSize: 11,
              fontWeight: 600,
              fontFamily: theme.fontBody,
              cursor: isOpen ? "pointer" : "not-allowed",
              border: `1px solid ${isSelected ? theme.accent : theme.cardBorder}`,
              background: isSelected ? theme.accent : theme.cardBg,
              color: isSelected ? theme.accentText : isOpen ? theme.pageText : theme.mutedText,
              opacity: isOpen ? 1 : 0.45,
            };
            return (
              <button key={d} type="button" disabled={!isOpen} onClick={() => pickDay(d)} style={dayStyle}>
                <span style={{ textTransform: "uppercase" }}>{weekday}</span>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{day}</span>
                <span style={{ textTransform: "uppercase" }}>{month}</span>
              </button>
            );
          })}
        </div>
        <button type="button" onClick={() => scrollStrip(1)} style={arrowStyle} aria-label="Días siguientes">
          ›
        </button>
      </div>

      <div>
        {isPending && <p style={{ fontSize: 12.5, color: theme.mutedText }}>Buscando horarios...</p>}
        {!isPending && slots.length === 0 && (
          <p style={{ fontSize: 12.5, color: theme.mutedText }}>No hay horarios disponibles ese día.</p>
        )}
        {!isPending && slots.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(76px, 1fr))", gap: 8 }}>
            {slots.map((t) => {
              const isSelected = t === selectedTime;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => pickTime(t)}
                  style={{
                    borderRadius: 10,
                    padding: "10px 6px",
                    fontSize: 13.5,
                    fontWeight: 600,
                    fontFamily: theme.fontBody,
                    cursor: "pointer",
                    border: `1px solid ${isSelected ? theme.accent : theme.cardBorder}`,
                    background: isSelected ? theme.accent : theme.cardBg,
                    color: isSelected ? theme.accentText : theme.pageText,
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
