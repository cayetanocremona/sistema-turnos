import { SALES_WHATSAPP_URL } from "@/lib/constants";

/**
 * CTA de venta del sistema en sí (Reservy), no del negocio dueño de la página
 * /[slug] que se está mirando. Compartido por BrandedStorefront y
 * DefaultStorefront -- deliberadamente neutro (no usa --brand-accent ni los
 * tokens de `theme`) para no mezclarse con la identidad visual del negocio,
 * mismo criterio que "Powered by Reservy". Ver AGENTS.md "CTA de venta en el
 * storefront".
 */
export function SellCtaBar() {
  return (
    <div className="w-full border-b border-black/[0.06] bg-white">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
        <span className="text-xs font-medium text-neutral-500 sm:text-sm">
          ¿Tenés un negocio? Conseguí tu propio sistema de turnos.
        </span>
        <a
          href={SALES_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-full bg-neutral-900 px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 sm:text-sm"
        >
          Software para tu negocio
        </a>
      </div>
    </div>
  );
}

export function SellFooterContact() {
  return (
    <a
      href={SALES_WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-neutral-500 underline-offset-2 transition-opacity hover:opacity-80 hover:underline"
    >
      ¿Querés este sistema para tu negocio? Escribinos por WhatsApp
    </a>
  );
}
