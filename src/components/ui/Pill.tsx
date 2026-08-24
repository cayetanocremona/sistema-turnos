import type { HTMLAttributes } from "react";

type PillVariant = "accent" | "accent-soft" | "neutral" | "success" | "danger";

const VARIANT_CLASSES: Record<PillVariant, string> = {
  accent: "bg-[var(--brand-accent)] text-[var(--brand-accent-contrast)]",
  "accent-soft": "bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]",
  neutral: "bg-black/[0.05] text-neutral-700",
  success: "bg-emerald-100 text-emerald-700",
  danger: "bg-rose-100 text-rose-700",
};

/** Badge/tag en formato píldora (radio completo) -- servicios, estados, filtros. */
export default function Pill({
  variant = "neutral",
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: PillVariant }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
