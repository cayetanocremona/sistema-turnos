// Nombre de marca de la plataforma (no confundir con el nombre de un negocio
// individual, `businesses.name` -- ver AGENTS.md "Reservy"). Centralizado acá
// para no hardcodearlo en cada página global (home, /login, /admin, etc.).
export const APP_NAME = "Reservy";
export const APP_TAGLINE = "Sistema de gestión de turnos";

// WhatsApp de contacto para vender el sistema en sí (no del negocio que usa
// /[slug]) -- CTA visible en el storefront público, ver components/SellCta.tsx.
// Formato wa.me para Argentina: 54 + 9 + número sin el 0 ni el 15.
const SALES_WHATSAPP_NUMBER = "5493364260428";
const SALES_WHATSAPP_MESSAGE =
  "Hola, vi tu sistema de turnos y me interesa tener uno para mi negocio.";
export const SALES_WHATSAPP_URL = `https://wa.me/${SALES_WHATSAPP_NUMBER}?text=${encodeURIComponent(
  SALES_WHATSAPP_MESSAGE
)}`;
