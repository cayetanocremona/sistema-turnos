import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { resolveTenant } from "@/lib/tenant";
import BrandedStorefront from "./BrandedStorefront";
import DefaultStorefront from "./DefaultStorefront";
import { getStorefrontTheme } from "./theme";
import {
  localInputToInstant,
  getLocalDateParts,
  addMinutesToInstant,
  getLocalDateString,
  daysFromToday,
} from "@/lib/datetime";
import { isSlotAligned } from "@/lib/slots";

function timeStringToMinutes(t: string) {
  const [hours, minutes] = t.split(":").map(Number);
  return hours * 60 + minutes;
}

type PublicAppointmentFormState = { error: string | null; success: boolean };

export default async function BusinessPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;

  const business = await resolveTenant(supabase, slug);

  if (!business) {
    notFound();
  }

  const [{ data: resources }, { data: businessHours }, { data: services }, { data: resourceServices }] =
    await Promise.all([
      supabase
        .from("resources")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("business_hours")
        .select("*")
        .eq("business_id", business.id)
        .order("day_of_week", { ascending: true }),
      supabase
        .from("services")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: true }),
      supabase.from("resource_services").select("resource_id, service_id").eq("business_id", business.id),
    ]);

  const resourceList = resources ?? [];
  const hoursList = (businessHours ?? [])
    .slice()
    .sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time));
  const serviceList = services ?? [];
  const resourceServiceList = resourceServices ?? [];

  async function addPublicAppointment(
    _prevState: PublicAppointmentFormState,
    formData: FormData
  ): Promise<PublicAppointmentFormState> {
    "use server";

    const resourceId = formData.get("resource_id") as string;
    const serviceId = (formData.get("service_id") as string) || null;
    const clientName = (formData.get("client_name") as string)?.trim();
    const clientPhone = (formData.get("client_phone") as string)?.trim();
    const startTime = formData.get("start_time") as string;
    const endTime = formData.get("end_time") as string;

    if (!resourceId || !clientName || !clientPhone || !startTime) {
      return { error: "Completá todos los campos.", success: false };
    }

    // Sin servicio elegido (negocio sin catálogo cargado todavía) el fin del turno se sigue
    // escribiendo a mano, como en v1/v2.
    if (!serviceId && !endTime) {
      return { error: "Completá todos los campos.", success: false };
    }

    const { data: currentBusiness, error: findBusinessError } = await supabase
      .from("businesses")
      .select("id, timezone, slot_interval_minutes, booking_window_days")
      .eq("slug", slug)
      .maybeSingle();

    if (findBusinessError || !currentBusiness) {
      return { error: "No se encontró el negocio.", success: false };
    }

    const startInstant = localInputToInstant(startTime, currentBusiness.timezone);

    let endInstant: string;
    if (serviceId) {
      const { data: service, error: serviceError } = await supabase
        .from("services")
        .select("duration_minutes")
        .eq("id", serviceId)
        .eq("business_id", currentBusiness.id)
        .maybeSingle();

      if (serviceError || !service) {
        return { error: "El servicio elegido no es válido.", success: false };
      }

      endInstant = addMinutesToInstant(startInstant, service.duration_minutes);
    } else {
      endInstant = localInputToInstant(endTime, currentBusiness.timezone);
    }

    const startParts = getLocalDateParts(new Date(startInstant), currentBusiness.timezone);
    const endParts = getLocalDateParts(new Date(endInstant), currentBusiness.timezone);

    if (startParts.dayOfWeek !== endParts.dayOfWeek) {
      return { error: "Los turnos deben empezar y terminar el mismo día.", success: false };
    }

    // booking_window_days: mismo criterio que el selector de fecha en la UI,
    // pero validado de nuevo acá porque alguien podría llamar la Server Action
    // sin pasar por el picker (ej. directo a la API de Supabase).
    const startDateString = getLocalDateString(startInstant, currentBusiness.timezone);
    const daysUntil = daysFromToday(startDateString, currentBusiness.timezone);
    if (daysUntil < 0 || daysUntil > currentBusiness.booking_window_days) {
      return { error: "Esa fecha está fuera de la ventana de reserva permitida.", success: false };
    }

    const { data: hoursForDay, error: hoursError } = await supabase
      .from("business_hours")
      .select("start_time, end_time")
      .eq("business_id", currentBusiness.id)
      .eq("day_of_week", startParts.dayOfWeek);

    if (hoursError) {
      return { error: `Error al validar el horario: ${hoursError.message}`, success: false };
    }

    const fitsInHours = (hoursForDay ?? []).some(
      (h) =>
        timeStringToMinutes(h.start_time) <= startParts.timeMinutes &&
        timeStringToMinutes(h.end_time) >= endParts.timeMinutes
    );

    if (!fitsInHours) {
      return {
        error: "Ese horario está fuera del horario de atención del negocio.",
        success: false,
      };
    }

    // slot_interval_minutes: la UI nueva (DateTimePicker/BrandedDateTimePicker)
    // solo ofrece horarios ya alineados a la grilla, pero se valida de nuevo
    // acá por el mismo motivo que booking_window_days arriba.
    if (
      !isSlotAligned(
        startParts.timeMinutes,
        endParts.timeMinutes,
        hoursForDay ?? [],
        currentBusiness.slot_interval_minutes
      )
    ) {
      return {
        error: "Ese horario no coincide con la grilla de turnos del negocio.",
        success: false,
      };
    }

    const { data: overlappingBlocks, error: blockedError } = await supabase
      .from("blocked_slots")
      .select("id")
      .eq("resource_id", resourceId)
      .lt("start_time", endInstant)
      .gt("end_time", startInstant);

    if (blockedError) {
      return { error: `Error al validar bloqueos: ${blockedError.message}`, success: false };
    }

    if (overlappingBlocks && overlappingBlocks.length > 0) {
      return {
        error: "Ese horario no está disponible (bloqueado por el negocio).",
        success: false,
      };
    }

    const { data: clientId, error: upsertClientError } = await supabase.rpc("upsert_client", {
      p_name: clientName,
      p_phone: clientPhone,
    });

    if (upsertClientError) {
      return {
        error: `Error al buscar/crear el cliente: ${upsertClientError.message}`,
        success: false,
      };
    }

    const { error: appointmentError } = await supabase.from("appointments").insert({
      business_id: currentBusiness.id,
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
          success: false,
        };
      }
      return { error: `Error al crear el turno: ${appointmentError.message}`, success: false };
    }

    revalidatePath(`/${slug}`);
    return { error: null, success: true };
  }

  // "clasico" (default de todo negocio nuevo) usa el sistema visual nuevo
  // (Tailwind + componentes reutilizables, ver AGENTS.md "Sistema visual").
  // "elegante"/"deportivo"/"minimal" siguen con su theming propio en
  // BrandedStorefront/theme.ts, sin tocar.
  if (business.brand_style_preset === "clasico") {
    return (
      <DefaultStorefront
        business={business}
        resourceList={resourceList}
        hoursList={hoursList}
        serviceList={serviceList}
        resourceServiceList={resourceServiceList}
        action={addPublicAppointment}
      />
    );
  }

  const theme = getStorefrontTheme(business.brand_style_preset, business.brand_color);
  return (
    <BrandedStorefront
      business={business}
      theme={theme}
      resourceList={resourceList}
      hoursList={hoursList}
      serviceList={serviceList}
      resourceServiceList={resourceServiceList}
      action={addPublicAppointment}
    />
  );
}
