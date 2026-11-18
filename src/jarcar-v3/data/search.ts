import { mileageInKm, nameOf, segmentNames } from "./vehicle";
import type { JarcarVehicle, Search } from "./vehicle";

export function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es-CR").replace(/[^a-z0-9]+/g, " ").trim();
}

export function filterInventory(records: readonly JarcarVehicle[], query: Search, editorialOrder?: ReadonlyMap<string, number>) {
  const tokens = normalizeSearch(query.q ?? "").split(" ").filter(Boolean);
  const brand = normalizeSearch(query.brand ?? "");
  const transmission = normalizeSearch(query.transmission ?? "");
  const traction = normalizeSearch(query.traction ?? "");
  const selection = query.demoIds ? new Set(query.demoIds) : null;
  const priceBounded = query.minPriceCrc !== undefined || query.maxPriceCrc !== undefined;

  const filtered = records.filter((vehicle) => {
    const label = normalizeSearch(`${nameOf(vehicle)} ${vehicle.year} ${segmentNames[vehicle.segment]} ${vehicle.drivetrain ?? ""}`);
    return (!selection || selection.has(vehicle.demoId))
      && (!query.segment || vehicle.segment === query.segment)
      && (!brand || normalizeSearch(vehicle.brand) === brand)
      && (!transmission || normalizeSearch(vehicle.transmission ?? "").startsWith(transmission.slice(0, 5)))
      && (!traction || normalizeSearch(vehicle.drivetrain ?? "") === traction)
      && (!priceBounded || (vehicle.currency === "CRC"
        && vehicle.price >= (query.minPriceCrc ?? 0)
        && vehicle.price <= (query.maxPriceCrc ?? Infinity)))
      && vehicle.year >= (query.minYear ?? 0)
      && vehicle.year <= (query.maxYear ?? Infinity)
      && tokens.every((token) => label.includes(token));
  });

  function byPrice(a: JarcarVehicle, b: JarcarVehicle, direction: 1 | -1) {
    if (a.currency !== b.currency) return a.currency.localeCompare(b.currency);
    return (a.price - b.price) * direction;
  }

  switch (query.sort) {
    case "featured":
      return editorialOrder ? filtered.sort((a, b) => (editorialOrder.get(a.demoId) ?? editorialOrder.size) - (editorialOrder.get(b.demoId) ?? editorialOrder.size)) : filtered;
    case "price-asc": return filtered.sort((a, b) => byPrice(a, b, 1));
    case "price-desc": return filtered.sort((a, b) => byPrice(a, b, -1));
    case "year-desc": return filtered.sort((a, b) => b.year - a.year);
    case "mileage-asc": return filtered.sort((a, b) => mileageInKm(a) - mileageInKm(b));
    default: return filtered;
  }
}
