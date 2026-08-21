import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { revalidatePath } from "next/cache";

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

  const primaryCta = user
    ? { href: "/admin", label: "Ir al panel" }
    : { href: "/login", label: "Iniciar sesión como dueño de negocio" };

  return (
    <div style={{ width: "100%", fontFamily: "system-ui, sans-serif" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          maxWidth: 1040,
          margin: "0 auto",
          padding: "20px clamp(20px, 4vw, 56px)",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 17 }}>Sistema de Turnos</span>
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14 }}>
            <span style={{ color: "#666" }}>{user.email}</span>
            <Link href="/admin">Panel</Link>
            <form action={signOut}>
              <button
                type="submit"
                style={{
                  padding: "6px 10px",
                  cursor: "pointer",
                  border: "1px solid #ddd",
                  borderRadius: 6,
                  background: "#fff",
                  fontSize: 14,
                }}
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        ) : (
          <Link href="/login" style={{ fontSize: 14, fontWeight: 600 }}>
            Iniciar sesión
          </Link>
        )}
      </header>

      <section style={{ width: "100%", background: "#111827", color: "#fff" }}>
        <div
          style={{
            maxWidth: 1040,
            margin: "0 auto",
            padding: "72px clamp(20px, 4vw, 56px) 88px",
          }}
        >
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", lineHeight: 1.15, maxWidth: 680 }}>
            Gestioná los turnos de tu negocio, sin vueltas.
          </h1>
          <p style={{ fontSize: 18, color: "#b8bfcc", maxWidth: 560, marginTop: 18 }}>
            Un panel para administrar tu negocio y una página pública para que tus clientes
            reserven online — canchas, clínicas, salones, consultorios: sirve para cualquier
            rubro que trabaje con turnos.
          </p>
          <Link
            href={primaryCta.href}
            style={{
              display: "inline-block",
              marginTop: 32,
              padding: "13px 22px",
              borderRadius: 10,
              background: "#fff",
              color: "#111827",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            {primaryCta.label}
          </Link>
        </div>
      </section>

      <section style={{ maxWidth: 1040, margin: "0 auto", padding: "56px clamp(20px, 4vw, 56px)" }}>
        <h2 style={{ fontSize: 22, marginBottom: 28 }}>Cómo funciona</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 24,
          }}
        >
          {STEPS.map((step) => (
            <div
              key={step.title}
              style={{
                padding: 20,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                background: "#fafafa",
              }}
            >
              <h3 style={{ fontSize: 16, marginBottom: 8 }}>{step.title}</h3>
              <p style={{ fontSize: 14, color: "#666", lineHeight: 1.5 }}>{step.body}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 14, color: "#888", marginTop: 32 }}>
          ¿Ya tenés turno en un negocio que usa este sistema? Pedile a ese negocio el link
          directo a su página de reservas.
        </p>
      </section>

      <footer style={{ width: "100%", borderTop: "1px solid #e5e7eb" }}>
        <div
          style={{
            maxWidth: 1040,
            margin: "0 auto",
            padding: "20px clamp(20px, 4vw, 56px)",
            fontSize: 13,
            color: "#999",
          }}
        >
          Sistema de Gestión de Turnos — hecho para negocios de cualquier rubro.
        </div>
      </footer>
    </div>
  );
}
