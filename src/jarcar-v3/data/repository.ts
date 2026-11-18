import seed from "./vehicles.seed.json";
import media from "./photos.json";
import { filterInventory } from "./search";
import { segmentNames } from "./vehicle";
export { normalizeSearch } from "./search";
import type { JarcarVehicle, JarcarVehicleRepository, Photo, Search, Segment } from "./vehicle";

export const featuredIds = [
  "ford-f150-raptor-2019",
  "jeep-wrangler-sahara-2010",
  "toyota-bz5-2025",
  "volkswagen-escarabajo-super-beetle-1975",
  "toyota-hilux-2021",
  "mini-aceman-s-2025",
] as const;

const editorialLead: Partial<Record<string, string>> = {
  "ford-f150-raptor-2019": "ford-f150-raptor-2019-03",
  "jeep-wrangler-sahara-2010": "jeep-wrangler-sahara-2010-02",
  "toyota-bz5-2025": "toyota-bz5-2025-02",
  "volkswagen-escarabajo-super-beetle-1975": "volkswagen-escarabajo-super-beetle-1975-02",
};
const byFeaturedOrder = new Map<string, number>(featuredIds.map((id, i) => [id, i]));

export function isSegment(value: string): value is Segment {
  return Object.prototype.hasOwnProperty.call(segmentNames, value);
}

function listingEngine(description: string, hasConflictingData: boolean) {
  if (hasConflictingData) return undefined;
  const text = description.split("/").map((item) => item.trim()).find((item) => /^MOTOR [0-9]/i.test(item));
  return text?.replace(/^MOTOR\s+/i, "").toLocaleLowerCase("es-CR");
}

const localPhotos: Readonly<Record<string, readonly Photo[]>> = media;
const transmissionLabels: Readonly<Record<string, string>> = { automatico: "Automática", manual: "Manual" };
const vehicles: readonly JarcarVehicle[] = seed.vehicles.map((record) => {
  if (!isSegment(record.segmentoUX)) throw new Error(`Segmento sin correspondencia editorial: ${record.id}`);

  const photos = localPhotos[record.id] ?? [];
  const cover = photos.find((photo) => photo.id === editorialLead[record.id]) ?? photos[0] ?? null;
  const hasEngineConflict = record.requiereRevision.some((note) => /cilindrada|di[eé]sel|combusti/i.test(note));
  const uncertainOdometer = record.requiereRevision.some((note) => /corresponde al od[oó]metro/i.test(note));
  const conflictingTransmission = record.requiereRevision.some((note) => /manual.*autom[aá]tica/i.test(note));
  const fuel = record.segmentoUX === "electrico" ? "Eléctrico"
    : !hasEngineConflict && /\bdiesel\b/i.test(record.descripcionOriginal) ? "Diésel"
    : /\bgasolina\b/i.test(record.descripcionOriginal) ? "Gasolina" : undefined;

  return {
    demoId: record.id,
    brand: record.marca,
    model: record.modelo,
    year: record.anio,
    price: record.precioCRC,
    currency: "CRC",
    mileage: !uncertainOdometer && record.odometro !== null && record.odometroUnidad
      ? { value: record.odometro, unit: record.odometroUnidad === "millas" ? "mi" : "km" }
      : null,
    transmission: conflictingTransmission ? null : transmissionLabels[record.transmision] ?? null,
    drivetrain: record.traccion,
    segment: record.segmentoUX,
    cover,
    photos: cover ? [cover, ...photos.filter((photo) => photo.id !== cover.id)] : photos,
    description: record.descripcionOriginal,
    sourceUrl: record.sourceUrl,
    sourceImage: record.imagenPrincipal,
    checkedAt: record.capturedOn,
    demoOnly: record.demoOnly,
    availability: "unverified",
    reviewNotes: record.requiereRevision,
    engine: listingEngine(record.descripcionOriginal, hasEngineConflict),
    fuel,
  };
});

const byDemoId = new Map(vehicles.map((vehicle) => [vehicle.demoId, vehicle]));
const featured = featuredIds.flatMap((id) => byDemoId.get(id) ?? []);

export function applySearch(records: readonly JarcarVehicle[], query: Search) {
  return filterInventory(records, query, byFeaturedOrder);
}

export const mock: JarcarVehicleRepository = {
  async vehicles() { return vehicles; },
  async search(query) { return applySearch(vehicles, query); },
  async featured() { return featured; },
  async detail(demoId) { return byDemoId.get(demoId) ?? null; },
  async related(demoId) {
    const current = byDemoId.get(demoId);
    if (!current) return [];
    return vehicles.filter((vehicle) => vehicle.demoId !== demoId).sort((a, b) => {
      const segmentOrder = Number(b.segment === current.segment) - Number(a.segment === current.segment);
      return segmentOrder || Math.abs(a.price - current.price) - Math.abs(b.price - current.price);
    }).slice(0, 4);
  },
};

export const repository: JarcarVehicleRepository = mock;
