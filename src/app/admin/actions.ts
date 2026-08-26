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
  const inviteCode = ((formData.get("invite_code") as string) ?? "").trim();

  if (!name || !rawSlug || !inviteCode) {
    return { error: "Completá el nombre, el slug y el código de invitación." };
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

  const { error } = await supabaseServer.rpc("create_business_with_invite", {
    p_code: inviteCode,
    p_name: name,
    p_slug: slug,
  });

  if (error) {
    if (error.message === "invalid_or_used_invite_code") {
      return { error: "Código inválido o ya usado." };
    }
    if (error.code === "23505" && error.message.includes("businesses_name_unique_ci")) {
      return { error: "Ya existe un negocio con ese nombre." };
    }
    if (error.code === "23505") {
      return { error: "Ese slug ya está en uso, elegí otro." };
    }
    return { error: `Error al crear el negocio: ${error.message}` };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { error: null };
}
