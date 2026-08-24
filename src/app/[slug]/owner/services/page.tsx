import { createClient } from "@/lib/supabase/server";
import { getOwnedTenant } from "../data";
import { addService } from "../actions";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function formatPrice(p: number | string) {
  // Postgres numeric puede llegar como string vía PostgREST (evita perder precisión en JS).
  return Number(p).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

export default async function ServicesPage({ params }: PageProps<"/[slug]/owner/services">) {
  const { slug } = await params;
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const business = await getOwnedTenant(supabaseServer, slug, user!.id);
  if (!business) return null;

  const { data: services, error } = await supabaseServer
    .from("services")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  const serviceList = services ?? [];

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900">Servicios</h1>
        <p className="mt-1 text-sm text-neutral-500">Catálogo del negocio: nombre, duración y precio.</p>
      </div>

      <Card className="p-5">
        <form action={addService} className="flex flex-col gap-3">
          <input type="hidden" name="business_id" value={business.id} />
          <input
            name="name"
            placeholder="Nombre del servicio (ej: Corte de pelo, Consulta)"
            required
            className="rounded-xl border border-black/10 px-3.5 py-2.5 text-sm outline-none focus:border-[var(--brand-accent)]"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-neutral-500">
              Duración (minutos)
              <input
                name="duration_minutes"
                type="number"
                min={1}
                step={1}
                required
                className="rounded-xl border border-black/10 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-[var(--brand-accent)]"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-neutral-500">
              Precio (ARS)
              <input
                name="price"
                type="number"
                min={0}
                step="0.01"
                required
                className="rounded-xl border border-black/10 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-[var(--brand-accent)]"
              />
            </label>
          </div>
          <div>
            <Button type="submit">Crear servicio</Button>
          </div>
        </form>
      </Card>

      {error && <p className="text-sm font-medium text-rose-600">Error: {error.message}</p>}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-black/[0.06] text-left text-xs font-semibold text-neutral-500">
            <tr>
              <th className="px-5 py-3">Nombre</th>
              <th className="px-5 py-3">Duración</th>
              <th className="px-5 py-3">Precio</th>
            </tr>
          </thead>
          <tbody>
            {serviceList.map((s) => (
              <tr key={s.id} className="border-b border-black/[0.04] last:border-0">
                <td className="px-5 py-3 font-medium text-neutral-800">{s.name}</td>
                <td className="px-5 py-3 text-neutral-600">{s.duration_minutes} min</td>
                <td className="px-5 py-3 text-neutral-600">{formatPrice(s.price)}</td>
              </tr>
            ))}
            {serviceList.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-6 text-center text-neutral-400">
                  Sin servicios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </section>
  );
}
