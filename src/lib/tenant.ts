import type { SupabaseClient } from "@supabase/supabase-js";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  owner_id: string | null;
  timezone: string;
  slot_interval_minutes: number;
  booking_window_days: number;
  brand_color: string;
  brand_style_preset: "clasico" | "elegante" | "deportivo" | "minimal";
  logo_url: string | null;
  hero_image_url: string | null;
  created_at: string;
};

/**
 * Punto único de resolución de negocio por slug -- lo usan tanto /[slug]
 * (público, con el cliente anónimo) como /[slug]/owner (con el cliente de
 * servidor autenticado), pasando cada uno su propio cliente de Supabase. La
 * lectura de `businesses` es pública (RLS), así que ambos clientes ven la
 * misma fila -- solo cambia si el resto de las queries de esa página después
 * necesitan sesión o no.
 */
export async function resolveTenant(
  supabaseClient: SupabaseClient,
  slug: string
): Promise<Tenant | null> {
  const { data } = await supabaseClient
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  return (data as Tenant | null) ?? null;
}
