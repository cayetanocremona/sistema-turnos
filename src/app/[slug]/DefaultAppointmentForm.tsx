"use client";

import { useActionState } from "react";
import Button from "@/components/ui/Button";

type Resource = { id: string; name: string };
type Service = { id: string; name: string; duration_minutes: number; price: number | string };
type PublicAppointmentFormState = { error: string | null; success: boolean };

function formatServiceOption(s: Service) {
  const price = Number(s.price).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
  return `${s.name} — ${s.duration_minutes} min — ${price}`;
}

const fieldClass =
  "rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-[var(--brand-accent)]";

export default function DefaultAppointmentForm({
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
  const [state, formAction, isPending] = useActionState(action, { error: null, success: false });
  const hasServices = services.length > 0;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <select name="resource_id" required defaultValue="" className={fieldClass}>
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
        <select name="service_id" required defaultValue="" className={fieldClass}>
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

      <input name="client_name" placeholder="Tu nombre" required className={fieldClass} />
      <input name="client_phone" placeholder="Tu teléfono" required className={fieldClass} />

      <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
        Inicio
        <input name="start_time" type="datetime-local" required className={fieldClass} />
      </label>
      {!hasServices && (
        <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
          Fin
          <input name="end_time" type="datetime-local" required className={fieldClass} />
        </label>
      )}

      <Button type="submit" disabled={isPending} className="mt-1 w-full">
        {isPending ? "Reservando..." : "Reservar turno"}
      </Button>

      {state.error && <p className="text-sm font-medium text-rose-600">{state.error}</p>}
      {state.success && <p className="text-sm font-medium text-emerald-600">¡Turno reservado con éxito!</p>}
    </form>
  );
}
