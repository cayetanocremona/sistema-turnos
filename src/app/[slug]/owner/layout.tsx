import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOwnedTenant } from "./data";
import OwnerNav from "./OwnerNav";

export default async function OwnerLayout({
  children,
  params,
}: LayoutProps<"/[slug]/owner">) {
  const { slug } = await params;
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  // Todo lo que cuelga de /[slug]/owner es gestión del dueño de ese negocio
  // puntual: sin sesión no hay nada que mostrar (la reserva pública vive en
  // /[slug], no acá).
  if (!user) {
    redirect("/login");
  }

  // Mejora de UX sobre lo que ya garantiza RLS a nivel de fila: si el slug no
  // es de un negocio de este dueño, lo mandamos a una página propia en vez
  // de dejar que cada sección se renderice vacía en silencio.
  const business = await getOwnedTenant(supabaseServer, slug, user.id);
  if (!business) {
    redirect("/403");
  }

  return (
    // El panel no toma brand_color del negocio -- ver AGENTS.md "Estilo
    // genérico del panel": un mismo dueño administra negocios con presets
    // distintos desde el mismo panel, así que el acento queda fijo acá
    // (--brand-accent) en vez de heredar el color de marca de este negocio.
    <div
      className="flex min-h-screen flex-col bg-neutral-50 md:flex-row"
      style={{ "--brand-accent": "#2563eb", "--brand-accent-contrast": "#ffffff" } as React.CSSProperties}
    >
      <OwnerNav slug={slug} businessName={business.name} email={user.email ?? ""} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 md:py-10">
        {children}
      </main>
    </div>
  );
}
