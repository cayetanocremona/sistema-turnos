import { createClient } from "@/lib/supabase/server";
import { getMyBusinesses } from "../data";
import { addBusinessHour } from "../actions";

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function formatTime(t: string) {
  return t.slice(0, 5);
}

export default async function HoursPage() {
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const { data: businesses } = await getMyBusinesses(supabaseServer, user!.id);
  const businessList = businesses ?? [];
  const businessIds = businessList.map((b) => b.id);

  const { data: businessHours, error } =
    businessIds.length === 0
      ? { data: [], error: null }
      : await supabaseServer
          .from("business_hours")
          .select("*")
          .in("business_id", businessIds)
          .order("day_of_week", { ascending: true });

  const businessHourList = businessHours ?? [];

  return (
    <section>
      <h1>Horarios de atención</h1>

      {businessList.length === 0 ? (
        <p>Todavía no tenés negocios propios. Creá uno en la sección Negocios.</p>
      ) : (
        <form
          action={addBusinessHour}
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
          <select name="day_of_week" required style={{ padding: 8 }} defaultValue="">
            <option value="" disabled>
              Elegí un día
            </option>
            {DAY_NAMES.map((name, i) => (
              <option key={i} value={i}>
                {name}
              </option>
            ))}
          </select>
          <label style={{ fontSize: 14, color: "#666", display: "flex", flexDirection: "column", gap: 4 }}>
            Hora de inicio
            <input name="start_time" type="time" required style={{ padding: 8 }} />
          </label>
          <label style={{ fontSize: 14, color: "#666", display: "flex", flexDirection: "column", gap: 4 }}>
            Hora de fin
            <input name="end_time" type="time" required style={{ padding: 8 }} />
          </label>
          <button type="submit" style={{ padding: 8, cursor: "pointer" }}>
            Agregar horario
          </button>
        </form>
      )}

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      {businessList.map((b) => {
        const hours = businessHourList
          .filter((h) => h.business_id === b.id)
          .slice()
          .sort((a, c) => a.day_of_week - c.day_of_week || a.start_time.localeCompare(c.start_time));
        return (
          <div key={b.id} style={{ margin: "12px 0" }}>
            <strong>{b.name}</strong>
            <ul>
              {hours.map((h) => (
                <li key={h.id}>
                  {DAY_NAMES[h.day_of_week]}: {formatTime(h.start_time)}–{formatTime(h.end_time)}
                </li>
              ))}
              {hours.length === 0 && <li>Sin horarios cargados.</li>}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
