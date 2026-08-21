import { Cormorant_Garamond, Manrope, Archivo_Black, Barlow } from "next/font/google";

// Tipografías de los presets "elegante" y "deportivo" (ver src/app/[slug]/theme.ts).
// "clasico" y "minimal" usan system-ui, sin fuente de Google -- no hace falta
// declararlas acá.

export const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
});

export const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
