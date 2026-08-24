"use server";

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { localInputToInstant, addMinutesToInstant } from "@/lib/datetime";

/**
 * Deriva end_time = start_time + duration_minutes del servicio, validando que el
 * servicio pertenezca al negocio declarado. Compartido entre crear y reagendar
 * turnos para no repetir la regla de negocio en dos lugares.
 */
async function computeEndInstantFromService(
  supabaseServer: SupabaseClient,
  businessId: string,
  serviceId: string,
  startInstant: string
): Promise<{ endInstant: string; error: null } | { endInstant: null; error: string }> {
  const { data: service, error } = await supabaseServer
    .from("services")
    .select("duration_minutes")
    .eq("id", serviceId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error || !service) {
    return { endInstant: null, error: "El servicio elegido no es válido." };
  }

  return { endInstant: addMinutesToInstant(startInstant, service.duration_minutes), error: null };
}

export async function addResource(formData: FormData) {
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) return;

  const name = (formData.get("name") as string)?.trim();
  const businessId = formData.get("business_id") as string;

  if (!name || !businessId) return;

  const { data: business } = await supabaseServer
    .from("businesses")
    .select("owner_id, slug")
    .eq("id", businessId)
    .maybeSingle();

  if (business?.owner_id !== user.id) return;

  await supabaseServer.from("resources").insert({ name, business_id: businessId });
  revalidatePath(`/${business.slug}/owner/resources`);
}

export async function addService(formData: FormData) {
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) return;

  const businessId = formData.get("business_id") as string;
  const name = (formData.get("name") as string)?.trim();
  const durationMinutes = Number(formData.get("duration_minutes"));
  const price = Number(formData.get("price"));

  if (!businessId || !name || !Number.isFinite(durationMinutes) || durationMinutes <= 0) return;
  if (!Number.isFinite(price) || price < 0) return;

  const { data: business } = await supabaseServer
    .from("businesses")
    .select("owner_id, slug")
    .eq("id", businessId)
    .maybeSingle();

  if (business?.owner_id !== user.id) return;

  await supabaseServer.from("services").insert({
    business_id: businessId,
    name,
    duration_minutes: durationMinutes,
    price,
  });
  revalidatePath(`/${business.slug}/owner/services`);
}

export async function addBusinessHour(formData: FormData) {
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) return;

  const businessId = formData.get("business_id") as string;
  const dayOfWeek = formData.get("day_of_week") as string;
  const startTime = formData.get("start_time") as string;
  const endTime = formData.get("end_time") as string;

  if (!businessId || dayOfWeek === "" || !startTime || !endTime) return;

  const { data: business } = await supabaseServer
    .from("businesses")
    .select("owner_id, slug")
    .eq("id", businessId)
    .maybeSingle();

  if (business?.owner_id !== user.id) return;

  await supabaseServer.from("business_hours").insert({
    business_id: businessId,
    day_of_week: Number(dayOfWeek),
    start_time: startTime,
    end_time: endTime,
  });
  revalidatePath(`/${business.slug}/owner/hours`);
}

export async function addBlockedSlot(formData: FormData) {
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) return;

  const resourceId = formData.get("resource_id") as string;
  const startTime = formData.get("start_time") as string;
  const endTime = formData.get("end_time") as string;
  const reason = (formData.get("reason") as string)?.trim() || null;

  if (!resourceId || !startTime || !endTime) return;

  const { data: resource } = await supabaseServer
    .from("resources")
    .select("business_id")
    .eq("id", resourceId)
    .maybeSingle();

  if (!resource) return;

  const { data: business } = await supabaseServer
    .from("businesses")
    .select("timezone, owner_id, slug")
    .eq("id", resource.business_id)
    .maybeSingle();

  if (business?.owner_id !== user.id) return;

  const timezone = business?.timezone ?? "America/Argentina/Buenos_Aires";

  await supabaseServer.from("blocked_slots").insert({
    resource_id: resourceId,
    start_time: localInputToInstant(startTime, timezone),
    end_time: localInputToInstant(endTime, timezone),
    reason,
  });
  revalidatePath(`/${business.slug}/owner/blocked-slots`);
}

export type AppointmentFormState = { error: string | null };

export async function addAppointment(
  _prevState: AppointmentFormState,
  formData: FormData
): Promise<AppointmentFormState> {
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) {
    return { error: "Tenés que iniciar sesión para crear turnos." };
  }

  const businessId = formData.get("business_id") as string;
  const resourceId = formData.get("resource_id") as string;
  const serviceId = (formData.get("service_id") as string) || null;
  const clientName = (formData.get("client_name") as string)?.trim();
  const clientPhone = (formData.get("client_phone") as string)?.trim();
  const startTime = formData.get("start_time") as string;
  const endTime = formData.get("end_time") as string;

  if (!businessId || !resourceId || !clientName || !clientPhone || !startTime) {
    return { error: "Completá todos los campos." };
  }

  // Sin servicio elegido (negocio sin catálogo cargado todavía) el fin del turno se sigue
  // escribiendo a mano, como en v1/v2.
  if (!serviceId && !endTime) {
    return { error: "Completá todos los campos." };
  }

  const { data: business, error: findBusinessError } = await supabaseServer
    .from("businesses")
    .select("timezone, owner_id, slug")
    .eq("id", businessId)
    .maybeSingle();

  if (findBusinessError || !business) {
    return { error: "No se encontró el negocio elegido." };
  }

  if (business.owner_id !== user.id) {
    return { error: "No tenés permiso para crear turnos en ese negocio." };
  }

  const startInstant = localInputToInstant(startTime, business.timezone);

  let endInstant: string;
  if (serviceId) {
    const result = await computeEndInstantFromService(supabaseServer, businessId, serviceId, startInstant);
    if (result.error !== null) {
      return { error: result.error };
    }
    endInstant = result.endInstant;
  } else {
    endInstant = localInputToInstant(endTime, business.timezone);
  }

  const { data: clientId, error: upsertClientError } = await supabaseServer.rpc(
    "upsert_client",
    { p_name: clientName, p_phone: clientPhone }
  );

  if (upsertClientError) {
    return { error: `Error al buscar/crear el cliente: ${upsertClientError.message}` };
  }

  const { error: appointmentError } = await supabaseServer.from("appointments").insert({
    business_id: businessId,
    resource_id: resourceId,
    service_id: serviceId,
    client_id: clientId,
    start_time: startInstant,
    end_time: endInstant,
  });

  if (appointmentError) {
    if (appointmentError.code === "23P01") {
      return {
        error: "Ese horario se superpone con otro turno ya reservado en este recurso.",
      };
    }
    return { error: `Error al crear el turno: ${appointmentError.message}` };
  }

  revalidatePath(`/${business.slug}/owner/appointments`);
  return { error: null };
}

