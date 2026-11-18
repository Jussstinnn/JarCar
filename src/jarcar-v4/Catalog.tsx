import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronDown, ChevronLeft, ChevronRight, Columns2, Eye, Heart, Plus, Search, SlidersHorizontal, X, LayoutGrid, Rows3, Camera } from "lucide-react";
import { useEffect, useId, useRef, useState, type FocusEvent, type ReactNode, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { applySearch, budgetText, isSegment, mileageText, nameOf, priceText, repository, segmentNames, type JarcarVehicle } from "./data";
import { catalogPath, comparePath, detailPath, visitPath, routePath } from "./paths";
import { useGarage } from "./state";
import { Picture } from "./ui";
import { routePlans } from "./route-matcher";
import "./catalog.css";

const emptyInventory: readonly JarcarVehicle[] = [];
const defaultBudgets = [5_000_000, 8_000_000, 10_000_000, 12_000_000, 15_000_000, 20_000_000, 25_000_000, 35_000_000, 50_000_000];
const sorts = [
  ["featured", "Selección Jarcar"],
  ["price-asc", "Precio de menor a mayor"],
  ["price-desc", "Precio de mayor a menor"],
  ["year-desc", "Año más reciente"],
  ["mileage-asc", "Menor kilometraje"],
] as const;
const filterKeys = ["q", "marca", "tipo", "hasta", "anio", "caja", "traccion", "ruta"] as const;
const typeLabels: Record<JarcarVehicle["segment"], string> = {
  pickup: "Pickups", suv: "SUV", hatchback: "Hatchbacks", electrico: "Eléctricos", sedan: "Sedanes", clasico: "Clásicos", comercial: "Comerciales",
};

function positiveNumber(value: string | null) {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function options(values: readonly string[], current: string) {
  return [...new Set([...values, current].filter(Boolean))].sort((a, b) => a.localeCompare(b, "es-CR"));
}

function Select({ label, value, onChange, children, className = "" }: {
  label: string; value: string; onChange: (next: string) => void; children: ReactNode; className?: string;
}) {
  return <label className={`ja-c-select ${className}`}>
    <span>{label}</span>
    <span className="ja-c-select-control">
      <select value={value} onChange={(event) => onChange(event.target.value)}>{children}</select>
      <ChevronDown size={17} aria-hidden="true" />
    </span>
  </label>;
}

function StockCard({ item, from, saved, compared, compareFull, onSave, onCompare, onQuick, opening }: {
  item: JarcarVehicle; from: string; saved: boolean; compared: boolean; compareFull: boolean;
  onSave: () => void; onCompare: () => void; onQuick: () => void; opening: boolean;
}) {
  const title = nameOf(item);
  const count = item.photos.length;
  const [photoIndex, setPhotoIndex] = useState(0);
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const ignoreNextClick = useRef(false);
  const shownPhoto = count ? item.photos[photoIndex % count] : item.cover;
  const locationState = { from, back: from };
  return <article className={`ja-cc j13-vehicle ${opening ? "j13-vehicle-principal" : ""}`} data-compared={compared}>
    <div className="ja-cc-image-frame" onTouchStart={event => { ignoreNextClick.current = false; const finger = event.touches[0]; touchRef.current = finger ? { x: finger.clientX, y: finger.clientY } : null; }} onTouchEnd={event => {
      const start = touchRef.current;
      touchRef.current = null;
      const finger = event.changedTouches[0];
      if (!start || !finger || count < 2) return;
      const dx = finger.clientX - start.x, dy = finger.clientY - start.y;
      if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        ignoreNextClick.current = true;
        setPhotoIndex(index => (index + (dx < 0 ? 1 : -1) + count) % count);
      }
    }}>
      <Link to={detailPath(item.demoId)} state={locationState} className="ja-cc-image-link" aria-label={`Ver fotos de ${title}`} onClick={event => {if (ignoreNextClick.current) { event.preventDefault(); ignoreNextClick.current = false; }}}>
        <Picture key={shownPhoto?.id ?? item.demoId} photo={shownPhoto} decorative priority={opening} className="ja-cc-picture" sizes="(max-width: 520px) 94vw, (max-width: 920px) 48vw, 750px" />
        <span className="j13-photo-caption">JARCAR / {item.year}</span>
        {count > 0 && <span className="ja-cc-photo-count"><Camera size={14} aria-hidden="true" /> {photoIndex + 1} / {count}</span>}
      </Link>
      {count > 1 && <span className="j20-swipe-hint" aria-hidden="true">Deslizá para ver fotos <ArrowRight size={15}/></span>}
      <button type="button" className="r9-quick-open" onClick={onQuick} aria-label={`Vista rápida de ${title}`}><Eye size={17} aria-hidden="true"/> Vista rápida</button>
      {count > 1 && <div className="j13-card-photo-controls" role="group" aria-label={`Fotografías de ${title}`}>
        <button type="button" onClick={() => setPhotoIndex(value => (value - 1 + count) % count)} aria-label={`Fotografía anterior de ${title}`}><ChevronLeft size={17} /></button>
        <button type="button" onClick={() => setPhotoIndex(value => (value + 1) % count)} aria-label={`Fotografía siguiente de ${title}`}><ChevronRight size={17} /></button>
      </div>}
      <button type="button" className="ja-cc-save" aria-label={`Guardar ${title}`} aria-pressed={saved} onClick={onSave}>
        <Heart size={20} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
      </button>
    </div>
    <div className="ja-cc-info">
      <div className="ja-cc-index"><span>{segmentNames[item.segment]}</span><span>{item.year}</span></div>
      <h2><Link to={detailPath(item.demoId)} state={locationState}>{title}</Link></h2>
      <div className="ja-cc-details"><strong>{item.price > 0 ? priceText(item) : "Consultar precio"}</strong>

      </div>
      <div className="j13-card-meta"><span>{item.mileage ? mileageText(item) : 'Kilometraje por confirmar'}</span><span>{item.transmission || 'Transmisión por confirmar'}</span></div>
      <div className="ja-cc-actions">
        <button type="button" onClick={onCompare} aria-label={`Comparar ${title}`} aria-pressed={compared} disabled={!compared && compareFull}>
          {compared ? <Check size={17} aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}{compared ? "En comparación" : "Comparar"}
        </button>
        <Link to={detailPath(item.demoId)} state={locationState} aria-label={`Abrir ficha de ${title}`}>Ver ficha <ArrowUpRight size={17} aria-hidden="true" /></Link>
      </div>
    </div>
  </article>;
}


/** Browser-native modal: real image gallery, vehicle facts and commercial actions without a backend. */
function QuickLook({item,from,onClose}:{item:JarcarVehicle;from:string;onClose:()=>void}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [photoIndex,setPhotoIndex] = useState(0);
  const {savedIds,toggleSaved,compareIds,toggleCompare}=useGarage();
  const isSaved = savedIds.includes(item.demoId);
  const compared = compareIds.includes(item.demoId);
  const pictures = item.photos.length ? item.photos : item.cover ? [item.cover] : [];
  useEffect(()=>{
    const modal=dialog.current;
    if (modal && !modal.open) modal.showModal();
    return ()=>{ if(modal?.open)modal.close(); };
  },[]);
  const photo = pictures[photoIndex];
  const move = (by:number)=>{ if (pictures.length>1) setPhotoIndex(index=>(index+by+pictures.length)%pictures.length); };
  const onPhotoKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {event.preventDefault(); move(1);}
    if (event.key === 'ArrowLeft') {event.preventDefault(); move(-1);}
  };
  return <dialog ref={dialog} className="r9-quick-dialog" onClose={onClose} aria-labelledby="r9-quick-title" onClick={event=>{if(event.target===dialog.current)dialog.current?.close()}}>
    <div className="r9-quick-inner">
      <div className="r9-quick-photo" tabIndex={0} onKeyDown={onPhotoKey} aria-label="Fotografías: usá flechas izquierda y derecha">
        {photo ? <Picture key={photo.id} photo={photo} className="r9-quick-picture" sizes="(max-width:800px) 100vw, 65vw" eager /> : <Picture photo={null} sizes="60vw"/>}
        {pictures.length>1&&<div className="r9-quick-arrows"><button type="button" aria-label="Foto anterior" onClick={()=>move(-1)}><ChevronLeft size={21}/></button><span>{photoIndex+1} / {pictures.length}</span><button type="button" aria-label="Foto siguiente" onClick={()=>move(1)}><ChevronRight size={21}/></button></div>}
      </div>
      <div className="r9-quick-info"><div className="r9-quick-overline"><span>UN VISTAZO / JARCAR</span><button type="button" onClick={()=>dialog.current?.close()} aria-label="Cerrar vista rápida"><X size={23}/></button></div>
        <p className="r9-quick-sub">{item.year} / {segmentNames[item.segment]}</p><h2 id="r9-quick-title">{nameOf(item)}</h2><strong className="r9-quick-price">{item.price>0?priceText(item):'Consultar precio'}</strong>
        <dl className="r9-quick-facts"><div><dt>Recorrido</dt><dd>{item.mileage?mileageText(item):'Por confirmar'}</dd></div><div><dt>Caja</dt><dd>{item.transmission||'Por confirmar'}</dd></div><div><dt>Tracción</dt><dd>{item.drivetrain||'Por confirmar'}</dd></div></dl>
        <div className="r9-quick-actions"><Link to={`${visitPath}?${new URLSearchParams({unidad:item.demoId,motivo:'disponibilidad'})}#consulta`} onClick={()=>dialog.current?.close()}>Consultar este vehículo <ArrowUpRight size={18}/></Link><Link to={detailPath(item.demoId)} state={{from}} onClick={()=>dialog.current?.close()}>Ver ficha completa <ArrowUpRight size={19}/></Link><button type="button" aria-pressed={isSaved} onClick={()=>toggleSaved(item.demoId)}><Heart size={18} fill={isSaved?'currentColor':'none'}/> {isSaved?'Guardado':'Guardar'}</button><button type="button" aria-pressed={compared} disabled={!compared&&compareIds.length>=3} onClick={()=>toggleCompare(item.demoId)}><Plus size={18}/> {compared?'Comparando':'Comparar'}</button></div>
        <p className="r9-quick-footnote">Confirmá precio y disponibilidad directamente con Jarcar.</p>
      </div>
    </div>
  </dialog>;
}

