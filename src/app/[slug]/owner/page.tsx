import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOwnedTenant } from "./data";
import Card from "@/components/ui/Card";

export default async function OwnerDashboard({ params }: PageProps<"/[slug]/owner">) {
  const { slug } = await params;
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const business = await getOwnedTenant(supabaseServer, slug, user!.id);
  if (!business) return null; // el layout ya redirige antes de llegar acá

  const [{ count: resourceCount }, { count: serviceCount }, { count: appointmentCount }] =
    await Promise.all([
      supabaseServer
        .from("resources")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id),
      supabaseServer
        .from("services")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id),
      supabaseServer
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id)
        .eq("status", "confirmed"),
    ]);

  const stats = [
    { label: "Recursos", value: resourceCount ?? 0, href: `/${slug}/owner/resources` },
    { label: "Servicios", value: serviceCount ?? 0, href: `/${slug}/owner/services` },
    { label: "Turnos confirmados", value: appointmentCount ?? 0, href: `/${slug}/owner/appointments` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900">{business.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Página pública:{" "}
          <Link href={`/${slug}`} className="font-semibold text-[var(--brand-accent)]">
            /{slug}
          </Link>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="p-5 transition-shadow hover:shadow-md">
              <div className="text-3xl font-extrabold text-neutral-900">{stat.value}</div>
              <div className="mt-1 text-sm font-medium text-neutral-500">{stat.label}</div>
            </Card>
          </Link>
        ))}
      </div>

      <p className="text-sm text-neutral-500">
        Usá el menú para gestionar recursos, servicios, horarios, bloqueos y turnos de este negocio.
      </p>
    </div>
  );
}
