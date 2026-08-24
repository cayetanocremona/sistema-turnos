"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/** Compartido entre home, /admin y /[slug]/owner -- un solo signOut para las 3 superficies. */
export async function signOut() {
  const supabaseServer = await createClient();
  await supabaseServer.auth.signOut();
  revalidatePath("/", "layout");
}
