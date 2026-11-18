import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ArrowUpRight, Command, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { nameOf, priceText, repository, segmentNames, type JarcarVehicle } from './data';
import { catalogPath, detailPath, savedPath, comparePath, routePath } from './paths';
import { Picture } from './ui';
import { readRecent } from './recent';
import { useGarage } from './state';

const EMPTY: readonly JarcarVehicle[] = [];
const normalize = (s: string) => s.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
export function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [active, setActive] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const { data: vehicles = EMPTY } = useQuery({ queryKey: ['jarcar-v4', 'inventory'], queryFn: () => repository.vehicles() });
  const { savedIds } = useGarage();
  const query = normalize(term.trim());
  const matches = useMemo(() => {
    if (!query) {
      const recent = readRecent();
      return [...vehicles].sort((a,b) => {
        const rA=recent.indexOf(a.demoId),rB=recent.indexOf(b.demoId);
        if(rA!==-1 || rB!==-1) return (rA===-1?100:rA)-(rB===-1?100:rB);
        return Number(savedIds.includes(b.demoId))-Number(savedIds.includes(a.demoId)) || b.year-a.year;
      }).slice(0,6);
    }
    const words = query.split(/\s+/).filter(Boolean);
    return vehicles.map(vehicle => ({ vehicle, string: normalize(`${nameOf(vehicle)} ${vehicle.year} ${segmentNames[vehicle.segment]} ${vehicle.brand}`) }))
      .filter(({ string }) => words.every(word => string.includes(word)))
      .sort((a,b) => Number(b.string.startsWith(query)) - Number(a.string.startsWith(query)) || b.vehicle.year - a.vehicle.year)
      .slice(0, 7).map(({ vehicle }) => vehicle);
  }, [vehicles, query, savedIds, open]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.matches('input,textarea,select,[contenteditable="true"]');
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpen(v => !v); }
      else if (event.key === '/' && !isTyping && !event.altKey && !event.ctrlKey && !event.metaKey && !open) { event.preventDefault(); setOpen(true); }
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [open]);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) { node.showModal(); window.requestAnimationFrame(() => search.current?.focus()); }
    if (!open && node.open) node.close();
    if (!open) { setTerm(''); setActive(0); }
  }, [open]);
  useEffect(() => { setActive(0); }, [query]);
  const close = () => setOpen(false);
  const visit = (url: string) => { close(); navigate(url); };
  const keyHandler = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive(v => (v + 1) % Math.max(1, matches.length)); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActive(v => (v + Math.max(1, matches.length) - 1) % Math.max(1, matches.length)); }
    if (event.key === 'Enter') { event.preventDefault(); visit(matches[active] ? detailPath(matches[active].demoId) : `${catalogPath}?q=${encodeURIComponent(term.trim())}`); }
  };
  return <>
    <button type="button" className="r10-search-trigger" ref={trigger} onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label="Buscar cualquier vehículo"><Search size={18} aria-hidden="true"/><span>Buscar</span><kbd>Ctrl K</kbd></button>
    <dialog ref={dialog} className="r10-search-dialog" aria-label="Buscar en Jarcar Motors" onClose={() => { setOpen(false); trigger.current?.focus(); }} onClick={event => { if (event.target === dialog.current) close(); }}>
      <div className="r10-search-box">
        <div className="r10-search-head"><span><Command size={17}/> BÚSQUEDA RÁPIDA</span><button type="button" onClick={close} aria-label="Cerrar búsqueda"><X size={22}/></button></div>
        <div className="r10-search-input"><Search size={25}/><input ref={search} type="search" role="combobox" aria-autocomplete="list" aria-controls="r10-search-list" aria-expanded={open} aria-activedescendant={matches[active] ? `r10-search-${matches[active].demoId}` : undefined} aria-label="Buscar por marca, modelo o año" value={term} onChange={e => setTerm(e.target.value)} onKeyDown={keyHandler} placeholder="Marca, modelo, año…"/><kbd>ESC</kbd></div>
        <div className="r10-search-result-head"><span>{term.trim() ? 'COINCIDENCIAS' : 'VISTOS, GUARDADOS Y DESTACADOS'}</span><span>{matches.length ? `${matches.length} opciones` : 'Sin coincidencias'}</span></div>
        <div className="r10-search-list" id="r10-search-list" role="listbox" aria-label="Resultados de búsqueda" aria-activedescendant={matches[active] ? `r10-search-${matches[active].demoId}` : undefined}>
          {matches.map((v,i) => <button type="button" key={v.demoId} id={`r10-search-${v.demoId}`} role="option" aria-selected={i===active} onMouseEnter={() => setActive(i)} onClick={() => visit(detailPath(v.demoId))}>
            <Picture photo={v.cover} sizes="78px" decorative/><span className="r10-search-result-info"><strong>{nameOf(v)}</strong><small>{v.year} · {segmentNames[v.segment]} · {priceText(v)}</small></span><ArrowUpRight size={19}/>
          </button>)}
          {!matches.length && <p className="r10-no-results">No encontramos ese modelo. Podés consultar el catálogo completo o probar otro nombre.</p>}
        </div>
        <div className="j16-palette-links" aria-label="Accesos rápidos">
          <button type="button" onClick={()=>visit(savedPath)}>Mi selección <ArrowUpRight size={16}/></button>
          <button type="button" onClick={()=>visit(comparePath)}>Comparador <ArrowUpRight size={16}/></button>
          <button type="button" onClick={()=>visit(routePath)}>Tu ruta <ArrowUpRight size={16}/></button>
        </div>
        <button className="r10-search-all" type="button" onClick={() => visit(`${catalogPath}${term.trim() ? `?q=${encodeURIComponent(term.trim())}` : ''}`)}>Explorar todo el inventario <ArrowRight size={18}/></button>
        <p className="r10-search-hint">Usá ↑ ↓ para elegir · Enter para abrir · Esc para cerrar</p>
      </div>
    </dialog>
  </>;
}
