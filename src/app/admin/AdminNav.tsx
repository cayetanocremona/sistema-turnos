import Link from "next/link";
import { signOut } from "./actions";

const LINKS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/businesses", label: "Negocios" },
  { href: "/admin/resources", label: "Recursos" },
  { href: "/admin/services", label: "Servicios" },
  { href: "/admin/hours", label: "Horarios" },
  { href: "/admin/blocked-slots", label: "Bloqueos" },
  { href: "/admin/appointments", label: "Turnos" },
];

export default function AdminNav({ email }: { email: string }) {
  return (
    <header style={{ borderBottom: "1px solid #ddd", marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 0",
        }}
      >
        <strong>Panel de administración</strong>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14 }}>
          <span style={{ color: "#666" }}>{email}</span>
          <form action={signOut}>
            <button type="submit" style={{ padding: "4px 8px", cursor: "pointer" }}>
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
      <nav style={{ display: "flex", gap: 16, flexWrap: "wrap", paddingBottom: 12 }}>
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} style={{ fontSize: 14 }}>
            {link.label}
          </Link>
        ))}
        <Link href="/" style={{ fontSize: 14, color: "#666" }}>
          Ver sitio público
        </Link>
      </nav>
    </header>
  );
}
