import { SALES_WHATSAPP_URL } from "@/lib/constants";

/**
 * CTA de venta del sistema en sí (Reservy), no del negocio dueño de la página
 * /[slug] que se está mirando. Compartido por BrandedStorefront y
 * DefaultStorefront. Ver AGENTS.md "CTA de venta en el storefront".
 *
 * `accent` es el brand_color del negocio y `accentText` el color de texto
 * legible encima (negro/blanco, calculado con getContrastTextColor). La barra
 * pinta su fondo con `accent` para que sea la primera cosa que ve un dueño de
 * negocio al mirar la página de reserva de otro; el botón se invierte
 * (fondo = accentText, texto = accent) -- así queda como una píldora blanca
 * con texto de color en los casos habituales (brand_color oscuro/saturado), y
 * si un negocio elige un brand_color muy claro degrada a una píldora oscura
 * legible en vez de blanco-sobre-blanco. Ese par (accent / accentText) siempre
 * tiene contraste WCAG suficiente entre sí, es la garantía de
 * getContrastTextColor.
 */
export function SellCtaBar({ accent, accentText }: { accent: string; accentText: string }) {
  return (
    <div
      className="w-full border-b"
      style={{ background: accent, borderBottomColor: `${accentText}1f` }}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
        <span className="text-sm font-medium sm:text-base" style={{ color: accentText }}>
          ¿Tenés un negocio? Conseguí tu propio sistema de turnos.
        </span>
        <a
          href={SALES_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-full px-6 py-2.5 text-sm font-bold transition-opacity hover:opacity-90 sm:text-base"
          style={{ background: accentText, color: accent }}
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
      className="text-sm font-semibold text-neutral-500 underline-offset-2 transition-opacity hover:opacity-80 hover:underline"
    >
      ¿Querés este sistema para tu negocio? Escribinos por WhatsApp
    </a>
  );
}
