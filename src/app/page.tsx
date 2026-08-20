import { supabase } from "@/lib/supabaseClient";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { revalidatePath } from "next/cache";

async function signOut() {
  "use server";

  const supabaseServer = await createClient();
  await supabaseServer.auth.signOut();
  revalidatePath("/", "layout");
}

export default async function Home() {
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const { data: businesses, error: businessesError } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false });

  const businessList = businesses ?? [];

  return (
    <main
      style={{
        maxWidth: 640,
        margin: "40px auto",
        fontFamily: "system-ui, sans-serif",
        padding: "0 16px",
      }}
    >
      <h1>Sistema de Gestión de Turnos</h1>
      <p style={{ color: "#666" }}>
        Reservá un turno entrando al negocio que buscás, o accedé al panel si sos dueño de un
        negocio.
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
        {user ? (
          <>
            <span>Sesión iniciada como {user.email}</span>
            <Link href="/admin">Ir al panel</Link>
            <form action={signOut}>
              <button type="submit" style={{ padding: "4px 8px", cursor: "pointer" }}>
                Cerrar sesión
              </button>
            </form>
          </>
        ) : (
          <Link href="/login">Iniciar sesión como dueño de negocio</Link>
        )}
      </div>

      <section>
        <h2>Negocios</h2>

        {businessesError && <p style={{ color: "red" }}>Error: {businessesError.message}</p>}

        <ul>
          {businessList.map((b) => (
            <li key={b.id}>
              {b.name} — <Link href={`/${b.slug}`}>/{b.slug}</Link>
            </li>
          ))}
          {businessList.length === 0 && <li>Todavía no hay negocios cargados.</li>}
        </ul>
      </section>
    </main>
  );
}
