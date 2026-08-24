import type { ReactNode } from "react";
import Card from "./Card";

/**
 * Card lateral fija (sticky) mientras se scrollea el catálogo de servicios --
 * mismo lugar donde el cliente reserva, siempre a la vista. `top-24` deja
 * lugar para el header del storefront antes de pegarse arriba.
 */
export default function StickyBookingCard({ children }: { children: ReactNode }) {
  return (
    <Card className="sticky top-24 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">{children}</Card>
  );
}
