import type { CSSProperties, ReactNode } from "react";
import { getBusinessInitials } from "@/lib/branding";
import { StorefrontTheme } from "./theme";
import PublicAppointmentForm from "./PublicAppointmentForm";

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
  logo_url: string | null;
  hero_image_url: string | null;
};
type Resource = { id: string; name: string };
type BusinessHour = { id: string; day_of_week: number; start_time: string; end_time: string };
type Service = { id: string; name: string; duration_minutes: number; price: number | string };
type PublicAppointmentFormState = { error: string | null; success: boolean };

function Badge({
  business,
  theme,
  size,
}: {
  business: Business;
  theme: StorefrontTheme;
  size: number;
}) {
  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    background: theme.accent,
    color: theme.accentText,
    fontFamily: theme.fontDisplay,
    fontWeight: 600,
    fontSize: size * 0.4,
  };

  if (business.logo_url) {
    return (
      <div style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element -- logos son URLs externas cargadas por el dueño, no assets locales optimizables */}
        <img
          src={business.logo_url}
          alt={business.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    );
  }

  return <div style={style}>{getBusinessInitials(business.name)}</div>;
}

function SectionLabel({ children, theme }: { children: ReactNode; theme: StorefrontTheme }) {
  return (
    <div
      style={{
        fontSize: 12,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: theme.mutedText,
        fontWeight: theme.bannerLayout ? 600 : 400,
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function Card({ theme, children }: { theme: StorefrontTheme; children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px",
        borderRadius: 12,
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
      }}
    >
      {children}
    </div>
  );
}

// Grilla responsive sin media queries: auto-fit + minmax arma varias columnas
// cuando hay ancho disponible (desktop) y cae a 1 sola columna cuando no
// (mobile) -- el mismo layout sirve para los dos casos sin breakpoints.
function CardGrid({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 340px))",
        gap: 10,
      }}
    >
      {children}
    </div>
  );
}

