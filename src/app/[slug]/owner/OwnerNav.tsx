"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/authActions";

export default function OwnerNav({
  slug,
  businessName,
  email,
}: {
  slug: string;
  businessName: string;
  email: string;
}) {
  const pathname = usePathname();
  const base = `/${slug}/owner`;

  const links = [
    { href: base, label: "Resumen" },
    { href: `${base}/resources`, label: "Recursos" },
    { href: `${base}/services`, label: "Servicios" },
    { href: `${base}/hours`, label: "Horarios" },
    { href: `${base}/blocked-slots`, label: "Bloqueos" },
    { href: `${base}/appointments`, label: "Turnos" },
  ];

  return (
    <aside className="flex w-full flex-col border-b border-black/[0.06] bg-white md:w-56 md:shrink-0 md:border-b-0 md:border-r">
      <div className="flex flex-col gap-1 px-5 py-5">
        <span className="truncate text-sm font-extrabold text-neutral-900">{businessName}</span>
        <Link href={`/${slug}`} className="text-xs font-medium text-neutral-500 hover:text-neutral-800">
          Ver sitio público →
        </Link>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:px-3 md:pb-0">
        {links.map((link) => {
          const isActive = link.href === base ? pathname === base : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold transition-colors md:rounded-lg ${
                isActive
                  ? "bg-[var(--brand-accent)] text-[var(--brand-accent-contrast)]"
                  : "text-neutral-600 hover:bg-black/[0.05]"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2 border-t border-black/[0.06] px-5 py-4">
        <Link href="/admin" className="text-xs font-semibold text-neutral-500 hover:text-neutral-800">
          Cambiar de negocio
        </Link>
        <span className="truncate text-xs text-neutral-400">{email}</span>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-black/[0.03]"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
