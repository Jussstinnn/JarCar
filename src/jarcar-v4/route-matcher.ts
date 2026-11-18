import type { JarcarVehicle, Segment } from '../jarcar-v3/data/vehicle';

/** A transparent editorial selector, not an automated suitability assessment. */
export const routePlans = [
  { id: 'dia-a-dia', label: 'Todos los días', line: 'Ciudad, rutina, primeros kilómetros', short: 'Día a día', segments: ['hatchback', 'sedan', 'electrico'] },
  { id: 'espacio', label: 'Más espacio', line: 'Explorar alternativas de carrocería amplia', short: 'Espacio', segments: ['suv', 'sedan'] },
  { id: 'camino', label: 'Afuera de la ruta', line: 'Pickups y SUV para descubrir', short: 'Aventura', segments: ['pickup', 'suv'] },
  { id: 'trabajo', label: 'En movimiento', line: 'Comerciales y pickups para evaluar', short: 'Trabajo', segments: ['comercial', 'pickup'] },
  { id: 'distinto', label: 'Algo diferente', line: 'Clásicos y carácter propio', short: 'Singular', segments: ['clasico', 'hatchback', 'sedan'] },
] as const satisfies ReadonlyArray<{ id: string; label: string; line: string; short: string; segments: readonly Segment[] }>;

export type RoutePlan = typeof routePlans[number]['id'];
export const routeBudgets = [0, 5_000_000, 8_000_000, 12_000_000, 20_000_000, 30_000_000] as const;

export function getRouteResults(vehicles: readonly JarcarVehicle[], plan: RoutePlan, budget: number) {
  const definition = routePlans.find(item => item.id === plan) ?? routePlans[0];
  const segments: readonly Segment[] = definition.segments;
  const eligible = vehicles.filter(vehicle => segments.some(s => s === vehicle.segment) && vehicle.price > 0 && Number.isFinite(vehicle.price) && vehicle.currency === 'CRC');
  const rank = (a: JarcarVehicle, b: JarcarVehicle) => {
    const aGroup = segments.indexOf(a.segment);
    const bGroup = segments.indexOf(b.segment);
    return aGroup - bGroup || b.year - a.year || a.price - b.price || a.demoId.localeCompare(b.demoId);
  };
  const matching = eligible.filter(vehicle => !budget || vehicle.price <= budget).sort(rank);
  // When there are no exact matches, show the nearest price options, clearly labelled outside the selected budget.
  const alternatives = !matching.length && budget ? [...eligible].sort((a, b) => a.price - b.price || rank(a, b)).slice(0, 3) : [];
  return { definition, matching, alternatives, total: matching.length, exact: matching.length > 0 };
}
