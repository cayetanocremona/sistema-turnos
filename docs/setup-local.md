# Cómo levantar el proyecto en tu compu

## 1. Crear `.env.local`
Por seguridad, el asistente no puede escribir archivos `.env*` directo en tu compu. Creá manualmente el archivo `.env.local` en la raíz de `sistema-turnos` (al lado de `package.json`) con este contenido:

```
NEXT_PUBLIC_SUPABASE_URL=https://zyudlxiclhocvnshygia.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_cw2RLoewWiptLGFNyw8erQ_KTyiW7IO
```

(Ya tenés `.env.example` como referencia, y `.env.local` está en `.gitignore` así que nunca se sube a un repo si en algún momento agregás git remoto.)

## 2. Instalar dependencias y correr
Abrí una terminal en VS Code, parado en la carpeta `sistema-turnos`, y corré:

```
npm install
npm run dev
```

Abrí `http://localhost:3000` — deberías ver la página "Sistema de Gestión de Turnos — v0" con un formulario para cargar un negocio y una lista de negocios cargados. Si cargás uno y refresca la lista, la conexión Next.js ↔ Supabase está funcionando de punta a punta.

## Datos del proyecto Supabase
- Nombre: `sistema-turnos`
- Región: `sa-east-1` (São Paulo)
- Project ref: `zyudlxiclhocvnshygia`
- Dashboard: https://supabase.com/dashboard/project/zyudlxiclhocvnshygia

## ⚠️ Nota de seguridad importante
Row Level Security (RLS) está **deshabilitado** en las 4 tablas (`businesses`, `resources`, `clients`, `appointments`). Esto es intencional para v0 — no hay Auth todavía y activar RLS sin políticas bloquearía todo el acceso. Pero significa que, tal cual está hoy, cualquiera con la `anon key` (que va embebida en el código del cliente, es pública por diseño) puede leer y escribir todas las filas de estas tablas.

Mientras estemos en desarrollo local con datos de prueba, no es un problema. **Antes de poner esto en producción con datos reales de negocios/clientes, hay que activar RLS con políticas** — está planificado como parte de v2 (Auth + multi-tenant) en el roadmap.
