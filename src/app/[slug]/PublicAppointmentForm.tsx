"use client";

import { useActionState, useState } from "react";
import type { CSSProperties } from "react";
import type { StorefrontTheme } from "./theme";
import BrandedDateTimePicker from "./BrandedDateTimePicker";

type Resource = { id: string; name: string };
type Service = { id: string; name: string; duration_minutes: number; price: number | string };
type BusinessHour = { day_of_week: number; start_time: string; end_time: string };
type PublicAppointmentFormState = { error: string | null; success: boolean };

function formatServiceOption(s: Service) {
  const price = Number(s.price).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
  return `${s.name} — ${s.duration_minutes} min — ${price}`;
}

export default function PublicAppointmentForm({
  businessId,
  resources,
  services,
  hoursList,
  timezone,
  slotIntervalMinutes,
  bookingWindowDays,
  action,
  theme,
}: {
  businessId: string;
  resources: Resource[];
  services: Service[];
  hoursList: BusinessHour[];
  timezone: string;
  slotIntervalMinutes: number;
  bookingWindowDays: number;
  action: (
    prevState: PublicAppointmentFormState,
    formData: FormData
  ) => Promise<PublicAppointmentFormState>;
  theme: StorefrontTheme;
}) {
  const [state, formAction, isPending] = useActionState(action, {
    error: null,
    success: false,
  });

  const hasServices = services.length > 0;
  const [resourceId, setResourceId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [startTime, setStartTime] = useState("");
  const selectedService = services.find((s) => s.id === serviceId);
  const canSubmit = hasServices ? Boolean(startTime) : true;

  const fieldStyle: CSSProperties = {
    padding: 10,
    borderRadius: 8,
    border: `1px solid ${theme.cardBorder}`,
    background: theme.cardBg,
    color: theme.pageText,
    fontFamily: theme.fontBody,
    fontSize: 14,
  };

  const labelStyle: CSSProperties = {
    fontSize: 13,
    color: theme.mutedText,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  };

  const buttonStyle: CSSProperties = {
    padding: 13,
    borderRadius: 10,
    border: "none",
    background: theme.accent,
    color: theme.accentText,
    fontFamily: theme.fontBody,
    fontSize: 14.5,
    fontWeight: 700,
    cursor: canSubmit ? "pointer" : "not-allowed",
    opacity: isPending || !canSubmit ? 0.6 : 1,
  };

  return (
    <form
      action={formAction}
      style={{ display: "flex", flexDirection: "column", gap: 8, margin: "24px 0" }}
    >
      <select
        name="resource_id"
        required
        value={resourceId}
        onChange={(e) => setResourceId(e.target.value)}
        style={fieldStyle}
      >
        <option value="" disabled>
          Elegí un recurso
        </option>
        {resources.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>

      {hasServices && (
        <select
          name="service_id"
          required
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          style={fieldStyle}
        >
          <option value="" disabled>
            Elegí un servicio
          </option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {formatServiceOption(s)}
            </option>
          ))}
        </select>
      )}

      <input name="client_name" placeholder="Tu nombre" required style={fieldStyle} />
      <input name="client_phone" placeholder="Tu teléfono" required style={fieldStyle} />

      {hasServices ? (
        resourceId && selectedService ? (
          <BrandedDateTimePicker
            businessId={businessId}
            resourceId={resourceId}
            timezone={timezone}
            slotIntervalMinutes={slotIntervalMinutes}
            bookingWindowDays={bookingWindowDays}
            durationMinutes={selectedService.duration_minutes}
            hoursList={hoursList}
            theme={theme}
            onChange={setStartTime}
          />
        ) : (
          <p style={{ fontSize: 13, color: theme.mutedText }}>
            Elegí un recurso y un servicio para ver los horarios disponibles.
          </p>
        )
      ) : (
        <>
          <label style={labelStyle}>
            Inicio
            <input
              name="start_time"
              type="datetime-local"
              required
              onChange={(e) => setStartTime(e.target.value)}
              style={fieldStyle}
            />
          </label>
          <label style={labelStyle}>
            Fin
            <input name="end_time" type="datetime-local" required style={fieldStyle} />
          </label>
        </>
      )}
      {hasServices && <input type="hidden" name="start_time" value={startTime} />}

      <button type="submit" disabled={isPending || !canSubmit} style={buttonStyle}>
        {isPending ? "Reservando..." : "Reservar turno"}
      </button>

      {state.error && <p style={{ color: "#e5484d" }}>{state.error}</p>}
      {state.success && <p style={{ color: "#30a46c" }}>¡Turno reservado con éxito!</p>}
    </form>
  );
}
