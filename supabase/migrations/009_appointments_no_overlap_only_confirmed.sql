-- Backfill: este cambio ya está aplicado en el Supabase remoto (verificado via
-- pg_get_constraintdef), pero se hizo con un execute_sql directo en una sesión
-- anterior, no con apply_migration -- por eso NO aparece en list_migrations,
-- a diferencia de los otros backfills (007/008) que sí estaban en el historial
-- remoto y solo faltaba el archivo local. Este archivo es el registro que faltaba
-- por completo. Ver AGENTS.md, seccion "Estado actual", cancelar/reagendar.
--
-- El constraint original (002_schema_v1_hours_blocks_overlap.sql) excluye
-- solapamientos sin importar el status del turno. Eso rompe cancelar: un turno
-- cancelado seguía "ocupando" el horario para siempre, porque el EXCLUDE lo
-- seguía contando como reservado. La solucion es acotar el EXCLUDE a turnos
-- status = 'confirmed' (constraint parcial, WHERE), asi un turno cancelado deja
-- de bloquear ese resource_id/rango horario para nuevas reservas o reagendas.

alter table appointments
  drop constraint appointments_no_overlap;

alter table appointments
  add constraint appointments_no_overlap
  exclude using gist (
    resource_id with =,
    tstzrange(start_time, end_time) with &&
  ) where (status = 'confirmed');
