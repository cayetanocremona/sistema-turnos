import { createClient } from "@/lib/supabase/server";
import { getMyBusinesses, getMyResources, getMyServices } from "../data";
import { addAppointment, cancelAppointment, rescheduleAppointment } from "../actions";
import { formatInTimeZone } from "@/lib/datetime";
import AppointmentForm from "../AppointmentForm";
import AppointmentActions from "./AppointmentActions";

export default async function AppointmentsPage() {
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const { data: businesses } = await getMyBusinesses(supabaseServer, user!.id);
  const businessList = businesses ?? [];
  const businessIds = businessList.map((b) => b.id);

  const { data: resources } = await getMyResources(supabaseServer, businessIds);
  const resourceList = resources ?? [];

  const { data: services } = await getMyServices(supabaseServer, businessIds);
  const serviceList = services ?? [];

  // Contiene datos privados por negocio (nombre/teléfono del cliente): va con el cliente
  // autenticado para que RLS filtre solo los turnos del dueño logueado.
  const { data: appointments, error } =
    businessIds.length === 0
      ? { data: [], error: null }
      : await supabaseServer
          .from("appointments")
          .select("*, resources(name), services(name), businesses(name, timezone), clients(name, phone)")
          .in("business_id", businessIds)
          .order("start_time", { ascending: false });

  const appointmentList = appointments ?? [];

  return (
    <section>
      <h1>Turnos</h1>

      {businessList.length === 0 ? (
        <p>Todavía no tenés negocios propios. Creá uno en la sección Negocios.</p>
      ) : (
        <AppointmentForm
          businesses={businessList}
          resources={resourceList}
          services={serviceList}
          action={addAppointment}
        />
      )}

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      <ul>
        {appointmentList.map((a) => {
          const timezone = a.businesses?.timezone ?? "America/Argentina/Buenos_Aires";
          const isCancelled = a.status === "cancelled";
          return (
            <li
              key={a.id}
              style={{
                marginBottom: 8,
                color: isCancelled ? "#999" : undefined,
                textDecoration: isCancelled ? "line-through" : undefined,
              }}
            >
              {a.businesses?.name} — {a.resources?.name}
              {a.services?.name ? ` (${a.services.name})` : ""} — {a.clients?.name} (
              {a.clients?.phone}): {formatInTimeZone(a.start_time, timezone)} →{" "}
              {formatInTimeZone(a.end_time, timezone)}
              <div style={{ textDecoration: "none", marginTop: 4 }}>
                <AppointmentActions
                  appointmentId={a.id}
                  status={a.status}
                  businessId={a.business_id}
                  resourceId={a.resource_id}
                  startTime={a.start_time}
                  timezone={timezone}
                  resources={resourceList}
                  cancelAction={cancelAppointment}
                  rescheduleAction={rescheduleAppointment}
                />
              </div>
            </li>
          );
        })}
        {appointmentList.length === 0 && <li>Todavía no hay turnos cargados.</li>}
      </ul>
    </section>
  );
}
