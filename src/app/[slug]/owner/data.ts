import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveTenant, type Tenant } from "@/lib/tenant";

/**
 * Negocio resuelto por slug y verificado contra el dueño logueado -- lo usa
 * cada página de /[slug]/owner para saber su business_id real. RLS ya
 * impide leer/escribir datos de otro negocio a nivel de fila; este chequeo
 * es la mejora de UX pedida (ver AGENTS.md "Refactor de rutas"): si el slug
 * no es de este dueño, ninguna página llega a renderizarse vacía por RLS --
 * el layout ya redirige antes.
 */
export async function getOwnedTenant(
  supabaseServer: SupabaseClient,
  slug: string,
  userId: string
): Promise<Tenant | null> {
  const business = await resolveTenant(supabaseServer, slug);
  if (!business || business.owner_id !== userId) return null;
  return business;
}
