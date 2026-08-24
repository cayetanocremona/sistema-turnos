import { createClient } from "@/lib/supabase/server";
import { getOwnedTenant } from "../data";
import { addAppointment, cancelAppointment, rescheduleAppointment } from "../actions";
import { formatInTimeZone } from "@/lib/datetime";
import AppointmentForm from "../AppointmentForm";
import AppointmentActions from "./AppointmentActions";
import Card from "@/components/ui/Card";
import Pill from "@/components/ui/Pill";

export default async function AppointmentsPage({ params }: PageProps<"/[slug]/owner/appointments">) {
  const { slug } = await params;
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const business = await getOwnedTenant(supabaseServer, slug, user!.id);
  if (!business) return null;

  const [{ data: resources }, { data: services }] = await Promise.all([
    supabaseServer.from("resources").select("id, name").eq("business_id", business.id),
    supabaseServer.from("services").select("id, name, duration_minutes, price").eq("business_id", business.id),
  ]);
  const resourceList = resources ?? [];
  const serviceList = services ?? [];

  // Contiene datos privados del negocio (nombre/teléfono del cliente): va con el cliente
  // autenticado para que RLS filtre solo los turnos de este negocio.
  const { data: appointments, error } = await supabaseServer
    .from("appointments")
    .select("*, resources(name), services(name), clients(name, phone)")
    .eq("business_id", business.id)
    .order("start_time", { ascending: false });

  const appointmentList = appointments ?? [];

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-neutral-900">Turnos</h1>

      <Card className="p-5">
        <AppointmentForm
          businessId={business.id}
          resources={resourceList}
          services={serviceList}
          action={addAppointment}
        />
      </Card>

      {error && <p className="text-sm font-medium text-rose-600">Error: {error.message}</p>}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-black/[0.06] text-left text-xs font-semibold text-neutral-500">
            <tr>
              <th className="px-5 py-3">Recurso</th>
              <th className="px-5 py-3">Servicio</th>
              <th className="px-5 py-3">Cliente</th>
              <th className="px-5 py-3">Teléfono</th>
              <th className="px-5 py-3">Inicio</th>
              <th className="px-5 py-3">Fin</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {appointmentList.map((a) => {
              const isCancelled = a.status === "cancelled";
              return (
                <tr
                  key={a.id}
                  className={`border-b border-black/[0.04] transition-opacity last:border-0 ${isCancelled ? "opacity-50" : ""}`}
                >
                  <td className="px-5 py-3 font-medium text-neutral-800">{a.resources?.name}</td>
                  <td className="px-5 py-3 text-neutral-600">{a.services?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-neutral-600">{a.clients?.name}</td>
                  <td className="px-5 py-3 text-neutral-600">{a.clients?.phone}</td>
                  <td className="px-5 py-3 text-neutral-600">{formatInTimeZone(a.start_time, business.timezone)}</td>
                  <td className="px-5 py-3 text-neutral-600">{formatInTimeZone(a.end_time, business.timezone)}</td>
                  <td className="px-5 py-3">
                    <Pill variant={isCancelled ? "danger" : "success"}>
                      {isCancelled ? "Cancelado" : "Confirmado"}
                    </Pill>
                  </td>
                  <td className="px-5 py-3">
                    <AppointmentActions
                      appointmentId={a.id}
                      status={a.status}
                      slug={slug}
                      resourceId={a.resource_id}
                      startTime={a.start_time}
                      timezone={business.timezone}
                      resources={resourceList}
                      cancelAction={cancelAppointment}
                      rescheduleAction={rescheduleAppointment}
                    />
                  </td>
                </tr>
              );
            })}
            {appointmentList.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-6 text-center text-neutral-400">
                  Todavía no hay turnos cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </section>
  );
}
