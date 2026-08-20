import type { SupabaseClient } from "@supabase/supabase-js";

// Alcance de todas las páginas de /admin: "mis negocios" (owner_id = usuario logueado).
// RLS ya lo garantiza en el server, pero filtramos también acá para no traer de más.
export async function getMyBusinesses(supabaseServer: SupabaseClient, userId: string) {
  return supabaseServer
    .from("businesses")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
}

export async function getMyResources(supabaseServer: SupabaseClient, businessIds: string[]) {
  if (businessIds.length === 0) return { data: [] as never[], error: null };
  return supabaseServer
    .from("resources")
    .select("*")
    .in("business_id", businessIds)
    .order("created_at", { ascending: false });
}

export async function getMyServices(supabaseServer: SupabaseClient, businessIds: string[]) {
  if (businessIds.length === 0) return { data: [] as never[], error: null };
  return supabaseServer
    .from("services")
    .select("*")
    .in("business_id", businessIds)
    .order("created_at", { ascending: false });
}
