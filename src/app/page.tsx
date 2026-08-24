import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { buttonClassName } from "@/components/ui/Button";

const STEPS = [
  {
    title: "Tu negocio, tu link",
    body: "Cada negocio tiene su propia página pública para que sus clientes reserven online, sin descargar nada ni crear una cuenta.",
  },
  {
    title: "Vos controlás todo",
    body: "Desde tu panel administrás recursos, horarios de atención, servicios y turnos — cancelalos o reagendalos cuando haga falta.",
  },
  {
    title: "Cero fricción para el cliente",
    body: "El cliente elige servicio y horario disponible, deja su nombre y teléfono, y listo: el turno queda confirmado al instante.",
  },
];

export default async function Home({ searchParams }: PageProps<"/">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  // Búsqueda puntual por lo que el usuario tipeó -- nunca se lista el
  // catálogo completo de negocios acá (eso exponía datos de prueba, ver
  // AGENTS.md "Sistema visual").
  const results =
    query.length > 0
      ? (
          await supabaseServer
            .from("businesses")
            .select("name, slug")
            .ilike("name", `%${query}%`)
            .limit(5)
        ).data ?? []
      : [];

  const primaryCta = user
    ? { href: "/admin", label: "Ir a mis negocios" }
    : { href: "/login", label: "Iniciar sesión como dueño de negocio" };

  return (
    <div className="flex min-h-screen w-full flex-col bg-white text-neutral-900">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-6 sm:px-6">
        <span className="text-base font-extrabold">Sistema de Turnos</span>
        <Link href={user ? "/admin" : "/login"} className="text-sm font-semibold text-neutral-600 hover:text-neutral-900">
          {user ? "Mis negocios" : "Iniciar sesión"}
        </Link>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 sm:py-24">
        <h1 className="text-4xl font-extrabold leading-tight sm:text-6xl">
          Gestioná los turnos de tu negocio, sin vueltas.
        </h1>
        <p className="max-w-xl text-lg text-neutral-500">
          Un panel para administrar tu negocio y una página pública para que tus clientes
          reserven online — canchas, clínicas, salones, consultorios: sirve para cualquier
          rubro que trabaje con turnos.
        </p>

        <form action="/" className="flex w-full max-w-md gap-2">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Buscá tu negocio por nombre"
            className="flex-1 rounded-full border border-black/10 px-5 py-3 text-sm outline-none focus:border-neutral-900"
          />
          <button
            type="submit"
            className="rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            Buscar
          </button>
        </form>

        {query.length > 0 && (
          <div className="flex w-full max-w-md flex-col gap-2 text-left">
            {results.length === 0 ? (
              <p className="text-sm text-neutral-400">No encontramos ningún negocio con ese nombre.</p>
            ) : (
              results.map((b) => (
                <Link key={b.slug} href={`/${b.slug}`}>
                  <Card className="px-4 py-3 text-sm font-semibold text-neutral-800 hover:shadow-sm">
                    {b.name}
                  </Card>
                </Link>
              ))
            )}
          </div>
        )}

        <Link href={primaryCta.href} className={buttonClassName("solid", "md", "mt-2 px-7 py-3.5 text-base")}>
          {primaryCta.label}
        </Link>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-20 sm:px-6">
        <h2 className="mb-6 text-xl font-extrabold">Cómo funciona</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STEPS.map((step) => (
            <Card key={step.title} className="p-5">
              <h3 className="mb-2 text-base font-bold text-neutral-900">{step.title}</h3>
              <p className="text-sm leading-relaxed text-neutral-500">{step.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <footer className="w-full border-t border-black/[0.06]">
        <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-neutral-400 sm:px-6">
          Sistema de Gestión de Turnos — hecho para negocios de cualquier rubro.
        </div>
      </footer>
    </div>
  );
}
