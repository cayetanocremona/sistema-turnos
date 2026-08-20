import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyBusinesses } from "../data";
import { addBusiness } from "../actions";
import BusinessForm from "../BusinessForm";

export default async function BusinessesPage() {
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const { data: businesses, error } = await getMyBusinesses(supabaseServer, user!.id);
  const businessList = businesses ?? [];

  return (
    <section>
      <h1>Negocios</h1>
      <p style={{ color: "#666" }}>
        Cada negocio tiene su propia URL pública (<code>/slug</code>) donde los clientes pueden
        ver información y reservar turnos.
      </p>

      <BusinessForm action={addBusiness} />

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      <ul>
        {businessList.map((b) => (
          <li key={b.id}>
            {b.name} — <Link href={`/${b.slug}`}>/{b.slug}</Link>
          </li>
        ))}
        {businessList.length === 0 && <li>Todavía no tenés negocios cargados.</li>}
      </ul>
    </section>
  );
}
