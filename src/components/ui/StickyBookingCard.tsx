"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Card from "./Card";

const STICKY_TOP_PX = 96; // debe matchear top-24 de abajo

/**
 * Card lateral fija (sticky) mientras se scrollea el catálogo de servicios --
 * mismo lugar donde el cliente reserva, siempre a la vista. `top-24` deja
 * lugar para el header del storefront antes de pegarse arriba.
 *
 * La sombra se intensifica apenas queda "pegada" arriba: no hay pseudo-clase
 * CSS estable para detectar eso en `position: sticky` todavía, así que se
 * observa un sentinel de 1px inmediatamente antes de la card con
 * IntersectionObserver -- cuando ese sentinel sale de vista (con el mismo
 * offset que `top-24`), la card ya está stuck.
 */
export default function StickyBookingCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry.isIntersecting),
      { rootMargin: `-${STICKY_TOP_PX + 1}px 0px 0px 0px`, threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} className="h-px" />
      <Card
        className={`sticky top-24 p-6 ${
          isStuck ? "shadow-[0_16px_40px_rgba(0,0,0,0.14)]" : "shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
        } ${className}`}
      >
        {children}
      </Card>
    </>
  );
}
