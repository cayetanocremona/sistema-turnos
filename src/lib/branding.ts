export type BrandStylePreset = "clasico" | "elegante" | "deportivo" | "minimal";

/**
 * Iniciales para el badge/monograma cuando el negocio no cargó `logo_url`.
 * Toma la primera letra de las primeras dos palabras del nombre ("La
 * Bombonerita F5" -> "LB"); con una sola palabra, sus primeras dos letras.
 */
export function getBusinessInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Negro o blanco según la luminancia relativa de `hexColor` (fórmula WCAG),
 * para que el texto sobre un fondo en `brand_color` sea siempre legible sin
 * importar qué color haya elegido el negocio.
 */
export function getContrastTextColor(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  return luminance > 0.4 ? "#111827" : "#ffffff";
}