export type AppointmentMutationState = { error: string | null };

// Soft-delete: nunca borramos la fila, solo marcamos status = 'cancelled'. El
// constraint anti-solapamiento (appointments_no_overlap) solo mira turnos con
// status = 'confirmed', así que cancelar libera el horario automáticamente
// para nuevas reservas, sin perder el turno para métricas futuras del negocio.
export async function cancelAppointment(
  _prevState: AppointmentMutationState,
  formData: FormData
): Promise<AppointmentMutationState> {
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) {
    return { error: "Tenés que iniciar sesión para cancelar turnos." };
  }

  const appointmentId = formData.get("appointment_id") as string;
  const slug = formData.get("slug") as string;
  if (!appointmentId) {
    return { error: "Falta el turno a cancelar." };
  }

  // No hace falta chequear owner_id a mano acá: appointments_update_own (RLS) ya
  // scopea el UPDATE al dueño logueado — si el turno no es suyo, el UPDATE no
  // afecta ninguna fila (sin tirar error) y lo detectamos abajo con data.length.
  const { data, error } = await supabaseServer
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId)
    .select("id");

  if (error) {
    return { error: `Error al cancelar el turno: ${error.message}` };
  }

  if (!data || data.length === 0) {
    return { error: "No se encontró el turno, o no tenés permiso para cancelarlo." };
  }

  if (slug) revalidatePath(`/${slug}/owner/appointments`);
  return { error: null };
}

export async function rescheduleAppointment(
  _prevState: AppointmentMutationState,
  formData: FormData
): Promise<AppointmentMutationState> {
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) {
    return { error: "Tenés que iniciar sesión para reagendar turnos." };
  }

  const appointmentId = formData.get("appointment_id") as string;
  const slug = formData.get("slug") as string;
  const resourceId = (formData.get("resource_id") as string) || null;
  const startTime = formData.get("start_time") as string;

  if (!appointmentId || !startTime) {
    return { error: "Completá todos los campos." };
  }

  // select() ya viene scopeado por appointments_select_own (RLS): si el turno
  // no es de un negocio del dueño logueado, esto devuelve null.
  const { data: appointment, error: findAppointmentError } = await supabaseServer
    .from("appointments")
    .select("business_id, service_id, start_time, end_time, status")
    .eq("id", appointmentId)
    .maybeSingle();

  if (findAppointmentError || !appointment) {
    return { error: "No se encontró el turno, o no tenés permiso para reagendarlo." };
  }

  if (appointment.status === "cancelled") {
    return { error: "Un turno cancelado no se puede reagendar." };
  }

  const { data: business } = await supabaseServer
    .from("businesses")
    .select("timezone")
    .eq("id", appointment.business_id)
    .maybeSingle();

  const timezone = business?.timezone ?? "America/Argentina/Buenos_Aires";
  const startInstant = localInputToInstant(startTime, timezone);

  let endInstant: string;
  if (appointment.service_id) {
    const result = await computeEndInstantFromService(
      supabaseServer,
      appointment.business_id,
      appointment.service_id,
      startInstant
    );
    if (result.error !== null) {
      return { error: result.error };
    }
    endInstant = result.endInstant;
  } else {
    // Turno sin servicio asociado (negocio sin catálogo al momento de crearlo):
    // no hay duración de la que derivar el fin, así que se conserva la duración
    // original del turno y se corre entera al nuevo horario.
    const originalDurationMs =
      new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime();
    endInstant = new Date(new Date(startInstant).getTime() + originalDurationMs).toISOString();
  }

  const updatePayload: { start_time: string; end_time: string; resource_id?: string } = {
    start_time: startInstant,
    end_time: endInstant,
  };
  if (resourceId) {
    updatePayload.resource_id = resourceId;
  }

  const { data, error: updateError } = await supabaseServer
    .from("appointments")
    .update(updatePayload)
    .eq("id", appointmentId)
    .select("id");

  if (updateError) {
    if (updateError.code === "23P01") {
      return {
        error: "Ese horario se superpone con otro turno ya reservado en este recurso.",
      };
    }
    return { error: `Error al reagendar el turno: ${updateError.message}` };
  }

  if (!data || data.length === 0) {
    return { error: "No se pudo reagendar el turno (revisá que el recurso sea del mismo negocio)." };
  }

  if (slug) revalidatePath(`/${slug}/owner/appointments`);
  return { error: null };
}
