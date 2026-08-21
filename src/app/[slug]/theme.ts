import { BrandStylePreset, getContrastTextColor } from "@/lib/branding";
import { cormorantGaramond, manrope, archivoBlack, barlow } from "./fonts";

/**
 * Tokens de theming para /[slug]. Solo `accent` (= brand_color del negocio)
 * varía libremente; todo lo demás lo fija el preset -- ver el requisito en
 * AGENTS.md: "brand_color es el único color libre que elige el negocio; el
 * preset define todo lo demás".
 *
 * "clasico" no genera tokens acá: la página lo renderiza con el markup
 * original de v0-v3, sin pasar por este theming, para garantizar que un
 * negocio existente (sin preset explícito) se siga viendo exactamente igual.
 */
export type StorefrontTheme = {
  preset: Exclude<BrandStylePreset, "clasico">;
  fontDisplay: string;
  fontBody: string;
  pageBg: string;
  pageText: string;
  mutedText: string;
  cardBg: string;
  cardBorder: string;
  accent: string;
  accentText: string;
  heroBg: string;
  heroMonogramColor: string;
  bannerLayout: boolean;
};

export function getStorefrontTheme(
  preset: Exclude<BrandStylePreset, "clasico">,
  brandColor: string
): StorefrontTheme {
  const accentText = getContrastTextColor(brandColor);

  if (preset === "elegante") {
    return {
      preset,
      fontDisplay: cormorantGaramond.style.fontFamily,
      fontBody: manrope.style.fontFamily,
      pageBg: "oklch(16% 0.016 70)",
      pageText: "oklch(95% 0.01 70)",
      mutedText: "oklch(65% 0.01 70)",
      cardBg: "oklch(21% 0.018 70)",
      cardBorder: "oklch(30% 0.02 70)",
      accent: brandColor,
      accentText,
      heroBg: "linear-gradient(155deg, oklch(26% 0.03 70) 0%, oklch(14% 0.02 70) 65%)",
      heroMonogramColor: "oklch(30% 0.03 70)",
      bannerLayout: false,
    };
  }

  if (preset === "deportivo") {
    return {
      preset,
      fontDisplay: archivoBlack.style.fontFamily,
      fontBody: barlow.style.fontFamily,
      pageBg: "oklch(99% 0.003 145)",
      pageText: "oklch(18% 0.01 145)",
      mutedText: "oklch(45% 0.01 145)",
      cardBg: "#ffffff",
      cardBorder: "oklch(90% 0.01 145)",
      accent: brandColor,
      accentText,
      heroBg: `linear-gradient(150deg, ${brandColor} 0%, oklch(38% 0.14 145) 100%)`,
      heroMonogramColor: accentText,
      bannerLayout: true,
    };
  }

  // minimal: sin mockup todavía -- versión liviana en blanco y negro, misma
  // tipografía que "clasico" (system-ui), no le dedicamos más tiempo que eso.
  return {
    preset,
    fontDisplay: "system-ui, sans-serif",
    fontBody: "system-ui, sans-serif",
    pageBg: "#ffffff",
    pageText: "#111111",
    mutedText: "#666666",
    cardBg: "#fafafa",
    cardBorder: "#e5e5e5",
    accent: brandColor,
    accentText,
    heroBg: "#f0f0f0",
    heroMonogramColor: "#cccccc",
    bannerLayout: false,
  };
}
