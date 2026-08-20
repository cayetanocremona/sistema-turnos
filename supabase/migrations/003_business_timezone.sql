-- Sistema de Gestión de Turnos — v1.1
-- Zona horaria explícita por negocio, para interpretar/mostrar correctamente
-- los datetime-local que llegan desde los formularios de Turnos y Bloqueos.
-- Ya aplicada en el proyecto Supabase remoto vía MCP.

alter table businesses
  add column timezone text not null default 'America/Argentina/Buenos_Aires';
