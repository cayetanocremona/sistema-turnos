import { createClient } from "@/lib/supabase/server";
import { getMyBusinesses, getMyResources } from "../data";
import { addResource } from "../actions";

export default async function ResourcesPage() {
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const { data: businesses } = await getMyBusinesses(supabaseServer, user!.id);
  const businessList = businesses ?? [];
  const businessIds = businessList.map((b) => b.id);

  const { data: resources, error } = await getMyResources(supabaseServer, businessIds);
  const resourceList = resources ?? [];

  return (
    <section>
      <h1>Recursos</h1>
      <p style={{ color: "#666" }}>
        Lo que efectivamente se reserva: cancha, sillón, box, profesional.
      </p>

      {businessList.length === 0 ? (
        <p>Todavía no tenés negocios propios. Creá uno en la sección Negocios.</p>
      ) : (
        <form
          action={addResource}
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
            placeholder="Nombre del recurso (ej: Cancha 1, Dr. Pérez)"
            required
            style={{ padding: 8 }}
          />
          <button type="submit" style={{ padding: 8, cursor: "pointer" }}>
            Crear recurso
          </button>
        </form>
      )}

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      {businessList.map((b) => {
        const businessResources = resourceList.filter((r) => r.business_id === b.id);
        return (
          <div key={b.id} style={{ margin: "12px 0" }}>
            <strong>{b.name}</strong>
            <ul>
              {businessResources.map((r) => (
                <li key={r.id}>{r.name}</li>
              ))}
              {businessResources.length === 0 && <li>Sin recursos.</li>}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
