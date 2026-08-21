"use client";

import { useActionState } from "react";
import type { CSSProperties } from "react";
import type { StorefrontTheme } from "./theme";

type Resource = { id: string; name: string };
type Service = { id: string; name: string; duration_minutes: number; price: number | string };
type PublicAppointmentFormState = { error: string | null; success: boolean };

function formatServiceOption(s: Service) {
  const price = Number(s.price).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
  return `${s.name} — ${s.duration_minutes} min — ${price}`;
}

export default function PublicAppointmentForm({
  resources,
  services,
  action,
  theme,
}: {
  resources: Resource[];
  services: Service[];
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
    cursor: "pointer",
  };

  return (
    <form
      action={formAction}
      style={{ display: "flex", flexDirection: "column", gap: 8, margin: "24px 0" }}
    >
      <select name="resource_id" required defaultValue="" style={fieldStyle}>
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
        <select name="service_id" required defaultValue="" style={fieldStyle}>
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

      <label style={labelStyle}>
        Inicio
        <input name="start_time" type="datetime-local" required style={fieldStyle} />
      </label>
      {!hasServices && (
        <label style={labelStyle}>
          Fin
          <input name="end_time" type="datetime-local" required style={fieldStyle} />
        </label>
      )}

      <button type="submit" disabled={isPending} style={buttonStyle}>
        {isPending ? "Reservando..." : "Reservar turno"}
      </button>

      {state.error && <p style={{ color: "#e5484d" }}>{state.error}</p>}
      {state.success && <p style={{ color: "#30a46c" }}>¡Turno reservado con éxito!</p>}
    </form>
  );
}
