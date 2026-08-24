import { createClient } from "@/lib/supabase/server";
import { getOwnedTenant } from "../data";
import { addResource } from "../actions";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default async function ResourcesPage({ params }: PageProps<"/[slug]/owner/resources">) {
  const { slug } = await params;
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const business = await getOwnedTenant(supabaseServer, slug, user!.id);
  if (!business) return null;

  const { data: resources, error } = await supabaseServer
    .from("resources")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  const resourceList = resources ?? [];

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900">Recursos</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Lo que efectivamente se reserva: cancha, sillón, box, profesional.
        </p>
      </div>

      <Card className="p-5">
        <form action={addResource} className="flex flex-col gap-3 sm:flex-row">
          <input type="hidden" name="business_id" value={business.id} />
          <input
            name="name"
            placeholder="Nombre del recurso (ej: Cancha 1, Dr. Pérez)"
            required
            className="flex-1 rounded-xl border border-black/10 px-3.5 py-2.5 text-sm outline-none focus:border-[var(--brand-accent)]"
          />
          <Button type="submit">Crear recurso</Button>
        </form>
      </Card>

      {error && <p className="text-sm font-medium text-rose-600">Error: {error.message}</p>}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-black/[0.06] text-left text-xs font-semibold text-neutral-500">
            <tr>
              <th className="px-5 py-3">Nombre</th>
            </tr>
          </thead>
          <tbody>
            {resourceList.map((r) => (
              <tr key={r.id} className="border-b border-black/[0.04] last:border-0">
                <td className="px-5 py-3 font-medium text-neutral-800">{r.name}</td>
              </tr>
            ))}
            {resourceList.length === 0 && (
              <tr>
                <td className="px-5 py-6 text-center text-neutral-400">Sin recursos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </section>
  );
}
