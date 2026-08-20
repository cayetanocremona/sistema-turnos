Auditoría de seguridad post-v2: revisé las políticas de RLS directo en Supabase (no me quedé con que "ya está" nomás) y encontré dos problemas que ya corregí del lado de la base de datos, pero necesitan un ajuste de código:

1. **Ya borré** la política vieja `temp_open_write_pending_auth` que había quedado en `businesses`, `resources` y `business_hours` — seguía permitiendo escritura pública a pesar de las políticas nuevas por dueño (las políticas de RLS se combinan con OR, así que una sola política abierta anula a todas las restrictivas). Esto no requiere cambio de código de tu parte, ya funciona bien.

2. **`clients` ya no tiene ninguna política pública** (ni de lectura ni de escritura) — antes cualquiera con la anon key podía leer nombre y teléfono de todos los clientes de la plataforma. En su lugar, creé una función Postgres `security definer`:

   ```sql
   create or replace function upsert_client(p_name text, p_phone text)
   returns uuid
   language plpgsql
   security definer
   set search_path = public
   as $$
   declare
     v_id uuid;
   begin
     select id into v_id from clients where phone = p_phone;
     if v_id is not null then
       return v_id;
     end if;

     insert into clients (name, phone) values (p_name, p_phone)
     returning id into v_id;

     return v_id;
   end;
   $$;
   ```

   Está expuesta vía RPC (`grant execute` a `anon` y `authenticated`), así que se llama con `supabase.rpc('upsert_client', { p_name: name, p_phone: phone })` y devuelve el `uuid` del cliente (existente o recién creado), sin necesidad de hacer `select`/`insert` directo contra la tabla.

## Qué cambiar

Buscá en el código **todos los lugares** donde hoy se hace "buscar cliente por teléfono, si no existe crearlo" contra la tabla `clients` directo (debería estar al menos en la Server Action de turnos de la página interna `/`, y en la del formulario público de `/[slug]`) y reemplazalos por una sola llamada:

```ts
const { data: clientId, error } = await supabase.rpc("upsert_client", {
  p_name: name,
  p_phone: phone,
});
```

`clientId` va a ser directamente el UUID a usar como `client_id` al insertar el `appointment`. Manejá el error igual que hoy si algo falla.

También agregá al dashboard del dueño (si no está ya) una forma de ver, para cada turno que lista, el nombre y teléfono del cliente asociado — ahora que `clients_select_own_business` permite que un dueño logueado vea los datos de los clientes que tuvieron un turno en SU negocio (no en otros), tiene sentido que el dashboard aproveche eso en vez de ocultarlo.

## Al terminar
- `npm run build` sin errores.
- `npm run dev`: probá sacar un turno nuevo (con teléfono que no existe todavía) desde la página pública `/[slug]`, y otro con el mismo teléfono para confirmar que reusa el cliente en vez de duplicarlo. Confirmá que el dashboard del dueño logueado muestra bien los datos del cliente en sus turnos.
- Contame qué archivos tocaste.
