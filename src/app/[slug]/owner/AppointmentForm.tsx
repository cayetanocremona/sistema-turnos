"use client";

import { useActionState, useState } from "react";
import type { AppointmentFormState } from "./actions";
import Button from "@/components/ui/Button";
import { filterServicesForResource, type ResourceServiceLink } from "@/lib/resourceServices";

type Resource = { id: string; name: string };
type Service = { id: string; name: string; duration_minutes: number; price: number | string };

function formatServiceOption(s: Service) {
  const price = Number(s.price).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
  return `${s.name} — ${s.duration_minutes} min — ${price}`;
}

const fieldClass =
  "rounded-xl border border-black/10 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-[var(--brand-accent)]";

export default function AppointmentForm({
  businessId,
  resources,
  services,
  resourceServices,
  action,
}: {
  businessId: string;
  resources: Resource[];
  services: Service[];
  resourceServices: ResourceServiceLink[];
  action: (
    prevState: AppointmentFormState,
    formData: FormData
  ) => Promise<AppointmentFormState>;
}) {
  const [state, formAction, isPending] = useActionState(action, { error: null });
  const hasServices = services.length > 0;
  const [resourceId, setResourceId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const availableServices = resourceId
    ? filterServicesForResource(services, resourceId, resourceServices)
    : services;

  function handleResourceChange(newResourceId: string) {
    setResourceId(newResourceId);
    const stillValid = filterServicesForResource(services, newResourceId, resourceServices).some(
      (s) => s.id === serviceId
    );
    if (!stillValid) setServiceId("");
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="business_id" value={businessId} />

      <select
        name="resource_id"
        required
        value={resourceId}
        onChange={(e) => handleResourceChange(e.target.value)}
        className={fieldClass}
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
          className={fieldClass}
        >
          <option value="" disabled>
            Elegí un servicio
          </option>
          {availableServices.map((s) => (
            <option key={s.id} value={s.id}>
              {formatServiceOption(s)}
            </option>
          ))}
        </select>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <input name="client_name" placeholder="Nombre del cliente" required className={`flex-1 ${fieldClass}`} />
        <input name="client_phone" placeholder="Teléfono del cliente" required className={`flex-1 ${fieldClass}`} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-neutral-500">
          Inicio
          <input name="start_time" type="datetime-local" required className={fieldClass} />
        </label>
        {!hasServices && (
          <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-neutral-500">
            Fin
            <input name="end_time" type="datetime-local" required className={fieldClass} />
          </label>
        )}
      </div>

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creando..." : "Crear turno"}
        </Button>
      </div>

      {state.error && <p className="text-sm font-medium text-rose-600">{state.error}</p>}
    </form>
  );
}
