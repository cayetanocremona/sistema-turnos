# Diseño — branding por negocio

Decisión de arquitectura acordada con el Tech Lead: un sistema de **presets configurables**, no una página a medida por negocio. Tiene que escalar a negocio #3, #4, etc. dando de alta una fila nueva, sin tocar código.

## Esquema

4 columnas nuevas en `businesses` (migración `012_business_branding.sql`):

| columna | tipo | notas |
|---|---|---|
| brand_color | text | hex `#rrggbb` (CHECK), único valor de marca 100% libre |
| brand_style_preset | text | CHECK cerrado: `clasico` \| `elegante` \| `deportivo` \| `minimal`. Default `clasico`. |
| logo_url | text | nullable |
| hero_image_url | text | nullable |

**Por qué `brand_style_preset` es un enum cerrado y no texto libre:** un valor inválido ahí no rompe el insert, rompe silenciosamente el theming de `/[slug]` en producción (cae a ninguno de los `if` conocidos). El CHECK lo convierte en un error de escritura, detectable al instante, en vez de un bug que aparece semanas después cuando alguien visita la página del negocio.

**Por qué solo `brand_color` es libre y el resto no:** si cada negocio pudiera elegir tipografía, layout de portada, etc. de forma independiente, el sistema deja de ser "presets" y pasa a ser "una página a medida por negocio" -- exactamente lo que se descartó. El preset fija todo lo demás (tipografía, tratamiento de portada, paleta de fondo); `brand_color` es el único grado de libertad, y se usa siempre como *acento* (botones, bordes, badge), nunca como fondo de página -- así ningún negocio puede accidentalmente romper la legibilidad del preset eligiendo un color raro para el fondo completo.

No hizo falta tocar RLS: `businesses_select_public`/`businesses_update_own` no son políticas column-level, así que ya cubren las columnas nuevas.

## Los 4 presets

Implementados en `src/app/[slug]/theme.ts` (tokens) + `src/app/[slug]/BrandedStorefront.tsx` (layout):

- **`clasico`**: pasa por el mismo theming que el resto (`getStorefrontTheme`/`BrandedStorefront`) -- fondo claro neutro, tipografía `system-ui` y `brand_color` como acento sólido en la portada/badge/botón. Es el default de todo negocio nuevo, así que tiene que verse prolijo sin que el dueño configure nada más que su color de marca.
  - **Cambio de decisión (sesión post-lanzamiento a los primeros negocios reales):** originalmente `clasico` no pasaba por este theming -- `page.tsx` bifurcaba antes y renderizaba el markup crudo de v0-v3 (sin cards, sin tipografía, fondo por default del navegador), a propósito, para garantizar cero regresión visual en los 3 negocios que ya existían al momento de crear los presets. Una vez que se empezó a mostrar el sistema a negocios reales, ese markup crudo resultó ser el problema: es el preset *default*, así que todo negocio nuevo nace con la página pública rota a menos que alguien elija explícitamente `elegante`/`deportivo`. Se resolvió dándole a `clasico` un preset real en `theme.ts` -- la garantía de "cero regresión" ya no aplicaba (los negocios reales que se iban a mostrar a prospectos necesitaban verse bien, no verse igual que un HTML sin estilos).
- **`elegante`** (peluquería "Estilo Urbano" en el mockup aprobado): paleta oscura fija (no depende de `brand_color`), tipografía Cormorant Garamond (display) + Manrope (body) vía `next/font/google`, portada en tarjeta redondeada con monograma grande centrado si no hay `hero_image_url`.
- **`deportivo`** (cancha "La Bombonerita F5"): banner superior en `brand_color` (con degradé), tipografía Archivo Black (display) + Barlow (body), portada = el banner mismo, con las iniciales del negocio sangrando como marca de agua si no hay `hero_image_url`.
- **`minimal`**: sin mockup aprobado todavía. Versión liviana blanco/negro, misma tipografía que `clasico` (system-ui). No se le dedicó más tiempo que el mínimo -- ver pedido explícito del usuario.

