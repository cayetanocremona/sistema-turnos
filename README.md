# Reservy

Sistema de gestión de turnos **multi-tenant**: cada negocio tiene su propia página pública para que los clientes reserven online, y un panel de administración privado para gestionar turnos, horarios, recursos, servicios y abonos.

Proyecto personal en desarrollo activo, pensado para resolver un caso real (peluquerías, canchas, consultorios y negocios similares que hoy coordinan turnos por WhatsApp).

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- - **Tailwind CSS 4**
  - - **Supabase**: Postgres, Auth, Row Level Security (RLS) y funciones/cron en la base
    - - Despliegue pensado para **Vercel**
     
      - ## Cómo funciona
     
      - Cada negocio tiene una URL propia (`/[slug]`) con su storefront público — branding, horarios, recursos y catálogo de servicios — donde el cliente elige recurso, servicio y horario disponible sin necesidad de crear una cuenta. El dueño del negocio accede a un panel (`/[slug]/owner`) para:
     
      - - Ver y gestionar turnos (`appointments`)
        - - Configurar horarios de atención (`hours`) y bloquear franjas puntuales (`blocked-slots`)
          - - Administrar recursos reservables (`resources`) — canchas, sillas, boxes, etc.
            - - Armar el catálogo de servicios (`services`) con duración y precio
              - - Gestionar abonos/membresías recurrentes (`memberships`)
               
                - Un motor de disponibilidad (`src/lib/slots.ts`, `src/lib/datetime.ts`) calcula los horarios libres cruzando horario de atención, turnos ya tomados y bloqueos, siempre en la zona horaria del negocio.
               
                - ## Seguridad y modelo de datos
               
                - El acceso a los datos está gobernado con **RLS en Postgres**: lectura pública para lo que el storefront necesita mostrar sin sesión (horarios, recursos, servicios), y escritura restringida al dueño del negocio (`business_id` validado contra `auth.uid()`).
               
                - La duración y el precio del turno los define el servicio elegido, y el `end_time` se calcula **en el servidor** (Server Action) a partir de la duración del servicio — nunca lo decide el cliente, para que no se pueda forzar un horario de fin arbitrario. Durante el desarrollo se detectó y corrigió una policy de alta pública de turnos que no validaba que el recurso y el servicio pertenecieran al negocio declarado, lo que permitía insertar turnos en negocios ajenos llamando directo a la API — quedó resuelto validando esa relación en la policy.
               
                - Los cambios de esquema quedan documentados y versionados en `supabase/migrations/`, con un registro adicional (`docs/estado-proyecto.md`) para cualquier cambio aplicado fuera de ese flujo.
               
                - ## Estructura del proyecto
               
                - ```
                  src/
                  ├─ app/
                  │  ├─ [slug]/          # Storefront público del negocio (branded / default)
                  │  │  └─ owner/        # Panel privado del dueño (turnos, horarios, servicios, abonos...)
                  │  ├─ admin/           # Alta y administración de negocios
                  │  ├─ auth/            # Callback y confirmación de Supabase Auth
                  │  └─ login/
                  ├─ components/ui/      # Componentes UI compartidos
                  └─ lib/                # Cliente de Supabase, cálculo de disponibilidad, fechas/horarios, branding
                  supabase/
                  └─ migrations/         # Historial versionado de cambios de esquema
                  ```

                  ## Correr el proyecto localmente

                  ```bash
                  npm install
                  ```

                  Crear un archivo `.env.local` en la raíz (ver `.env.example`) con las credenciales de tu propio proyecto de Supabase:

                  ```
                  NEXT_PUBLIC_SUPABASE_URL=
                  NEXT_PUBLIC_SUPABASE_ANON_KEY=
                  ```

                  ```bash
                  npm run dev
                  ```

                  Abrir [http://localhost:3000](http://localhost:3000).

                  ## Cómo se construye este proyecto

                  Desarrollo el producto con asistencia de herramientas de IA (Claude Code) como copiloto de programación. Mi trabajo es el diseño del producto, el modelado de datos en Supabase (incluidas las políticas RLS), la toma de decisiones técnicas y la revisión/prueba de cada cambio antes de subirlo a producción — el registro en `docs/estado-proyecto.md` documenta ese proceso.

                  ## Estado

                  Proyecto en desarrollo activo — el core de reservas, disponibilidad, autenticación, catálogo de servicios y abonos ya funciona; roadmap abierto en `docs/`.
                  
