import { createClient } from "@/lib/supabase/server";
import { getOwnedTenant } from "../data";
import { addBlockedSlot } from "../actions";
import { formatInTimeZone } from "@/lib/datetime";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default async function BlockedSlotsPage({ params }: PageProps<"/[slug]/owner/blocked-slots">) {
  const { slug } = await params;
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const business = await getOwnedTenant(supabaseServer, slug, user!.id);
  if (!business) return null;

  const { data: resources } = await supabaseServer
    .from("resources")
    .select("id, name")
    .eq("business_id", business.id)
    .order("created_at", { ascending: true });

  const resourceList = resources ?? [];
  const resourceIds = resourceList.map((r) => r.id);

  const { data: blockedSlots, error } =
    resourceIds.length === 0
      ? { data: [], error: null }
      : await supabaseServer
          .from("blocked_slots")
          .select("*, resources(name)")
          .in("resource_id", resourceIds)
          .order("start_time", { ascending: true });

  const blockedSlotList = blockedSlots ?? [];

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900">Bloqueos</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Rangos de tiempo en los que un recurso no está disponible (vacaciones, mantenimiento,
          etc.), más allá de los turnos ya reservados.
        </p>
      </div>

      {resourceList.length === 0 ? (
        <p className="text-sm text-neutral-500">Cargá un recurso propio primero en la sección Recursos.</p>
      ) : (
        <Card className="p-5">
          <form action={addBlockedSlot} className="flex flex-col gap-3">
            <select
              name="resource_id"
              required
              defaultValue=""
              className="rounded-xl border border-black/10 px-3.5 py-2.5 text-sm outline-none focus:border-[var(--brand-accent)]"
            >
              <option value="" disabled>
                Elegí un recurso
              </option>
              {resourceList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-neutral-500">
                Inicio
                <input
                  name="start_time"
                  type="datetime-local"
                  required
                  className="rounded-xl border border-black/10 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-[var(--brand-accent)]"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-neutral-500">
                Fin
                <input
                  name="end_time"
                  type="datetime-local"
                  required
                  className="rounded-xl border border-black/10 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-[var(--brand-accent)]"
                />
              </label>
            </div>
            <input
              name="reason"
              placeholder="Motivo (opcional)"
              className="rounded-xl border border-black/10 px-3.5 py-2.5 text-sm outline-none focus:border-[var(--brand-accent)]"
            />
            <div>
              <Button type="submit">Agregar bloqueo</Button>
            </div>
          </form>
        </Card>
      )}

      {error && <p className="text-sm font-medium text-rose-600">Error: {error.message}</p>}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-black/[0.06] text-left text-xs font-semibold text-neutral-500">
            <tr>
              <th className="px-5 py-3">Recurso</th>
              <th className="px-5 py-3">Inicio</th>
              <th className="px-5 py-3">Fin</th>
              <th className="px-5 py-3">Motivo</th>
            </tr>
          </thead>
          <tbody>
            {blockedSlotList.map((s) => (
              <tr key={s.id} className="border-b border-black/[0.04] last:border-0">
                <td className="px-5 py-3 font-medium text-neutral-800">{s.resources?.name}</td>
                <td className="px-5 py-3 text-neutral-600">{formatInTimeZone(s.start_time, business.timezone)}</td>
                <td className="px-5 py-3 text-neutral-600">{formatInTimeZone(s.end_time, business.timezone)}</td>
                <td className="px-5 py-3 text-neutral-600">{s.reason || "—"}</td>
              </tr>
            ))}
            {blockedSlotList.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-center text-neutral-400">
                  Sin bloqueos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </section>
  );
}