## Decisiones que se apartan del mockup (y por qué)

El mockup es de dos rubros concretos (peluquería, fútbol 5) y tiene detalles de esos rubros específicos que no generalizan a un sistema agnóstico:

- **Sin ícono de tijera/pelota en el badge**: el mockup usa un ícono SVG distinto por rubro en el círculo de marca. Como el sistema no sabe de antemano el rubro de un negocio nuevo, el badge usa siempre las **iniciales** del nombre (mismo criterio que pide el punto 3 del pedido para cuando no hay `logo_url`) -- funciona para cualquier negocio sin mantener una librería de íconos por industria.
- **Sin badge "Techada"**: en el mockup, las canchas del rubro fútbol tienen un badge "Techada". Es un atributo específico de ese rubro que no existe en el esquema genérico de `services` (no hay columna para eso, y agregarla sería modelar un caso particular en una tabla que tiene que servir a cualquier rubro). Se omite.
- **Watermark = iniciales, no un número literal**: el mockup pone un "5" gigante de fondo (por "fútbol 5"). Como el sistema es agnóstico al rubro, el watermark del preset "deportivo" son las iniciales del negocio (mismo dato que ya se usa para el badge), no un número que solo tiene sentido para una cancha de fútbol 5.
- **`brand_color` sí se usa en "deportivo"**: en el artboard de fútbol del mockup el verde del banner está harcodeado (no está cableado a una prop, a diferencia del artboard de la peluquería). Acá se usa `brand_color` para el banner en los dos presets por igual, tal como pide el punto 3 del pedido ("brand_color es el único color libre que elige el negocio") -- en la demo da el mismo verde porque así se cargó el dato, pero un negocio deportivo con otro color de marca va a ver su propio color en el banner.
- **Sin tagline/copy de marketing**: el mockup tiene textos como "Cortes, coloración y barba — con turno online, sin vueltas." Es copy inventado para la demo, no un dato real del negocio (no hay columna para eso en el esquema, y agregarla no se pidió). No se generó texto de relleno.

## Contraste de texto sobre `brand_color`

`getContrastTextColor` (`src/lib/branding.ts`) calcula luminancia relativa (fórmula WCAG) sobre el hex elegido y devuelve texto negro o blanco, el que tenga más contraste. Es necesario porque `brand_color` es 100% libre: un negocio "deportivo" podría elegir un verde clarito en vez de uno oscuro, y sin este cálculo el texto blanco fijo del botón/banner se volvería ilegible.

## Layout full-bleed (fix post-lanzamiento)

`BrandedStorefront.tsx` originalmente aplicaba `background: theme.pageBg` (o `theme.heroBg` en el banner de "deportivo") directo sobre el `<main>` que también tenía `maxWidth: 1040`. A 1440px de ancho de ventana eso dejaba franjas en blanco/negro (el fondo real de `<body>`) a los costados -- el color de marca no llegaba a los bordes de la pantalla. Se corrigió separando responsabilidades: un `<div>` exterior a `width: 100%` lleva el fondo (y, en "deportivo", el banner también es un `<div>` exterior a `width: 100%` con su propio `maxWidth` interno solo para el texto/badge), y el contenido (cards, formulario, texto) queda en un `<main>` interior con `maxWidth: 1040, margin: "0 auto"` -- mismo patrón en la home (`src/app/page.tsx`).

## Los 2 negocios de demo

`013_demo_businesses_branding.sql`: "Estilo Urbano" (`estilo-urbano`, preset `elegante`) y "La Bombonerita F5" (`la-bombonerita-f5`, preset `deportivo`), con `owner_id` null -- son solo para mostrarle a un prospecto el flujo público de reserva (`/[slug]`), no tienen dueño logueado. Migración idempotente (chequea que el slug no exista antes de insertar), pensada para poder re-correrla sin duplicar datos si se re-aplica por error.
