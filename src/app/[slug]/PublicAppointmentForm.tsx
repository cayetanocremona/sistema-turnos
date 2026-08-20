"use client";

import { useActionState } from "react";

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
}: {
  resources: Resource[];
  services: Service[];
  action: (
    prevState: PublicAppointmentFormState,
    formData: FormData
  ) => Promise<PublicAppointmentFormState>;
}) {
  const [state, formAction, isPending] = useActionState(action, {
    error: null,
    success: false,
  });

  const hasServices = services.length > 0;

  return (
    <form
      action={formAction}
      style={{ display: "flex", flexDirection: "column", gap: 8, margin: "24px 0" }}
    >
      <select name="resource_id" required defaultValue="" style={{ padding: 8 }}>
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
        <select name="service_id" required defaultValue="" style={{ padding: 8 }}>
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

      <input name="client_name" placeholder="Tu nombre" required style={{ padding: 8 }} />
      <input name="client_phone" placeholder="Tu teléfono" required style={{ padding: 8 }} />

      <label style={{ fontSize: 14, color: "#666", display: "flex", flexDirection: "column", gap: 4 }}>
        Inicio
        <input name="start_time" type="datetime-local" required style={{ padding: 8 }} />
      </label>
      {!hasServices && (
        <label style={{ fontSize: 14, color: "#666", display: "flex", flexDirection: "column", gap: 4 }}>
          Fin
          <input name="end_time" type="datetime-local" required style={{ padding: 8 }} />
        </label>
      )}

      <button type="submit" disabled={isPending} style={{ padding: 8, cursor: "pointer" }}>
        {isPending ? "Reservando..." : "Reservar turno"}
      </button>

      {state.error && <p style={{ color: "red" }}>{state.error}</p>}
      {state.success && <p style={{ color: "green" }}>¡Turno reservado con éxito!</p>}
    </form>
  );
}
