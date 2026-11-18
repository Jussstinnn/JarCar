export type Segment =
  | "pickup"
  | "suv"
  | "hatchback"
  | "electrico"
  | "sedan"
  | "clasico"
  | "comercial";

export interface Photo {
  id: string;
  label: string;
  alt: string;
  variants: ReadonlyArray<{ src: string; width: number; height: number }>;
}

export interface JarcarVehicle {
  demoId: string;
  backendVehicleId?: number;
  brand: string;
  model: string;
  year: number;
  price: number;
  currency: "CRC" | "USD";
  mileage: { value: number; unit: "km" | "mi" } | null;
  transmission: string | null;
  drivetrain: string | null;
  segment: Segment;
  cover: Photo | null;
  photos: readonly Photo[];
  description: string;
  sourceUrl: string;
  sourceImage: string | null;
  checkedAt: string;
  demoOnly: boolean;
  availability: "unverified" | "available" | "reserved" | "sold";
  reviewNotes: readonly string[];
  fuel?: string;
  engine?: string;
  version?: string;
  specs?: Readonly<Record<string, string>>;
  equipment?: readonly string[];
  highlights?: readonly string[];
  sourceImages?: readonly string[];
}

export type Sort = "featured" | "price-asc" | "price-desc" | "year-desc" | "mileage-asc";

export interface Search {
  q?: string;
  brand?: string;
  segment?: Segment;
  transmission?: string;
  traction?: string;
  minPriceCrc?: number;
  maxPriceCrc?: number;
  minYear?: number;
  maxYear?: number;
  sort?: Sort;
  demoIds?: readonly string[];
}

export interface JarcarVehicleRepository {
  vehicles(): Promise<readonly JarcarVehicle[]>;
  search(query: Search): Promise<readonly JarcarVehicle[]>;
  featured(): Promise<readonly JarcarVehicle[]>;
  detail(demoId: string): Promise<JarcarVehicle | null>;
  related(demoId: string): Promise<readonly JarcarVehicle[]>;
}

export const segmentNames: Record<Segment, string> = {
  pickup: "Pickup",
  suv: "SUV",
  hatchback: "Hatchback",
  electrico: "Eléctrico",
  sedan: "Sedán",
  clasico: "Clásico",
  comercial: "Comercial",
};

const numbers = new Intl.NumberFormat("es-CR");
const currencies = {
  CRC: new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 }),
  USD: new Intl.NumberFormat("es-CR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
};

export const budgetText = (value: number) => currencies.CRC.format(value);
export const priceText = (vehicle: JarcarVehicle) => currencies[vehicle.currency].format(vehicle.price);
export const nameOf = (vehicle: JarcarVehicle) => `${vehicle.brand} ${vehicle.model}`;
export const mileageText = (vehicle: JarcarVehicle) => vehicle.mileage
  ? `${numbers.format(vehicle.mileage.value)} ${vehicle.mileage.unit === "mi" ? "millas" : "km"}`
  : "Consultar";

export function mileageInKm(vehicle: JarcarVehicle) {
  if (!vehicle.mileage) return Infinity;
  return vehicle.mileage.value * (vehicle.mileage.unit === "mi" ? 1.609344 : 1);
}
