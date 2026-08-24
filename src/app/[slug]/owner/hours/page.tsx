import { createClient } from "@/lib/supabase/server";
import { getOwnedTenant } from "../data";
import { addBusinessHour } from "../actions";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function formatTime(t: string) {
  return t.slice(0, 5);
}

export default async function HoursPage({ params }: PageProps<"/[slug]/owner/hours">) {
  const { slug } = await params;
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const business = await getOwnedTenant(supabaseServer, slug, user!.id);
  if (!business) return null;

  const { data: businessHours, error } = await supabaseServer
    .from("business_hours")
    .select("*")
    .eq("business_id", business.id)
    .order("day_of_week", { ascending: true });

  const hours = (businessHours ?? [])
    .slice()
    .sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time));

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-neutral-900">Horarios de atención</h1>

      <Card className="p-5">
        <form action={addBusinessHour} className="flex flex-col gap-3">
          <input type="hidden" name="business_id" value={business.id} />
          <select
            name="day_of_week"
            required
            defaultValue=""
            className="rounded-xl border border-black/10 px-3.5 py-2.5 text-sm outline-none focus:border-[var(--brand-accent)]"
          >
            <option value="" disabled>
              Elegí un día
            </option>
            {DAY_NAMES.map((name, i) => (
              <option key={i} value={i}>
                {name}
              </option>
            ))}
          </select>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-neutral-500">
              Hora de inicio
              <input
                name="start_time"
                type="time"
                required
                className="rounded-xl border border-black/10 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-[var(--brand-accent)]"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-neutral-500">
              Hora de fin
              <input
                name="end_time"
                type="time"
                required
                className="rounded-xl border border-black/10 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-[var(--brand-accent)]"
              />
            </label>
          </div>
          <div>
            <Button type="submit">Agregar horario</Button>
          </div>
        </form>
      </Card>

      {error && <p className="text-sm font-medium text-rose-600">Error: {error.message}</p>}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-black/[0.06] text-left text-xs font-semibold text-neutral-500">
            <tr>
              <th className="px-5 py-3">Día</th>
              <th className="px-5 py-3">Desde</th>
              <th className="px-5 py-3">Hasta</th>
            </tr>
          </thead>
          <tbody>
            {hours.map((h) => (
              <tr key={h.id} className="border-b border-black/[0.04] last:border-0">
                <td className="px-5 py-3 font-medium text-neutral-800">{DAY_NAMES[h.day_of_week]}</td>
                <td className="px-5 py-3 text-neutral-600">{formatTime(h.start_time)}</td>
                <td className="px-5 py-3 text-neutral-600">{formatTime(h.end_time)}</td>
              </tr>
            ))}
            {hours.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-6 text-center text-neutral-400">
                  Sin horarios cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </section>
  );
}
