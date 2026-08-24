import type { HTMLAttributes } from "react";

/**
 * Card base del sistema visual: esquinas redondeadas grandes (24-28px),
 * fondo blanco, borde sutil. Único componente de "superficie" del sistema --
 * lo reusan storefront (default), home y panel del dueño.
 */
export default function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-[26px] border border-black/[0.06] bg-white ${className}`}
      {...props}
    />
  );
}
