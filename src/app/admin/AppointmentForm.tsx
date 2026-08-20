"use client";

import { useActionState, useState } from "react";
import type { AppointmentFormState } from "./actions";

type Business = { id: string; name: string };
type Resource = { id: string; business_id: string; name: string };
type Service = { id: string; business_id: string; name: string; duration_minutes: number; price: number | string };

function formatServiceOption(s: Service) {
  const price = Number(s.price).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
  return `${s.name} — ${s.duration_minutes} min — ${price}`;
}

export default function AppointmentForm({
  businesses,
  resources,
  services,
  action,
}: {
  businesses: Business[];
  resources: Resource[];
  services: Service[];
  action: (
    prevState: AppointmentFormState,
    formData: FormData
  ) => Promise<AppointmentFormState>;
}) {
  const [state, formAction, isPending] = useActionState(action, { error: null });
  const [businessId, setBusinessId] = useState("");

  const filteredResources = resources.filter((r) => r.business_id === businessId);
  const filteredServices = services.filter((s) => s.business_id === businessId);
  const hasServices = filteredServices.length > 0;

  return (
    <form
      action={formAction}
      style={{ display: "flex", flexDirection: "column", gap: 8, margin: "24px 0" }}
    >
      <select
        name="business_id"
        required
        value={businessId}
        onChange={(e) => setBusinessId(e.target.value)}
        style={{ padding: 8 }}
      >
        <option value="">Elegí un negocio</option>
        {businesses.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>

      <select
        name="resource_id"
        required
        disabled={!businessId}
        defaultValue=""
        style={{ padding: 8 }}
      >
        <option value="">{businessId ? "Elegí un recurso" : "Elegí primero un negocio"}</option>
        {filteredResources.map((r) => (
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
          {filteredServices.map((s) => (
            <option key={s.id} value={s.id}>
              {formatServiceOption(s)}
            </option>
          ))}
        </select>
      )}

      <input name="client_name" placeholder="Nombre del cliente" required style={{ padding: 8 }} />
      <input
        name="client_phone"
        placeholder="Teléfono del cliente"
        required
        style={{ padding: 8 }}
      />

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
        {isPending ? "Creando..." : "Crear turno"}
      </button>

      {state.error && <p style={{ color: "red" }}>{state.error}</p>}
    </form>
  );
}