export function Catalog() {
  const [params, setParams] = useSearchParams();
  const { pathname, search } = useLocation();
  const { savedIds, compareIds, toggleSaved, toggleCompare, removeCompare } = useGarage();
  const { data = emptyInventory, isPending, isError, refetch } = useQuery({ queryKey: ["jarcar-v4", "inventory"], queryFn: () => repository.vehicles() });
  const [showMore, setShowMore] = useState(false);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [quick, setQuick] = useState<JarcarVehicle | null>(null);
  const [viewMode, setViewMode] = useState<'editorial' | 'indice'>('editorial');
  const [visibleCount, setVisibleCount] = useState(12);

  const advancedId = useId();
  const tray = useRef<HTMLElement>(null);

  const favorites = params.get("favoritos") === "1";
  const query = params.get("q") ?? "";
  const brand = params.get("marca") ?? "";
  const typeValue = params.get("tipo") ?? "";
  const type = isSegment(typeValue) ? typeValue : undefined;
  const route = routePlans.find(entry => entry.id === params.get("ruta"));
  const budget = positiveNumber(params.get("hasta"));
  const year = positiveNumber(params.get("anio"));
  const transmission = params.get("caja") ?? "";
  const traction = params.get("traccion") ?? "";
  const sort = sorts.find(([id]) => id === params.get("orden"))?.[0] ?? "featured";
  const from = `${pathname}${search}`;

  const scopedData = data.filter(item => !route || (route.segments as readonly JarcarVehicle["segment"][]).includes(item.segment));
  const types = [...new Set(scopedData.map((item) => item.segment))];
  const brands = options(scopedData.map((item) => item.brand), brand);
  const transmissions = options(scopedData.flatMap((item) => item.transmission ?? []), transmission);
  const tractions = options(scopedData.flatMap((item) => item.drivetrain ?? []), traction);
  const years = [...new Set([...data.map((item) => item.year), ...(year ? [year] : [])])].sort((a, b) => b - a);
  const budgets = [...new Set([...defaultBudgets, ...(budget ? [budget] : [])])].sort((a, b) => a - b);
  const selection = compareIds.flatMap((id) => data.find((item) => item.demoId === id) ?? []);
  const results = applySearch(data, {
    q: query, brand, segment: type, maxPriceCrc: budget, minYear: year, transmission, traction, sort,
    demoIds: favorites ? savedIds : undefined,
  }).filter(item => !route || (route.segments as readonly JarcarVehicle["segment"][]).includes(item.segment));
  const filters: ReadonlyArray<readonly [(typeof filterKeys)[number], string]> = [
    ["q", query.trim()], ["marca", brand], ["tipo", type ? typeLabels[type] : ""],
    ["hasta", budget ? `Hasta ${budgetText(budget)}` : ""], ["anio", year ? `Desde ${year}` : ""],
    ["caja", transmission], ["traccion", traction], ["ruta", route ? `Tu ruta: ${route.label}` : ""],
  ];
  const activeFilters = filters.filter(([, label]) => label);
  const opening = false; // Las fichas del inventario tienen el mismo peso: sin hero ni tarjeta-banner.
  const advancedCount = [year, transmission, traction].filter(Boolean).length;
  useEffect(() => { setVisibleCount(12); }, [query, brand, typeValue, budget, year, transmission, traction, sort, favorites, route?.id]);
  const visibleResults = results.slice(0, visibleCount);
  const remaining = Math.max(results.length - visibleResults.length, 0);

  function change(key: string, value: string, replace = false) {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    }, { replace });
  }

  function reset() {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      filterKeys.forEach((key) => next.delete(key));
      return next;
    });
  }

  function revealControl(event: FocusEvent<HTMLDivElement>) {
    if (!tray.current || tray.current.contains(event.target)) return;
    const dock = tray.current.getBoundingClientRect();
    const target = event.target.getBoundingClientRect();
    if (target.bottom > dock.top - 10 && target.top < window.innerHeight && target.right > dock.left && target.left < dock.right) {
      window.scrollBy({ top: target.bottom - dock.top + 12, behavior: "instant" });
    }
  }

  return <div className="ja-catalog j13-catalog" data-j13="true" onFocusCapture={revealControl}>
    <div className="ja-frame ja-c-inner" id="j13-explorar">
      <header className="ja-c-heading">
        <div><span className="j13-section-label">{favorites ? 'TU SELECCIÓN' : 'JARCAR MOTORS / INVENTARIO'}</span>{favorites ? <h1>Tus guardados.</h1> : <h1>Inventario.</h1>}
          <p>{favorites ? "Volvé a los carros que te interesan y comparalos en un mismo lugar." : "Buscá por marca o modelo, filtrá por presupuesto y encontrá tu próximo vehículo."}</p>
        </div>
        {favorites && <Link to={catalogPath} className="ja-c-favorites">Ver inventario <ArrowUpRight size={17} aria-hidden="true" /></Link>}
      </header>

      <section className="ja-c-machine j20-search-machine" aria-label="Búsqueda y filtros">
        <div className="j20-filter-heading"><span>BUSCÁ A TU MANERA</span><button type="button" onClick={() => setMobileFilters(open => !open)} aria-expanded={mobileFilters} aria-controls="j20-filter-panel"><SlidersHorizontal size={18} /> {mobileFilters ? 'Ocultar filtros' : `Todos los filtros${activeFilters.length ? ` (${activeFilters.length})` : ''}`}</button></div>
        <div id="j20-filter-panel" className="j20-filter-panel" data-open={mobileFilters}>
        <div className="ja-c-filter-grid">
          <label className="ja-c-search">
            <span>Buscar por marca o modelo</span>
            <span className="ja-c-search-control"><Search size={20} aria-hidden="true" />
              <input type="search" value={query} placeholder="Ej. Hilux, Civic, Toyota" onChange={(event) => change("q", event.target.value, true)} />
            </span>
          </label>
          <Select label="Marca" value={brand} onChange={(value) => change("marca", value)}><option value="">Todas</option>
            {brands.map((value) => <option key={value}>{value}</option>)}
          </Select>
          <Select label="Presupuesto máximo" value={String(budget ?? "")} onChange={(value) => change("hasta", value)}><option value="">Sin límite</option>
            {budgets.map((value) => <option value={value} key={value}>{budgetText(value)}</option>)}
          </Select>
          <button type="button" className="ja-c-more" aria-expanded={showMore} aria-controls={advancedId} onClick={() => setShowMore((shown) => !shown)}>
            <SlidersHorizontal size={19} aria-hidden="true" /> Más filtros{advancedCount ? ` (${advancedCount})` : ""}
          </button>
        </div>
        <div className="ja-c-advanced" id={advancedId} hidden={!showMore}>
          <Select label="Año desde" value={String(year ?? "")} onChange={(value) => change("anio", value)}><option value="">Cualquier año</option>
            {years.map((value) => <option key={value} value={value}>{value}</option>)}
          </Select>
          <Select label="Transmisión" value={transmission} onChange={(value) => change("caja", value)}><option value="">Todas</option>
            {transmissions.map((value) => <option key={value}>{value}</option>)}
          </Select>
          <Select label="Tracción" value={traction} onChange={(value) => change("traccion", value)}><option value="">Todas</option>
            {tractions.map((value) => <option key={value}>{value}</option>)}
          </Select>
        </div>
        <button type="button" className="j20-filter-apply" onClick={() => setMobileFilters(false)}>Ver {results.length} {results.length === 1 ? 'vehículo' : 'vehículos'} <ArrowDown size={17}/></button>
        </div>
      </section>

      <div className="ja-c-types" role="group" aria-label="Tipo de vehículo">
        <button type="button" aria-pressed={!type} onClick={() => change("tipo", "")}>Todos</button>
        {types.map((value) => <button type="button" key={value} aria-pressed={type === value} onClick={() => change("tipo", type === value ? "" : value)}>{typeLabels[value]}</button>)}
      </div>

      <section className="ja-c-results" aria-label="Vehículos" aria-busy={isPending}>
        <div className="ja-c-resultbar">
          <p role="status">{isPending ? "Cargando vehículos…" : isError ? "Inventario pendiente de cargar" : <><strong>{results.length}</strong> {results.length === 1 ? "vehículo" : "vehículos"}</>}</p>
          <div className="j13-result-tools">
            <div className="j13-view-switch" role="group" aria-label="Modo de explorar vehículos">
              <button type="button" aria-pressed={viewMode === 'editorial'} onClick={() => setViewMode('editorial')} title="Galería fotográfica"><LayoutGrid size={17} /><span>Galería</span></button>
              <button type="button" aria-pressed={viewMode === 'indice'} onClick={() => setViewMode('indice')} title="Lista compacta"><Rows3 size={17} /><span>Índice</span></button>
            </div>
            <Select label="Ordenar por" value={sort} onChange={(value) => change("orden", value === "featured" ? "" : value)} className="ja-c-sort">
              {sorts.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </Select>
          </div>
        </div>
        {activeFilters.length > 0 && <div className="ja-c-applied" aria-label="Filtros activos">
          {activeFilters.map(([key, label]) => <button key={key} type="button" onClick={() => change(key, "")} aria-label={`Quitar filtro ${label}`}>{label}<X size={14} aria-hidden="true" /></button>)}
          <button type="button" className="ja-c-reset" onClick={reset}>Limpiar filtros</button>
        </div>}
        {isError ? <div className="ja-c-empty"><h2>El inventario no cargó.</h2><button type="button" className="ja-button" onClick={() => void refetch()}>Volver a intentar</button></div>
          : !isPending && !results.length ? <div className="ja-c-empty">
            <h2>{favorites && !savedIds.length ? "Todavía no guardaste carros." : "No encontramos carros con esos filtros."}</h2>
            <p>{favorites && !savedIds.length ? "Usá el corazón en un anuncio para tenerlo a mano." : "Probá con otra marca o ampliá tu presupuesto."}</p>
            {favorites && !savedIds.length ? <Link className="ja-button" to={catalogPath}>Ver inventario <ArrowUpRight size={17} aria-hidden="true" /></Link> : <button type="button" className="ja-button" onClick={reset}>Limpiar filtros</button>}
          </div> : <div className="ja-c-grid j13-products" data-opening="false" data-view={viewMode}>
            {visibleResults.map((item) => <StockCard key={item.demoId} item={item} from={from} opening={opening}
                saved={savedIds.includes(item.demoId)} compared={compareIds.includes(item.demoId)} compareFull={compareIds.length >= 3}
                onSave={() => toggleSaved(item.demoId)} onCompare={() => toggleCompare(item.demoId)} onQuick={() => setQuick(item)} />)}
          </div>}
        {remaining > 0 && !isError && <div className="j13-load-more"><span>{visibleResults.length} de {results.length} vehículos</span><button type="button" onClick={() => setVisibleCount(n => n + 12)}>Ver más vehículos <ArrowDown size={19} /></button></div>}
        {results.length > 0 && <p className="ja-c-notice">Precios anunciados. Confirmá la disponibilidad con Jarcar Motors.</p>}
      </section>
    </div>

    {quick && <QuickLook key={quick.demoId} item={quick} from={from} onClose={() => setQuick(null)}/>}
    {selection.length > 0 && <aside className="ja-c-tray" ref={tray} aria-label="Selección del comparador">
      <div className="ja-c-tray-state"><Columns2 size={21} aria-hidden="true" /><span><strong>Comparador</strong><small>{selection.length} de 3 vehículos</small></span></div>
      <ul>{selection.map((item) => <li key={item.demoId}>
        <button onClick={() => removeCompare(item.demoId)} type="button" aria-label={`Quitar ${nameOf(item)} de comparación`}>
          <Picture photo={item.cover} sizes="64px" decorative /><X size={14} aria-hidden="true" />
        </button>
      </li>)}</ul>
      <Link to={comparePath} state={{ from }} className="ja-button ja-button-accent">{selection.length > 1 ? "Comparar" : "Ver selección"} <ArrowRight size={17} aria-hidden="true" /></Link>
    </aside>}
  </div>;
}

import './r7.css';
import './r9.css';

import "./r13-catalog.css";
import "./r20-mobile-showroom.css";
import './r23-catalog.css';
