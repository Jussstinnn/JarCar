import { useEffect, useReducer, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ArrowUpRight } from 'lucide-react';
import { GarageContext, type Garage } from './garage';

const storageKey = 'jarcar-platform:garage:v1';
type State = Pick<Garage, 'savedIds' | 'compareIds'> & { notice: string };
type Action = { type: 'saved' | 'compare' | 'remove'; id: string } | { type: 'clearSaved' | 'dismissNotice' };

function clean(ids: unknown, limit: number): string[] {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.filter((id): id is string => typeof id === 'string' && /^[a-z0-9-]{1,100}$/.test(id)))].slice(0, limit);
}

function read(): State {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) ?? '{}');
    return { savedIds: clean(value?.savedIds, 100), compareIds: clean(value?.compareIds, 3), notice: '' };
  } catch {
    return { savedIds: [], compareIds: [], notice: '' };
  }
}

function reduce(state: State, action: Action): State {
  if (action.type === 'dismissNotice') return { ...state, notice: '' };
  if (action.type === 'clearSaved') return { ...state, savedIds: [], notice: 'Se vació la selección de guardados.' };
  const { type, id } = action;
  if (type === 'saved') {
    const selected = state.savedIds.includes(id);
    return { ...state, savedIds: selected ? state.savedIds.filter((value) => value !== id) : [...state.savedIds, id], notice: selected ? 'Vehículo quitado de guardados.' : 'Vehículo guardado.' };
  }
  const selected = state.compareIds.includes(id);
  if (type === 'remove' || selected) {
    return { ...state, compareIds: state.compareIds.filter((value) => value !== id), notice: 'Vehículo quitado del comparador.' };
  }
  if (state.compareIds.length >= 3) return { ...state, notice: 'El comparador admite hasta tres vehículos.' };
  return { ...state, compareIds: [...state.compareIds, id], notice: 'Vehículo agregado al comparador.' };
}

export function GarageProvider({ children }: { children: ReactNode }) {
  const [{ savedIds, compareIds, notice }, dispatch] = useReducer(reduce, undefined, read);
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify({ savedIds, compareIds })); } catch { /* In-memory state remains usable. */ }
  }, [savedIds, compareIds]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => dispatch({ type: 'dismissNotice' }), 4200);
    return () => window.clearTimeout(timer);
  }, [notice, savedIds, compareIds]);

  const destination = /comparador|comparación/i.test(notice) ? '/jarcar/comparar' : '/jarcar/guardados';
  return <GarageContext.Provider value={{
    savedIds,
    compareIds,
    toggleSaved: (id) => dispatch({ type: 'saved', id }),
    toggleCompare: (id) => dispatch({ type: 'compare', id }),
    removeCompare: (id) => dispatch({ type: 'remove', id }),
    clearSaved: () => dispatch({ type: 'clearSaved' }),
  }}>
    {children}
    <div className="jp-sr" role="status" aria-live="polite">{notice}</div>
    {notice && <div key={`${notice}:${savedIds.join('|')}:${compareIds.join('|')}`} className="j18-feedback" role="group" aria-label="Confirmación de selección">
      <span className="j18-feedback-symbol"><Check size={17} aria-hidden="true"/></span>
      <span className="j18-feedback-label">{notice}</span>
      <Link to={destination}>Ver selección <ArrowUpRight size={15} aria-hidden="true"/></Link>
      <button type="button" onClick={() => dispatch({ type: 'dismissNotice' })} aria-label="Cerrar confirmación"><X size={17}/></button>
    </div>}
  </GarageContext.Provider>;
}
