import type { CSSProperties } from "react";
import { getBusinessInitials, getContrastTextColor } from "@/lib/branding";
import Card from "@/components/ui/Card";
import Pill from "@/components/ui/Pill";
import StickyBookingCard from "@/components/ui/StickyBookingCard";
import DefaultAppointmentForm from "./DefaultAppointmentForm";

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function formatTime(t: string) {
  return t.slice(0, 5);
}

function formatPrice(p: number | string) {
  return Number(p).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

type Business = {
  id: string;
  name: string;
  timezone: string;
  slot_interval_minutes: number;
  booking_window_days: number;
  brand_color: string;
  logo_url: string | null;
  hero_image_url: string | null;
};
type Resource = { id: string; name: string };
type BusinessHour = { id: string; day_of_week: number; start_time: string; end_time: string };
type Service = { id: string; name: string; duration_minutes: number; price: number | string };
type PublicAppointmentFormState = { error: string | null; success: boolean };

/**
 * Base visual default (reemplaza al viejo preset "clasico" sin estilos) --
 * mismo set de componentes (Card/Pill/StickyBookingCard) que usan home y
 * /[slug]/owner. --brand-accent es la única variación por negocio (ver
 * AGENTS.md "Sistema visual"); todo lo demás (tipografía Manrope, radios,
 * layout) es igual para todos. "elegante"/"deportivo"/"minimal" no pasan por
 * acá -- siguen en BrandedStorefront, sin tocar.
 */
export default function DefaultStorefront({
  business,
  resourceList,
  hoursList,
  serviceList,
  action,
}: {
  business: Business;
  resourceList: Resource[];
  hoursList: BusinessHour[];
  serviceList: Service[];
  action: (
    prevState: PublicAppointmentFormState,
    formData: FormData
  ) => Promise<PublicAppointmentFormState>;
}) {
  const accentText = getContrastTextColor(business.brand_color);
  const initials = getBusinessInitials(business.name);

  const bookingForm = (
    <>
      <h2 className="mb-4 text-lg font-extrabold text-neutral-900">Reservar un turno</h2>
      {resourceList.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Este negocio todavía no tiene recursos disponibles para reservar.
        </p>
      ) : (
        <DefaultAppointmentForm
          businessId={business.id}
          resources={resourceList}
          services={serviceList}
          hoursList={hoursList}
          timezone={business.timezone}
          slotIntervalMinutes={business.slot_interval_minutes}
          bookingWindowDays={business.booking_window_days}
          action={action}
        />
      )}
    </>
  );

  return (
    <div
      className="min-h-screen w-full bg-neutral-50"
      style={{ "--brand-accent": business.brand_color, "--brand-accent-contrast": accentText } as CSSProperties}
    >
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="flex-1">
            {/* Hero */}
            <div className="relative animate-fade-in-up overflow-hidden rounded-[26px] bg-[var(--brand-accent)]">
              {business.hero_image_url && (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-40"
                  style={{ backgroundImage: `url(${business.hero_image_url})` }}
                />
              )}
              <div className="relative flex flex-col gap-4 px-6 py-10 sm:px-10 sm:py-14">
                <div className="flex items-center gap-3">
                  {business.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- logos son URLs externas cargadas por el dueño, no assets locales optimizables
                    <img
                      src={business.logo_url}
                      alt={business.name}
                      className="h-11 w-11 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-extrabold"
                      style={{ background: "rgba(255,255,255,0.2)", color: "var(--brand-accent-contrast)" }}
                    >
                      {initials}
                    </div>
                  )}
                  <Pill variant="neutral" className="bg-white/15 text-[var(--brand-accent-contrast)]">
                    Reservá online
                  </Pill>
                </div>
                <h1
                  className="text-3xl font-extrabold sm:text-4xl"
                  style={{ color: "var(--brand-accent-contrast)" }}
                >
                  {business.name}
                </h1>
              </div>
            </div>

            {serviceList.length > 0 && (
              <div className="mt-8">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">Servicios</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {serviceList.map((s, i) => (
                    <Card
                      key={s.id}
                      className="flex animate-fade-in-up items-center justify-between p-4"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <div>
                        <div className="text-sm font-semibold text-neutral-900">{s.name}</div>
                        <div className="text-xs text-neutral-500">{s.duration_minutes} min</div>
                      </div>
                      <span className="text-sm font-bold text-neutral-900">{formatPrice(s.price)}</span>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">
                Recursos disponibles
              </h2>
              {resourceList.length === 0 ? (
                <span className="text-sm text-neutral-500">Todavía no hay recursos cargados.</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {resourceList.map((r) => (
                    <Pill key={r.id} variant="neutral" className="px-4 py-1.5 text-sm font-semibold">
                      {r.name}
                    </Pill>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">
                Horarios de atención
              </h2>
              {hoursList.length === 0 ? (
                <span className="text-sm text-neutral-500">Todavía no hay horarios cargados.</span>
              ) : (
                <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
                  {hoursList.map((h) => (
                    <div key={h.id} className="text-sm text-neutral-600">
                      <span className="font-medium text-neutral-800">{DAY_NAMES[h.day_of_week]}:</span>{" "}
                      {formatTime(h.start_time)}–{formatTime(h.end_time)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* En mobile la card de reserva va acá, en el flujo normal (no sticky, no hace falta). */}
            <div className="mt-8 lg:hidden">
              <Card className="animate-fade-in-up p-6">{bookingForm}</Card>
            </div>
          </div>

          <div className="hidden w-[360px] shrink-0 lg:block">
            <StickyBookingCard className="animate-fade-in-up">{bookingForm}</StickyBookingCard>
          </div>
        </div>
      </div>
    </div>
  );
}
