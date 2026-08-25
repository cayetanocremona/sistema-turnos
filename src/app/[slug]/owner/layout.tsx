import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOwnedTenant } from "./data";
import { getContrastTextColor } from "@/lib/branding";
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
    // El panel usa el brand_color real de este negocio, igual que el
    // storefront público -- reemplaza al acento fijo (#2563eb) que tenía
    // antes (ver AGENTS.md "Estilo genérico del panel" para el criterio
    // viejo). Como el layout resuelve `business` a partir del slug de la URL
    // actual, cada panel siempre refleja el negocio que corresponde a esa
    // URL, sin importar cuántos negocios tenga el dueño logueado.
    <div
      className="flex min-h-screen flex-col bg-neutral-50 md:flex-row"
      style={
        {
          "--brand-accent": business.brand_color,
          "--brand-accent-contrast": getContrastTextColor(business.brand_color),
        } as React.CSSProperties
      }
    >
      <OwnerNav slug={slug} businessName={business.name} email={user.email ?? ""} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 md:py-10">
        {children}
      </main>
    </div>
  );
}
