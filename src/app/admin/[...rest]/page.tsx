import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Accesos viejos a /admin/<algo> (favoritos guardados de antes del refactor
 * a /[slug]/owner). Sin sesión, a login. Con sesión y un único negocio,
 * reconstruye el destino equivalente bajo /{slug}/owner. Con 0 o 2+ negocios
 * (o si el link viejo era /admin/businesses, que ya no existe como subruta)
 * no hay forma de adivinar a cuál negocio se refería, así que cae al
 * selector de /admin.
 */
export default async function LegacyAdminRedirect({
  params,
}: PageProps<"/admin/[...rest]">) {
  const { rest } = await params;

  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (rest[0] === "businesses") {
    redirect("/admin");
  }

  const { data: businesses } = await supabaseServer
    .from("businesses")
    .select("slug")
    .eq("owner_id", user.id);

  if (businesses && businesses.length === 1) {
    redirect(`/${businesses[0].slug}/owner/${rest.join("/")}`);
  }

  redirect("/admin");
}
