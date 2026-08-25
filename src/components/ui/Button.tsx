import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "solid" | "outline" | "ghost";
type ButtonSize = "md" | "sm";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  solid: "bg-[var(--brand-accent)] text-[var(--brand-accent-contrast)] hover:opacity-90",
  outline: "border border-black/15 text-neutral-900 hover:bg-black/[0.03]",
  ghost: "text-neutral-600 hover:bg-black/[0.05]",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: "px-5 py-2.5 text-sm",
  sm: "px-3.5 py-1.5 text-xs",
};

/** Genera las clases del botón sin renderizar un <button> -- para usarlo sobre <Link>. */
export function buttonClassName(variant: ButtonVariant = "solid", size: ButtonSize = "md", className = "") {
  return `${BASE} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`;
}

export default function Button({
  variant = "solid",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={buttonClassName(variant, size, className)} {...props} />;
}