function Hero({ business, theme }: { business: Business; theme: StorefrontTheme }) {
  const initials = getBusinessInitials(business.name);

  if (business.hero_image_url && theme.bannerLayout) {
    // Banner (deportivo): la imagen cubre todo el fondo del banner, con un
    // degradé oscuro encima para que el texto (badge, nombre, título) siga
    // siendo legible sin importar la foto que haya cargado el negocio.
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${business.hero_image_url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(155deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 100%)",
          }}
        />
      </div>
    );
  }

  if (business.hero_image_url) {
    return (
      <div
        style={{
          position: "relative",
          height: "clamp(180px, 26vw, 340px)",
          borderRadius: 14,
          overflow: "hidden",
          backgroundImage: `url(${business.hero_image_url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    );
  }

  if (theme.bannerLayout) {
    // "deportivo": las iniciales sangran como marca de agua detrás del título,
    // dentro del banner de color (ver Hero dentro del banner en BannerHeader).
    // Tamaño y posición en % / vw -- escalan con el ancho del banner en vez de
    // quedar clavados al tamaño del mockup mobile.
    return (
      <div
        aria-hidden
        style={{
          position: "absolute",
          right: "2%",
          top: "-6%",
          fontFamily: theme.fontDisplay,
          fontSize: "clamp(140px, 16vw, 280px)",
          lineHeight: 1,
          color: theme.heroMonogramColor,
          opacity: 0.28,
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        height: "clamp(180px, 26vw, 340px)",
        borderRadius: 14,
        overflow: "hidden",
        background: theme.heroBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontFamily: theme.fontDisplay,
          fontSize: "clamp(72px, 11vw, 160px)",
          fontWeight: 600,
          color: theme.heroMonogramColor,
        }}
      >
        {initials}
      </span>
    </div>
  );
}

export default function BrandedStorefront({
  business,
  theme,
  resourceList,
  hoursList,
  serviceList,
  action,
}: {
  business: Business;
  theme: StorefrontTheme;
  resourceList: Resource[];
  hoursList: BusinessHour[];
  serviceList: Service[];
  action: (
    prevState: PublicAppointmentFormState,
    formData: FormData
  ) => Promise<PublicAppointmentFormState>;
}) {
  // Padding lateral fijo (390px, ancho del mockup mobile) escalado con clamp()
  // en vez de hardcodeado: mismo look en celular, más aire en desktop, sin
  // necesidad de media queries.
  const sidePad = "clamp(20px, 4vw, 56px)";

  // El fondo (`theme.pageBg` / `theme.heroBg`) va en un wrapper a `width: 100%`
  // para que sangre hasta los bordes de la ventana en pantallas anchas; el
  // contenido (texto, cards, form) se centra adentro con su propio
  // `maxWidth: 1040` -- así el banner de color no queda encajonado en una
  // columna angosta mientras el resto del layout sigue siendo legible.
  return (
    <div
      style={{
        width: "100%",
        background: theme.pageBg,
        color: theme.pageText,
        fontFamily: theme.fontBody,
        minHeight: "100vh",
      }}
    >
      {theme.bannerLayout && (
        <div
          style={{
            position: "relative",
            background: theme.heroBg,
            overflow: "hidden",
          }}
        >
          <Hero business={business} theme={theme} />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              maxWidth: 1040,
              margin: "0 auto",
              padding: `20px ${sidePad} 30px ${sidePad}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Badge business={business} theme={theme} size={34} />
              <div
                style={{
                  fontFamily: theme.fontDisplay,
                  fontSize: 16,
                  color: business.hero_image_url ? "#ffffff" : theme.accentText,
                  letterSpacing: "0.01em",
                }}
              >
                {business.name.toUpperCase()}
              </div>
            </div>
            <div
              style={{
                marginTop: 26,
                fontFamily: theme.fontDisplay,
                fontSize: "clamp(28px, 4vw, 44px)",
                lineHeight: 1.15,
                color: business.hero_image_url ? "#ffffff" : theme.accentText,
              }}
            >
              Reservá tu turno
            </div>
          </div>
        </div>
      )}

      <main style={{ maxWidth: 1040, margin: "0 auto", paddingBottom: 48 }}>
        {!theme.bannerLayout && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: `20px ${sidePad} 16px ${sidePad}`,
              }}
            >
              <Badge business={business} theme={theme} size={34} />
              <div style={{ fontFamily: theme.fontDisplay, fontSize: 20, fontWeight: 600, letterSpacing: "0.02em" }}>
                {business.name}
              </div>
            </div>
            <div style={{ margin: `0 ${sidePad}` }}>
              <Hero business={business} theme={theme} />
            </div>
            <div style={{ padding: `22px ${sidePad} 4px ${sidePad}` }}>
              <div
                style={{
                  fontFamily: theme.fontDisplay,
                  fontSize: "clamp(30px, 3.5vw, 44px)",
                  fontWeight: 600,
                  lineHeight: 1.15,
                }}
              >
                {business.name}
              </div>
            </div>
          </>
        )}

        {serviceList.length > 0 && (
          <div style={{ padding: `26px ${sidePad} 0 ${sidePad}` }}>
            <SectionLabel theme={theme}>Servicios</SectionLabel>
            <CardGrid>
              {serviceList.map((s) => (
                <Card key={s.id} theme={theme}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{s.name}</span>
                    <span style={{ fontSize: 12.5, color: theme.mutedText }}>{s.duration_minutes} min</span>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{formatPrice(s.price)}</span>
                </Card>
              ))}
            </CardGrid>
          </div>
        )}

        <div style={{ padding: `26px ${sidePad} 0 ${sidePad}` }}>
          <SectionLabel theme={theme}>Recursos disponibles</SectionLabel>
          {resourceList.length === 0 ? (
            <span style={{ fontSize: 14, color: theme.mutedText }}>Todavía no hay recursos cargados.</span>
          ) : (
            <CardGrid>
              {resourceList.map((r) => (
                <Card key={r.id} theme={theme}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{r.name}</span>
                </Card>
              ))}
            </CardGrid>
          )}
        </div>

        <div style={{ padding: `26px ${sidePad} 0 ${sidePad}` }}>
          <SectionLabel theme={theme}>Horarios de atención</SectionLabel>
          {hoursList.length === 0 ? (
            <span style={{ fontSize: 14, color: theme.mutedText }}>Todavía no hay horarios cargados.</span>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 240px))",
                gap: "4px 24px",
              }}
            >
              {hoursList.map((h) => (
                <div key={h.id} style={{ fontSize: 14, color: theme.mutedText }}>
                  {DAY_NAMES[h.day_of_week]}: {formatTime(h.start_time)}–{formatTime(h.end_time)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: `30px ${sidePad} 0 ${sidePad}` }}>
          <SectionLabel theme={theme}>Reservar un turno</SectionLabel>
          {resourceList.length === 0 ? (
            <p style={{ fontSize: 14, color: theme.mutedText }}>
              Este negocio todavía no tiene recursos disponibles para reservar.
            </p>
          ) : (
            <div style={{ maxWidth: 420 }}>
              <PublicAppointmentForm
                businessId={business.id}
                resources={resourceList}
                services={serviceList}
                hoursList={hoursList}
                timezone={business.timezone}
                slotIntervalMinutes={business.slot_interval_minutes}
                bookingWindowDays={business.booking_window_days}
                action={action}
                theme={theme}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
