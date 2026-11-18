import { useQuery } from '@tanstack/react-query';
import {
  ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, BriefcaseBusiness, CarFront,
  Check, ChevronLeft, ChevronRight, Compass, Heart, RotateCcw, Share2, SlidersHorizontal,
  Sparkles, UsersRound, X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { budgetText, mileageText, nameOf, priceText, repository, segmentNames, type JarcarVehicle } from './data';
import { catalogPath, comparePath, detailPath } from './paths';
import { useGarage } from './state';
import { Picture } from './ui';
import { getRouteResults, routeBudgets, routePlans, type RoutePlan } from './route-matcher';
import './route-finder.css';
import './route-r15.css';

const empty: readonly JarcarVehicle[] = [];
const icons = [CarFront, UsersRound, Compass, BriefcaseBusiness, Sparkles] as const;
type Order = 'seleccion' | 'precio' | 'recientes';
const validOrder = (value: string | null): Order => value === 'precio' || value === 'recientes' ? value : 'seleccion';
const validPlan = (value: string | null): RoutePlan => routePlans.find(entry => entry.id === value)?.id ?? 'espacio';
const validBudget = (value: string | null) => value && /^\d+$/.test(value) && Number(value) <= 50_000_000 && Number(value) % 1_000_000 === 0 ? Number(value) : 0;
const budgetLabel = (value: number) => value ? `Hasta ${budgetText(value)}` : 'Sin límite de precio';
const formattedCount = (value: number) => String(value).padStart(2, '0');

function sortMatches(vehicles: readonly JarcarVehicle[], order: Order) {
  if (order === 'precio') return [...vehicles].sort((a, b) => a.price - b.price || b.year - a.year);
  if (order === 'recientes') return [...vehicles].sort((a, b) => b.year - a.year || a.price - b.price);
  return [...vehicles];
}

function ResultCard({ vehicle, number, isAlternative }: { vehicle: JarcarVehicle; number: number; isAlternative: boolean }) {
  const { savedIds, compareIds, toggleSaved, toggleCompare } = useGarage();
  const saved = savedIds.includes(vehicle.demoId);
  const compared = compareIds.includes(vehicle.demoId);
  const compareFull = compareIds.length >= 3;
  return <article className="r15-result-card">
    <Link className="r15-result-image" to={detailPath(vehicle.demoId)} aria-label={`Abrir ficha de ${nameOf(vehicle)}`}>
      <Picture photo={vehicle.cover} sizes="(max-width: 640px) 92vw, (max-width: 1160px) 46vw, 30vw" decorative />
      <span className="r15-image-counter">{formattedCount(number)} / JARCAR</span>
      <span className="r15-image-arrow" aria-hidden="true"><ArrowUpRight size={21}/></span>
    </Link>
    <div className="r15-result-info">
      <div className="r15-result-kicker"><span>{segmentNames[vehicle.segment]} · {vehicle.year}</span><span>{isAlternative ? 'Fuera de presupuesto' : 'Dentro de tus criterios'}</span></div>
      <Link to={detailPath(vehicle.demoId)} className="r15-result-title">{nameOf(vehicle)}</Link>
      <div className="r15-result-meta"><strong>{priceText(vehicle)}</strong><span>{mileageText(vehicle)}{vehicle.transmission ? ` · ${vehicle.transmission}` : ''}</span></div>
      <p className="r15-result-why">{isAlternative
        ? 'Coincide con el tipo elegido, pero supera tu presupuesto.'
        : 'Coincide con el tipo de vehículo y el presupuesto seleccionados.'}</p>
      <div className="r15-result-actions">
        <button type="button" aria-pressed={saved} onClick={() => toggleSaved(vehicle.demoId)}><Heart size={17} fill={saved ? 'currentColor' : 'none'}/>{saved ? 'Guardado' : 'Guardar'}</button>
        <button type="button" aria-pressed={compared} disabled={!compared && compareFull} onClick={() => toggleCompare(vehicle.demoId)}><SlidersHorizontal size={17}/>{compared ? 'Comparando' : compareFull ? 'Máximo 3' : 'Comparar'}</button>
        <Link to={detailPath(vehicle.demoId)}>Ver ficha <ArrowUpRight size={16}/></Link>
      </div>
    </div>
  </article>;
}

export function RouteFinder() {
  const [params, setParams] = useSearchParams();
  const { data = empty, isPending, isError, refetch } = useQuery({ queryKey: ['jarcar-v4', 'inventory'], queryFn: () => repository.vehicles() });
  const { compareIds } = useGarage();
  const plan = validPlan(params.get('ruta'));
  const budget = validBudget(params.get('hasta'));
  const order = validOrder(params.get('orden'));
  const [step, setStep] = useState(() => params.has('ruta') ? 2 : 0);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(6);
  const [message, setMessage] = useState('');
  const stageRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const match = useMemo(() => getRouteResults(data, plan, budget), [data, plan, budget]);
  const candidates = useMemo(() => sortMatches(match.exact ? match.matching : match.alternatives, order), [match, order]);
  const current = candidates.length ? candidates[previewIndex % candidates.length] : undefined;
  const shown = candidates.slice(0, visibleCount);
  const activePlan = routePlans.find(value => value.id === plan) ?? routePlans[0];
  const availableSegments = activePlan.segments.map(segment => segmentNames[segment]).join(' · ');
  const catalogQuery = new URLSearchParams({ ruta: plan });
  if (budget) catalogQuery.set('hasta', String(budget));
  if (order === 'precio') catalogQuery.set('orden', 'price-asc');
  if (order === 'recientes') catalogQuery.set('orden', 'year-desc');
  const catalogUrl = `${catalogPath}?${catalogQuery.toString()}`;
  const noMatchCatalogUrl = match.alternatives.length ? `${catalogPath}?ruta=${encodeURIComponent(plan)}` : catalogPath;

  useEffect(() => { setPreviewIndex(0); setVisibleCount(6); }, [plan, budget, order]);

  function update(changes: Record<string, string | null>) {
    setParams(previous => {
      const next = new URLSearchParams(previous);
      for (const [key, value] of Object.entries(changes)) if (value === null) next.delete(key); else next.set(key, value);
      return next;
    }, { replace: true, preventScrollReset: true });
    setMessage('');
  }

  function goTo(next: number) {
    setStep(next);
    const target = stageRef.current;
    requestAnimationFrame(() => target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }));
  }

  function restart() {
    setParams(new URLSearchParams(), { replace: true, preventScrollReset: true });
    setStep(0); setVisibleCount(6); setPreviewIndex(0); setMessage('');
    requestAnimationFrame(() => stageRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' }));
  }

  async function share() {
    const url = new URL(window.location.href);
    url.searchParams.set('ruta', plan);
    if (budget) url.searchParams.set('hasta', String(budget)); else url.searchParams.delete('hasta');
    if (order !== 'seleccion') url.searchParams.set('orden', order); else url.searchParams.delete('orden');
    const local = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
    const content = local
      ? `Mi selección en Jarcar Motors: ${activePlan.label}. ${budgetLabel(budget)}. Tipos: ${availableSegments}. (El enlace estará disponible cuando se publique la web.)`
      : url.toString();
    try { await navigator.clipboard.writeText(content); setMessage(local ? 'Criterios copiados. Los enlaces locales no funcionan en otros dispositivos.' : 'Enlace a esta selección copiado.'); }
    catch { setMessage('No se pudo copiar automáticamente. Podés copiar la dirección desde tu navegador.'); }
  }

  return <div className="jr-experience r15-route">
    <div className="jr-topline"><Link to={catalogPath}><ArrowLeft size={17}/> Volver al inventario</Link><span>JARCAR MOTORS / TU RUTA</span></div>
    <section className="r15-introduction">
      <div className="r15-intro-caption"><span className="r15-dot"/>TU PRÓXIMO CARRO EMPIEZA POR VOS</div>
      <div className="r15-intro-layout"><h1>ENCONTRÁ<br/>TU <em>CAMINO.</em></h1><div><span className="r15-doodle" aria-hidden="true">↗</span><p>No necesitás saber exactamente qué modelo querés. Empezá por cómo pensás usarlo y explorá las opciones del inventario.</p><a href="#r15-explorar">Empezar a explorar <ArrowDownRight size={18}/></a></div></div>
      <div className="r15-intro-foot"><span>UN RECORRIDO. TUS CRITERIOS. VEHÍCULOS REALES.</span><span>01 / 03</span></div>
    </section>

    <div className="r15-stepper" id="r15-explorar" aria-label="Etapas de búsqueda">
      {(['Cómo lo usarías', 'Tu presupuesto', 'Vehículos para vos'] as const).map((name, index) => <button key={name} type="button" className={step === index ? 'r15-step-active' : ''} aria-current={step === index ? 'step' : undefined} onClick={() => goTo(index)}><span>0{index + 1}</span>{name}<span className="r15-step-line"/></button>)}
      <button type="button" className="r15-restart" onClick={restart}><RotateCcw size={16}/> Reiniciar</button>
    </div>

    <div ref={stageRef} className="r15-stage">
      <section className="r15-stage-controls" aria-label="Configurá tu búsqueda">
        <div className="r15-stage-heading"><span>RECORRIDO / 0{step + 1} DE 03</span><span className="r15-stage-count" role="status" aria-live="polite">{formattedCount(match.total)} coincidencias</span></div>
        {step === 0 && <div className="r15-panel" key="usage">
          <p className="r15-panel-number">01 / EL PUNTO DE PARTIDA</p>
          <h2>¿QUÉ TE<br/><em>MUEVE?</em></h2>
          <p className="r15-panel-intro">Elegí el tipo de plan que más se acerca a lo que buscás. Podés cambiarlo en cualquier momento.</p>
          <div className="r15-intents" role="group" aria-label="Uso del vehículo">
            {routePlans.map((choice, index) => { const Icon = icons[index]; return <button type="button" key={choice.id} aria-pressed={plan === choice.id} onClick={() => update({ ruta: choice.id })}>
              <span className="r15-intent-icon"><Icon size={22} strokeWidth={1.7}/></span><span className="r15-intent-label"><strong>{choice.label}</strong><small>{choice.line}</small></span><span className="r15-intent-check">{plan === choice.id ? <Check size={21}/> : <ArrowUpRight size={18}/>}</span>
            </button>; })}
          </div>
          <div className="r15-control-footer"><span>Tipos relacionados: {availableSegments}</span><button type="button" onClick={() => goTo(1)}>Definir presupuesto <ArrowRight size={19}/></button></div>
        </div>}
        {step === 1 && <div className="r15-panel" key="budget">
          <p className="r15-panel-number">02 / EN COLONES</p><h2>¿HASTA<br/><em>CUÁNTO?</em></h2>
          <p className="r15-panel-intro">Mostramos únicamente anuncios con precio publicado en colones. Si querés, podés explorar sin límite.</p>
          <div className="r15-budget-screen"><span>PRESUPUESTO SELECCIONADO</span><strong>{budget ? budgetText(budget) : 'Sin límite'}</strong><small>{budget ? 'Precio máximo del anuncio' : 'Todas las opciones de esta ruta'}</small></div>
          <label className="r15-range-label" htmlFor="r15-budget-slider">Ajustá tu presupuesto</label>
          <input id="r15-budget-slider" className="r15-budget-range" type="range" min="0" max="50000000" step="1000000" value={budget} onChange={event => update({ hasta: event.target.value === '0' ? null : event.target.value })} aria-valuetext={budgetLabel(budget)} style={{ '--r15-fill': `${budget / 500000}%` } as CSSProperties}/>
          <div className="r15-range-endpoints"><span>Sin límite</span><span>₡50 millones</span></div>
          <div className="r15-budget-presets" role="group" aria-label="Presupuestos rápidos">{routeBudgets.map(value => <button type="button" key={value} aria-pressed={budget === value} onClick={() => update({ hasta: value ? String(value) : null })}>{value === 0 ? 'Sin límite' : `₡${value / 1_000_000} M`}</button>)}</div>
          <div className="r15-control-footer"><button type="button" className="r15-back" onClick={() => goTo(0)}><ArrowLeft size={18}/> Volver</button><button type="button" onClick={() => goTo(2)}>Ver mis opciones <ArrowRight size={19}/></button></div>
        </div>}
        {step === 2 && <div className="r15-panel" key="summary">
          <p className="r15-panel-number">03 / TU SELECCIÓN</p><h2>ESTO VA<br/><em>CON VOS.</em></h2>
          <p className="r15-panel-intro">Estos resultados se obtienen por tipo de carrocería y precio anunciado, no por una evaluación mecánica o personalizada.</p>
          <dl className="r15-summary-list"><div><dt>Tu plan</dt><dd>{activePlan.label}</dd></div><div><dt>Carrocerías incluidas</dt><dd>{availableSegments}</dd></div><div><dt>Tu presupuesto</dt><dd>{budgetLabel(budget)}</dd></div><div><dt>Coincidencias</dt><dd>{match.total} {match.total === 1 ? 'vehículo' : 'vehículos'}</dd></div></dl>
          <div className="r15-control-footer"><button type="button" className="r15-back" onClick={() => goTo(1)}><ArrowLeft size={18}/> Ajustar</button><a href="#r15-resultados" onClick={event => { event.preventDefault(); resultsRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }}>Explorar resultados <ArrowRight size={19}/></a></div>
        </div>}
      </section>
      <aside className="r15-stage-visual" aria-label="Vehículo de la selección">
        {current?.cover ? <Picture photo={current.cover} key={current.demoId} className="r15-hero-picture" sizes="(max-width: 920px) 100vw, 54vw" priority/> : <div className="r15-no-car"><SlidersHorizontal size={40}/><span>No hay vehículos con esa selección.</span></div>}
        <div className="r15-visual-wash"/>
        <div className="r15-visual-top"><span>JARCAR / SELECTOR DE RUTA</span><span>{formattedCount(previewIndex % Math.max(candidates.length, 1) + 1)} / {formattedCount(Math.max(candidates.length, 1))}</span></div>
        <span className="r15-visual-word" aria-hidden="true">EN MOVIMIENTO.</span>
        {current && <div className="r15-visual-bottom"><div><span className="r15-visual-eyebrow">{match.exact ? 'COINCIDE CON TU SELECCIÓN' : 'ALTERNATIVA FUERA DE PRESUPUESTO'}</span><h3>{nameOf(current)}</h3><p>{current.year} · {priceText(current)}</p></div><Link to={detailPath(current.demoId)} aria-label={`Ver ficha de ${nameOf(current)}`}><ArrowUpRight size={23}/></Link></div>}
        {candidates.length > 1 && <div className="r15-visual-arrows"><button type="button" aria-label="Vehículo anterior" onClick={() => setPreviewIndex(index => (index - 1 + candidates.length) % candidates.length)}><ChevronLeft size={18}/></button><button type="button" aria-label="Vehículo siguiente" onClick={() => setPreviewIndex(index => (index + 1) % candidates.length)}><ChevronRight size={18}/></button></div>}
      </aside>
    </div>

    <section className="r15-outcome" id="r15-resultados" ref={resultsRef} aria-labelledby="r15-results-title">
      <div className="r15-outcome-kicker"><span>JARCAR / TU RUTA</span><span>EL SIGUIENTE MOVIMIENTO</span></div>
      <div className="r15-outcome-heading"><div><span>03 / LA SELECCIÓN</span><h2 id="r15-results-title">{isPending ? <>EN <em>PROCESO.</em></> : match.exact ? <>EN TU <em>RADAR.</em></> : <>OTROS <em>CAMINOS.</em></>}</h2></div><div className="r15-outcome-counter"><strong>{formattedCount(match.total)}</strong><span>{match.exact ? 'vehículos cumplen tus criterios' : 'coincidencias dentro de esos criterios'}</span></div></div>
      <div className="r15-results-tools"><p>{activePlan.label} <span> / </span> {budgetLabel(budget)} </p><div><label htmlFor="r15-order">Ordenar</label><select id="r15-order" value={order} onChange={event => update({ orden: event.target.value === 'seleccion' ? null : event.target.value })}><option value="seleccion">Selección Jarcar</option><option value="precio">Menor precio</option><option value="recientes">Más recientes</option></select></div></div>
      {isError ? <div className="r15-empty"><h3>No se pudo cargar el inventario.</h3><button type="button" onClick={() => void refetch()}>Volver a intentar <ArrowRight size={17}/></button></div> : isPending ? <p className="r15-loading" role="status">Buscando vehículos del catálogo…</p> : <>
        {!match.exact && <div className="r15-warning"><X size={21}/><p>El catálogo no tiene coincidencias dentro de esos criterios. {budget ? 'Las opciones siguientes pertenecen a las carrocerías elegidas, pero superan el presupuesto.' : 'Probá otro tipo de vehículo.'}</p></div>}
        {shown.length > 0 ? <div className="r15-results-grid">{shown.map((vehicle, index) => <ResultCard key={vehicle.demoId} vehicle={vehicle} number={index + 1} isAlternative={!match.exact}/>)}</div> : <div className="r15-empty"><h3>Otro plan. Otras posibilidades.</h3><p>No hay vehículos del tipo seleccionado con precios publicados. Probá otra opción o explorá el inventario completo.</p><button type="button" onClick={restart}>Cambiar mi selección <RotateCcw size={18}/></button></div>}
        {candidates.length > visibleCount && <button className="r15-more" type="button" onClick={() => setVisibleCount(count => count + 6)}>Ver más opciones <span>{visibleCount} de {candidates.length}</span><ArrowRight size={19}/></button>}
      </>}
      <div className="r15-outro"><div><span>EL PRÓXIMO PASO</span><h3>DEL INTERÉS<br/>A LA <em>DECISIÓN.</em></h3><p>Podés guardar vehículos, compararlos o continuar en el inventario con estos filtros aplicados.</p></div><div className="r15-outro-actions"><Link to={match.exact ? catalogUrl : noMatchCatalogUrl}>{match.exact ? `Abrir ${match.total} opciones` : match.alternatives.length ? 'Ver este tipo sin límite de precio' : 'Explorar inventario completo'} <ArrowUpRight size={19}/></Link>{compareIds.length > 0 && <Link to={comparePath}>Mi comparación ({compareIds.length}) <ArrowRight size={18}/></Link>}<button type="button" onClick={() => void share()}><Share2 size={17}/> Compartir criterios</button>{message && <span role="status">{message}</span>}</div></div>
      <p className="r15-legal">Criterios basados únicamente en tipo de vehículo, precio y orden de resultados. El precio y la disponibilidad deben confirmarse directamente con Jarcar Motors.</p>
    </section>
  </div>;
}
