import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "./AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  // Todo lo que cuelga de /admin es gestión del dueño de negocio: sin sesión no hay
  // nada que mostrar acá (la reserva pública vive en /[slug], no en este panel).
  if (!user) {
    redirect("/login");
  }

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
        padding: "0 16px 40px",
      }}
    >
      <AdminNav email={user.email ?? ""} />
      {children}
    </main>
  );
}
