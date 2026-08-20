import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyBusinesses } from "./data";

export default async function AdminDashboard() {
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const { data: businesses } = await getMyBusinesses(supabaseServer, user!.id);
  const businessList = businesses ?? [];

  return (
    <div>
      <h1>Resumen</h1>

      {businessList.length === 0 ? (
        <p>
          Todavía no tenés negocios propios. Creá el primero en{" "}
          <Link href="/admin/businesses">Negocios</Link>.
        </p>
      ) : (
        <>
          <p style={{ color: "#666" }}>Tus negocios:</p>
          <ul>
            {businessList.map((b) => (
              <li key={b.id}>
                {b.name} — <Link href={`/${b.slug}`}>/{b.slug}</Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <p style={{ color: "#666", marginTop: 24 }}>
        Usá la barra de arriba para gestionar recursos, servicios, horarios, bloqueos y turnos.
      </p>
    </div>
  );
}
