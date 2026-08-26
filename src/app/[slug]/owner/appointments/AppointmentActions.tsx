"use client";

import { useActionState, useState } from "react";
import type { AppointmentMutationState } from "../actions";
import { instantToLocalInputValue } from "@/lib/datetime";
import Button from "@/components/ui/Button";
import { filterResourcesForService, type ResourceServiceLink } from "@/lib/resourceServices";

type Resource = { id: string; name: string };

type MutationAction = (
  prevState: AppointmentMutationState,
  formData: FormData
) => Promise<AppointmentMutationState>;

export default function AppointmentActions({
  appointmentId,
  status,
  slug,
  resourceId,
  serviceId,
  startTime,
  timezone,
  resources,
  resourceServices,
  cancelAction,
  rescheduleAction,
}: {
  appointmentId: string;
  status: string;
  slug: string;
  resourceId: string;
  serviceId: string | null;
  startTime: string;
  timezone: string;
  resources: Resource[];
  resourceServices: ResourceServiceLink[];
  cancelAction: MutationAction;
  rescheduleAction: MutationAction;
}) {
  // El turno mantiene su servicio original al reagendar (no hay selector de
  // servicio acá, ver actions.ts) -- así que en vez de filtrar servicios por
  // recurso como en los forms de alta, acá se filtra al revés: solo se
  // ofrecen los recursos compatibles con el servicio que el turno ya tiene.
  // Sin servicio (turno legacy sin catálogo) no hay nada que validar, se
  // muestran todos los recursos como siempre.
  const availableResources = serviceId
    ? filterResourcesForService(resources, serviceId, resourceServices)
    : resources;
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [cancelState, cancelFormAction, isCancelling] = useActionState(cancelAction, {
    error: null,
  });
  const [rescheduleState, rescheduleFormAction, isSubmittingReschedule] = useActionState(
    rescheduleAction,
    { error: null }
  );

  if (status === "cancelled") {
    return <span className="text-xs text-neutral-400">—</span>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <form
          action={cancelFormAction}
          onSubmit={(e) => {
            if (!confirm("¿Cancelar este turno? El horario queda libre para nuevas reservas.")) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="appointment_id" value={appointmentId} />
          <input type="hidden" name="slug" value={slug} />
          <Button type="submit" disabled={isCancelling} variant="outline" size="sm" className="border-rose-200 text-rose-600 hover:bg-rose-50">
            {isCancelling ? "Cancelando..." : "Cancelar"}
          </Button>
        </form>

        <Button type="button" variant="outline" size="sm" onClick={() => setIsRescheduling((v) => !v)}>
          {isRescheduling ? "Cerrar" : "Reagendar"}
        </Button>
      </div>

      {cancelState.error && <p className="text-xs font-medium text-rose-600">{cancelState.error}</p>}

      {isRescheduling && (
        <form action={rescheduleFormAction} className="flex flex-col gap-2 rounded-xl border border-black/10 p-3">
          <input type="hidden" name="appointment_id" value={appointmentId} />
          <input type="hidden" name="slug" value={slug} />

          <select
            name="resource_id"
            defaultValue={resourceId}
            className="rounded-lg border border-black/10 px-2.5 py-1.5 text-xs outline-none focus:border-[var(--brand-accent)]"
          >
            {availableResources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <input
            name="start_time"
            type="datetime-local"
            required
            defaultValue={instantToLocalInputValue(startTime, timezone)}
            className="rounded-lg border border-black/10 px-2.5 py-1.5 text-xs outline-none focus:border-[var(--brand-accent)]"
          />

          <Button type="submit" disabled={isSubmittingReschedule} size="sm">
            {isSubmittingReschedule ? "Guardando..." : "Confirmar nuevo horario"}
          </Button>

          {rescheduleState.error && (
            <p className="text-xs font-medium text-rose-600">{rescheduleState.error}</p>
          )}
        </form>
      )}
    </div>
  );
}
