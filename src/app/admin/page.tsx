import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addBusiness } from "./actions";
import BusinessForm from "./BusinessForm";
import Card from "@/components/ui/Card";

/**
 * Punto de entrada "cross-negocio" para el dueño: crear un negocio nuevo, o
 * elegir a cuál de los suyos entrar. La gestión de un negocio puntual vive en
 * /[slug]/owner (ver AGENTS.md "Refactor de rutas") -- acá solo se resuelve
 * "a cuál entro" antes de llegar ahí. Con un solo negocio no auto-redirige:
 * si redirigiera directo a /{slug}/owner, un dueño con un solo negocio nunca
 * podría volver acá para cargar un segundo.
 */
export default async function AdminSwitcher() {
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: businesses, error } = await supabaseServer
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const businessList = businesses ?? [];

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-14 sm:px-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900">Tus negocios</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Elegí un negocio para administrarlo, o cargá uno nuevo.
        </p>
      </div>

      {error && <p className="text-sm font-medium text-rose-600">Error: {error.message}</p>}

      {businessList.length > 0 && (
        <div className="flex flex-col gap-3">
          {businessList.map((b) => (
            <Link key={b.id} href={`/${b.slug}/owner`}>
              <Card className="flex items-center justify-between p-5 transition-shadow hover:shadow-md">
                <div>
                  <div className="font-semibold text-neutral-900">{b.name}</div>
                  <div className="text-xs text-neutral-500">/{b.slug}</div>
                </div>
                <span className="text-sm font-semibold text-[var(--brand-accent)]">Administrar →</span>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-bold text-neutral-900">Crear un negocio nuevo</h2>
        <BusinessForm action={addBusiness} />
      </Card>
    </div>
  );
}
