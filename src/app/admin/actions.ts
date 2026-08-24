"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isReservedSlug } from "@/lib/reservedSlugs";

export type BusinessFormState = { error: string | null; needsLogin?: boolean };

export async function addBusiness(
  _prevState: BusinessFormState,
  formData: FormData
): Promise<BusinessFormState> {
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) {
    return {
      error: "Tenés que iniciar sesión para crear un negocio.",
      needsLogin: true,
    };
  }

  const name = (formData.get("name") as string)?.trim();
  const rawSlug = ((formData.get("slug") as string) ?? "").trim();

  if (!name || !rawSlug) {
    return { error: "Completá el nombre y el slug." };
  }

  // Normaliza a minúsculas, sin acentos, y solo letras/números/guiones.
  const slug = rawSlug
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // saca acentos (é -> e)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    return {
      error: "Ese slug no tiene caracteres válidos. Usá letras, números y guiones.",
    };
  }

  if (isReservedSlug(slug)) {
    return { error: "Ese nombre de URL está reservado, elegí otro." };
  }

  const { error } = await supabaseServer
    .from("businesses")
    .insert({ name, slug, owner_id: user.id });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ese slug ya está en uso, elegí otro." };
    }
    return { error: `Error al crear el negocio: ${error.message}` };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { error: null };
}
