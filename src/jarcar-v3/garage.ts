import { createContext, useContext } from 'react';

export interface Garage {
  savedIds: readonly string[];
  compareIds: readonly string[];
  toggleSaved: (id: string) => void;
  toggleCompare: (id: string) => void;
  removeCompare: (id: string) => void;
  clearSaved: () => void;
}

export const GarageContext = createContext<Garage | null>(null);

export function useGarage() {
  const garage = useContext(GarageContext);
  if (!garage) throw new Error('GarageProvider is required.');
  return garage;
}
