import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronRight, Heart, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { mileageText, nameOf, priceText, repository, segmentNames, type JarcarVehicle } from './data';
import { catalogPath, comparePath, detailPath, routePath, visitPath } from './paths';
import { useGarage } from './state';
import { Picture } from './ui';
import { clearRecent, readRecent, recentChangeEvent } from './recent';
import './garage-r16.css';

const EMPTY: readonly JarcarVehicle[] = [];
type View = 'saved' | 'recent';

function VehicleTile({ vehicle, saved, compared, atLimit, onSave, onCompare }: {
  vehicle: JarcarVehicle; saved: boolean; compared: boolean; atLimit: boolean;
  onSave: () => void; onCompare: () => void;
}) {
  return <article className="j16-tile">
    <Link className="j16-tile-image" to={detailPath(vehicle.demoId)} aria-label={`Ver ${nameOf(vehicle)} ${vehicle.year}`}>
      <Picture photo={vehicle.cover} sizes="(max-width:650px) 100vw,(max-width:1050px) 48vw,33vw" decorative />
      <span className="j16-image-index">{vehicle.year} <i>·</i> {segmentNames[vehicle.segment]}</span>
      <span className="j16-image-arrow" aria-hidden="true"><ArrowUpRight size={22}/></span>
    </Link>
    <div className="j16-tile-content">
      <div className="j16-tile-name"><h3><Link to={detailPath(vehicle.demoId)}>{nameOf(vehicle)}</Link></h3><strong>{vehicle.price > 0 ? priceText(vehicle) : 'Consultar'}</strong></div>
      <p>{mileageText(vehicle)}{vehicle.transmission ? ` · ${vehicle.transmission}` : ''}</p>
      <div className="j16-tile-actions">
        <button type="button" aria-pressed={saved} onClick={onSave} className={saved ? 'selected' : ''}>
          <Heart size={17} fill={saved ? 'currentColor' : 'none'}/> {saved ? 'Guardado' : 'Guardar'}
        </button>
        <button type="button" aria-pressed={compared} disabled={!compared && atLimit} onClick={onCompare} title={!compared && atLimit ? 'Comparador lleno: máximo tres vehículos' : undefined}>
          {compared ? <Check size={17}/> : <Plus size={17}/>} {compared ? 'En comparación' : 'Comparar'}
        </button>
        <Link to={`${visitPath}?${new URLSearchParams({unidad:vehicle.demoId,motivo:'disponibilidad'})}#consulta`}>Consultar <ChevronRight size={17}/></Link>
      </div>
    </div>
  </article>;
}

