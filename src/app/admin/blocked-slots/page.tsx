import { createClient } from "@/lib/supabase/server";
import { getMyBusinesses, getMyResources } from "../data";
import { addBlockedSlot } from "../actions";
import { formatInTimeZone } from "@/lib/datetime";

export default async function BlockedSlotsPage() {
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const { data: businesses } = await getMyBusinesses(supabaseServer, user!.id);
  const businessList = businesses ?? [];
  const businessIds = businessList.map((b) => b.id);
  const businessMap = new Map(businessList.map((b) => [b.id, b]));

  const { data: resources } = await getMyResources(supabaseServer, businessIds);
  const resourceList = resources ?? [];
  const resourceIds = resourceList.map((r) => r.id);

  const { data: blockedSlots, error } =
    resourceIds.length === 0
      ? { data: [], error: null }
      : await supabaseServer
          .from("blocked_slots")
          .select("*")
          .in("resource_id", resourceIds)
          .order("start_time", { ascending: true });

  const blockedSlotList = blockedSlots ?? [];

  return (
    <section>
      <h1>Bloqueos</h1>
      <p style={{ color: "#666" }}>
        Rangos de tiempo en los que un recurso no está disponible (vacaciones, mantenimiento,
        etc.), más allá de los turnos ya reservados.
      </p>

      {resourceList.length === 0 ? (
        <p>Cargá un recurso propio primero en la sección Recursos.</p>
      ) : (
        <form
          action={addBlockedSlot}
          style={{ display: "flex", flexDirection: "column", gap: 8, margin: "16px 0" }}
        >
          <select name="resource_id" required style={{ padding: 8 }} defaultValue="">
            <option value="" disabled>
              Elegí un recurso
            </option>
            {resourceList.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({businessMap.get(r.business_id)?.name ?? "?"})
              </option>
            ))}
          </select>
          <label style={{ fontSize: 14, color: "#666", display: "flex", flexDirection: "column", gap: 4 }}>
            Inicio
            <input name="start_time" type="datetime-local" required style={{ padding: 8 }} />
          </label>
          <label style={{ fontSize: 14, color: "#666", display: "flex", flexDirection: "column", gap: 4 }}>
            Fin
            <input name="end_time" type="datetime-local" required style={{ padding: 8 }} />
          </label>
          <input name="reason" placeholder="Motivo (opcional)" style={{ padding: 8 }} />
          <button type="submit" style={{ padding: 8, cursor: "pointer" }}>
            Agregar bloqueo
          </button>
        </form>
      )}

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      {resourceList.map((r) => {
        const blocks = blockedSlotList.filter((s) => s.resource_id === r.id);
        const timezone = businessMap.get(r.business_id)?.timezone ?? "America/Argentina/Buenos_Aires";
        return (
          <div key={r.id} style={{ margin: "12px 0" }}>
            <strong>
              {r.name}{" "}
              <span style={{ color: "#666", fontWeight: "normal" }}>
                ({businessMap.get(r.business_id)?.name ?? "?"})
              </span>
            </strong>
            <ul>
              {blocks.map((s) => (
                <li key={s.id}>
                  {formatInTimeZone(s.start_time, timezone)} → {formatInTimeZone(s.end_time, timezone)}
                  {s.reason ? ` — ${s.reason}` : ""}
                </li>
              ))}
              {blocks.length === 0 && <li>Sin bloqueos.</li>}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
