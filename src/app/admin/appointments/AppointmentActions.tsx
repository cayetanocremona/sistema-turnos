"use client";

import { useActionState, useState } from "react";
import type { AppointmentMutationState } from "../actions";
import { instantToLocalInputValue } from "@/lib/datetime";

type Resource = { id: string; business_id: string; name: string };

type MutationAction = (
  prevState: AppointmentMutationState,
  formData: FormData
) => Promise<AppointmentMutationState>;

export default function AppointmentActions({
  appointmentId,
  status,
  businessId,
  resourceId,
  startTime,
  timezone,
  resources,
  cancelAction,
  rescheduleAction,
}: {
  appointmentId: string;
  status: string;
  businessId: string;
  resourceId: string;
  startTime: string;
  timezone: string;
  resources: Resource[];
  cancelAction: MutationAction;
  rescheduleAction: MutationAction;
}) {
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [cancelState, cancelFormAction, isCancelling] = useActionState(cancelAction, {
    error: null,
  });
  const [rescheduleState, rescheduleFormAction, isSubmittingReschedule] = useActionState(
    rescheduleAction,
    { error: null }
  );

  if (status === "cancelled") {
    return <span style={{ color: "#999", fontSize: 14 }}>Cancelado</span>;
  }

  const filteredResources = resources.filter((r) => r.business_id === businessId);

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 6 }}>
      <span style={{ display: "inline-flex", gap: 8 }}>
        <form
          action={cancelFormAction}
          onSubmit={(e) => {
            if (!confirm("¿Cancelar este turno? El horario queda libre para nuevas reservas.")) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="appointment_id" value={appointmentId} />
          <button type="submit" disabled={isCancelling} style={{ cursor: "pointer" }}>
            {isCancelling ? "Cancelando..." : "Cancelar"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setIsRescheduling((v) => !v)}
          style={{ cursor: "pointer" }}
        >
          {isRescheduling ? "Cerrar" : "Reagendar"}
        </button>
      </span>

      {cancelState.error && <p style={{ color: "red", fontSize: 13, margin: 0 }}>{cancelState.error}</p>}

      {isRescheduling && (
        <form
          action={rescheduleFormAction}
          style={{ display: "flex", flexDirection: "column", gap: 6, padding: 8, background: "#f5f5f5" }}
        >
          <input type="hidden" name="appointment_id" value={appointmentId} />

          <select name="resource_id" defaultValue={resourceId} style={{ padding: 6 }}>
            {filteredResources.map((r) => (
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
            style={{ padding: 6 }}
          />

          <button type="submit" disabled={isSubmittingReschedule} style={{ cursor: "pointer" }}>
            {isSubmittingReschedule ? "Guardando..." : "Confirmar nuevo horario"}
          </button>

          {rescheduleState.error && (
            <p style={{ color: "red", fontSize: 13, margin: 0 }}>{rescheduleState.error}</p>
          )}
        </form>
      )}
    </span>
  );
}
