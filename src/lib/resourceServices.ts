// Compatibilidad opcional recurso-servicio (tabla resource_services, ver
// supabase/migrations/016_resource_services.sql). Regla: un resource_id sin
// ninguna fila acepta cualquier servicio del negocio; con al menos una fila,
// solo esos servicios son válidos para ese recurso. Estas funciones son la
// única fuente de esa regla en el frontend -- la comparten los 3 formularios
// de alta (público, panel) y el de reagendado (que la aplica al revés: filtra
// recursos por el servicio ya fijo del turno, en vez de servicios por recurso).

export type ResourceServiceLink = { resource_id: string; service_id: string };

export function filterServicesForResource<S extends { id: string }>(
  services: S[],
  resourceId: string,
  links: ResourceServiceLink[]
): S[] {
  const allowedForResource = links.filter((l) => l.resource_id === resourceId);
  if (allowedForResource.length === 0) return services;

  const allowedServiceIds = new Set(allowedForResource.map((l) => l.service_id));
  return services.filter((s) => allowedServiceIds.has(s.id));
}

export function filterResourcesForService<R extends { id: string }>(
  resources: R[],
  serviceId: string,
  links: ResourceServiceLink[]
): R[] {
  const restrictedResourceIds = new Set(links.map((l) => l.resource_id));
  return resources.filter((r) => {
    if (!restrictedResourceIds.has(r.id)) return true;
    return links.some((l) => l.resource_id === r.id && l.service_id === serviceId);
  });
}
