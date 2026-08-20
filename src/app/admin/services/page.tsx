import { createClient } from "@/lib/supabase/server";
import { getMyBusinesses } from "../data";
import { addService } from "../actions";

function formatPrice(p: number | string) {
  // Postgres numeric puede llegar como string vía PostgREST (evita perder precisión en JS).
  return Number(p).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

export default async function ServicesPage() {
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const { data: businesses } = await getMyBusinesses(supabaseServer, user!.id);
  const businessList = businesses ?? [];
  const businessIds = businessList.map((b) => b.id);

  const { data: services, error } =
    businessIds.length === 0
      ? { data: [], error: null }
      : await supabaseServer
          .from("services")
          .select("*")
          .in("business_id", businessIds)
          .order("created_at", { ascending: false });

  const serviceList = services ?? [];

  return (
    <section>
      <h1>Servicios</h1>
      <p style={{ color: "#666" }}>Catálogo por negocio: nombre, duración y precio.</p>

      {businessList.length === 0 ? (
        <p>Todavía no tenés negocios propios. Creá uno en la sección Negocios.</p>
      ) : (
        <form
          action={addService}
          style={{ display: "flex", flexDirection: "column", gap: 8, margin: "16px 0" }}
        >
          <select name="business_id" required style={{ padding: 8 }} defaultValue="">
            <option value="" disabled>
              Elegí un negocio
            </option>
            {businessList.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <input
            name="name"
            placeholder="Nombre del servicio (ej: Corte de pelo, Consulta)"
            required
            style={{ padding: 8 }}
          />
          <label style={{ fontSize: 14, color: "#666", display: "flex", flexDirection: "column", gap: 4 }}>
            Duración (minutos)
            <input name="duration_minutes" type="number" min={1} step={1} required style={{ padding: 8 }} />
          </label>
          <label style={{ fontSize: 14, color: "#666", display: "flex", flexDirection: "column", gap: 4 }}>
            Precio (ARS)
            <input name="price" type="number" min={0} step="0.01" required style={{ padding: 8 }} />
          </label>
          <button type="submit" style={{ padding: 8, cursor: "pointer" }}>
            Crear servicio
          </button>
        </form>
      )}

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      {businessList.map((b) => {
        const businessServices = serviceList.filter((s) => s.business_id === b.id);
        return (
          <div key={b.id} style={{ margin: "12px 0" }}>
            <strong>{b.name}</strong>
            <ul>
              {businessServices.map((s) => (
                <li key={s.id}>
                  {s.name} — {s.duration_minutes} min — {formatPrice(s.price)}
                </li>
              ))}
              {businessServices.length === 0 && <li>Sin servicios.</li>}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
