import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan las variables de entorno NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (revisá .env.local)"
  );
}

// Cliente de Supabase para Client Components: guarda la sesión en localStorage
// y cookies (via @supabase/ssr) para que el server también pueda leerla.
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
