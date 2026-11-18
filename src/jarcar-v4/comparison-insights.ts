import type { JarcarVehicle } from '../jarcar-v3/data/vehicle';

/** Comparaciones de datos publicados, no evaluación del estado ni recomendaciones. */
export interface ComparisonInsight {
  key: 'precio' | 'anio' | 'odometro';
  title: string;
  value: string;
  detail: string;
  vehicleId: string;
}

const numbers = new Intl.NumberFormat('es-CR', { maximumFractionDigits: 0 });
const money = (value: number, currency: string) =>
  new Intl.NumberFormat('es-CR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);

function uniqueMinimum<T>(items: readonly T[], value: (item: T) => number): T | undefined {
  if (items.length < 2) return undefined;
  const sorted = [...items].sort((a, b) => value(a) - value(b));
  return value(sorted[0]) < value(sorted[1]) ? sorted[0] : undefined;
}
function uniqueMaximum<T>(items: readonly T[], value: (item: T) => number): T | undefined {
  if (items.length < 2) return undefined;
  const sorted = [...items].sort((a, b) => value(b) - value(a));
  return value(sorted[0]) > value(sorted[1]) ? sorted[0] : undefined;
}

export function comparisonInsights(vehicles: readonly JarcarVehicle[]): ComparisonInsight[] {
  if (vehicles.length < 2) return [];
  const answers: ComparisonInsight[] = [];
  const priceKnown = vehicles.filter(v => Number.isFinite(v.price) && v.price > 0);
  const commonCurrency = priceKnown.length === vehicles.length && priceKnown.every(v => v.currency === priceKnown[0].currency);
  const cheapest = commonCurrency ? uniqueMinimum(priceKnown, v => v.price) : undefined;
  if (cheapest) answers.push({
    key: 'precio', title: 'Menor precio anunciado', value: money(cheapest.price, cheapest.currency),
    detail: 'Comparación del precio publicado, no del costo total de compra.', vehicleId: cheapest.demoId,
  });
  const newest = uniqueMaximum(vehicles, v => v.year);
  if (newest) answers.push({
    key: 'anio', title: 'Año más reciente', value: String(newest.year),
    detail: 'El año por sí solo no indica el estado de la unidad.', vehicleId: newest.demoId,
  });
  const odometers = vehicles.filter(v => v.mileage !== null && v.mileage.value >= 0 && Number.isFinite(v.mileage.value));
  const km = (v: JarcarVehicle) => v.mileage!.value * (v.mileage!.unit === 'mi' ? 1.609344 : 1);
  const lowestMileage = odometers.length === vehicles.length ? uniqueMinimum(odometers, km) : undefined;
  if (lowestMileage) answers.push({
    key: 'odometro', title: 'Menor kilometraje publicado',
    value: `${numbers.format(Math.round(km(lowestMileage)))} km`,
    detail: 'Millas convertidas a km solo para comparar; verificá el odómetro real.', vehicleId: lowestMileage.demoId,
  });
  return answers;
}