export function SavedPage() {
  const { savedIds, compareIds, toggleSaved, toggleCompare, clearSaved } = useGarage();
  const { data: vehicles = EMPTY, isPending, isError, refetch } = useQuery({ queryKey: ['jarcar-v4','inventory'], queryFn: () => repository.vehicles() });
  const [recent, setRecent] = useState<string[]>(readRecent);
  const [view, setView] = useState<View>('saved');
  const [clearChoice, setClearChoice] = useState<'saved' | 'recent' | null>(null);
  const [copyStatus, setCopyStatus] = useState('');
  const [manualCopy, setManualCopy] = useState('');

  useEffect(() => {
    const refresh = () => setRecent(readRecent());
    window.addEventListener(recentChangeEvent, refresh);
    window.addEventListener('storage', refresh);
    return () => { window.removeEventListener(recentChangeEvent, refresh); window.removeEventListener('storage', refresh); };
  }, []);

  const saved = useMemo(() => savedIds.flatMap(id => vehicles.find(v => v.demoId === id) ?? []), [savedIds, vehicles]);
  const viewed = useMemo(() => recent.flatMap(id => vehicles.find(v => v.demoId === id) ?? []), [recent, vehicles]);
  const shown = view === 'saved' ? saved : viewed;
  const next = useMemo(() => vehicles.filter(v => !savedIds.includes(v.demoId)).slice(0, 3), [vehicles, savedIds]);
  const compareCurrent = compareIds.flatMap(id => vehicles.find(v=>v.demoId===id)??[]);
  const copyText = saved.length ? `Mis vehículos guardados en Jarcar Motors:\n${saved.map(v => `• ${nameOf(v)} (${v.year}) — ${priceText(v)}`).join('\n')}\nPrecios anunciados; confirmar con Jarcar.` : '';

  function clearSelection() {
    if (clearChoice === 'saved') clearSaved();
    else if (clearChoice === 'recent') { clearRecent(); setRecent([]); }
    setClearChoice(null);
  }
  async function copySelection() {
    setCopyStatus(''); setManualCopy('');
    try { await navigator.clipboard.writeText(copyText); setCopyStatus('Lista copiada. Podés compartirla por el medio que prefirás.'); }
    catch { setManualCopy(copyText); setCopyStatus('Copiá el texto del cuadro siguiente.'); }
  }
  return <div className="j16-garage">
    <header className="j16-garage-hero">
      <div className="ja-frame j16-garage-hero-inner">
        <div className="j16-garage-kicker"><span>JARCAR MOTORS</span><span>MI SELECCIÓN / PAVAS</span></div>
        <div className="j16-garage-hero-grid"><div><h1>Los que te<br/><em>mueven.</em></h1><p>Guardá lo que te gusta, retomá lo que viste y compará tus opciones en un mismo lugar.</p></div>
          <div className="j16-garage-metrics" aria-label="Tu actividad">
            <div><strong>{savedIds.length.toString().padStart(2,'0')}</strong><span>Guardados</span></div>
            <div><strong>{compareIds.length.toString().padStart(2,'0')} <small>/ 03</small></strong><span>En comparación</span></div>
            <div><strong>{recent.length.toString().padStart(2,'0')}</strong><span>Vistos recientemente</span></div>
          </div>
        </div>
        <div className="j16-garage-hero-foot"><span>Tu selección se conserva únicamente en este navegador.</span><Link to={catalogPath}>Volver al showroom <ArrowUpRight size={17}/></Link></div>
      </div>
    </header>

    <div className="ja-frame j16-garage-main">
      <div className="j16-garage-bar"><div role="group" aria-label="Ver vehículos por selección" className="j16-garage-tabs">
        <button type="button" aria-pressed={view === 'saved'} onClick={()=>{setView('saved');setClearChoice(null);}}>Guardados <span>{saved.length}</span></button>
        <button type="button" aria-pressed={view === 'recent'} onClick={()=>{setView('recent');setClearChoice(null);}}>Vistos recientemente <span>{viewed.length}</span></button>
      </div>
      <div className="j16-garage-bar-actions">
        {view === 'saved' && saved.length > 0 && <button type="button" onClick={()=>void copySelection()}><ArrowUpRight size={16}/> Compartir lista</button>}
        {shown.length > 0 && <button type="button" className="j16-clear" onClick={()=>setClearChoice(view)}><Trash2 size={15}/> Limpiar</button>}
      </div></div>
      {copyStatus && <p className="j16-copy-status" role="status"><CheckCircle2 size={17}/>{copyStatus}</p>}
      {manualCopy && <textarea className="j16-copy-fallback" readOnly value={manualCopy} onFocus={e=>e.target.select()} aria-label="Texto de vehículos guardados para copiar" />}
      {clearChoice && <div className="j16-clear-confirm" role="group" aria-label="Confirmar limpieza">
        <span>¿Querés borrar {clearChoice==='saved'?'todos los vehículos guardados':'el historial de vistos recientemente'}? Esta acción solo afecta este navegador.</span>
        <div><button type="button" onClick={()=>setClearChoice(null)}>Cancelar</button><button className="j16-confirm-danger" type="button" onClick={clearSelection}>Sí, borrar <X size={15}/></button></div>
      </div>}
      {isPending && <p className="j16-inline-message" role="status">Cargando tu selección…</p>}
      {isError && <div className="j16-inline-message"><p>No pudimos abrir el inventario local.</p><button type="button" onClick={()=>void refetch()}>Intentar de nuevo <ArrowRight size={16}/></button></div>}
      {!isPending && !isError && (shown.length ? <div className="j16-garage-grid">
        {shown.map(v => <VehicleTile key={v.demoId} vehicle={v} saved={savedIds.includes(v.demoId)} compared={compareIds.includes(v.demoId)} atLimit={compareIds.length>=3} onSave={()=>toggleSaved(v.demoId)} onCompare={()=>toggleCompare(v.demoId)}/>)}</div>
      : <section className="j16-garage-empty"><div><span className="j16-kicker">EL SIGUIENTE ENCUENTRO</span>
        <h2>{view === 'saved' ? <>Tu próxima selección<br/><em>empieza acá.</em></> : <>Cada recorrido<br/><em>deja una historia.</em></>}</h2>
        <p>{view==='saved'?'Todavía no guardaste vehículos. Explorá el inventario y tocá el corazón de tus favoritos.':'Cuando abras la ficha de un vehículo, aparecerá aquí para que puedas retomarla.'}</p>
        <Link to={catalogPath}>Explorar el inventario <ArrowUpRight size={18}/></Link></div>
        <div className="j16-garage-graphic" aria-hidden="true"><span>J.</span><small>ENCONTRÁ TU PRÓXIMO CAMINO.</small></div>
      </section>)}

      {compareCurrent.length > 0 && <section className="j16-comparison-dock" aria-label="Comparación actual"><div><span className="j16-kicker">ESTÁS COMPARANDO</span><h2>{compareCurrent.length} {compareCurrent.length===1?'vehículo':'vehículos'} <small>de 3 posibles</small></h2></div>
        <div className="j16-comparison-photos">{compareCurrent.map(v=><Link to={detailPath(v.demoId)} key={v.demoId} aria-label={`Ver ${nameOf(v)}`} title={nameOf(v)}><Picture photo={v.cover} sizes="80px" decorative/></Link>)}</div>
        <Link to={comparePath}>Abrir comparador <ArrowUpRight size={18}/></Link></section>}

      {!isPending && !isError && view === 'saved' && next.length>0 && <section className="j16-discovery"><header><div><span className="j16-kicker">SEGUÍ EXPLORANDO</span><h2>Tal vez el próximo<br/><em>sea este.</em></h2></div><Link to={routePath}>Descubrí tu ruta <ArrowUpRight size={17}/></Link></header>
        <div className="j16-discovery-grid">{next.map(v=><Link key={v.demoId} to={detailPath(v.demoId)}><Picture photo={v.cover} sizes="(max-width:650px) 95vw, 32vw" decorative/><span>{v.year} / {segmentNames[v.segment]}</span><strong>{nameOf(v)}</strong><small>{priceText(v)} <ArrowUpRight size={15}/></small></Link>)}</div>
      </section>}
      <div className="j16-garage-bottom"><Search size={19}/><p>¿Todavía no sabés qué carro buscar? Probá la exploración guiada.</p><Link to={routePath}>Empezar Tu ruta <ArrowRight size={17}/></Link></div>
    </div>
  </div>;
}
