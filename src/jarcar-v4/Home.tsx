import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, Heart, MapPin, MoveUpRight, Search } from 'lucide-react';
import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { budgetText, nameOf, priceText, repository, segmentNames, type JarcarVehicle, type Segment } from './data';
import { catalogPath, comparePath, detailPath, visitPath, routePath, aboutPath } from './paths';
import { useGarage } from './state';
import { Picture } from './ui';
import { GoogleMap } from './GoogleMap';
import { RecentlyViewed } from './RecentlyViewed';
import { getRouteResults, routePlans, type RoutePlan } from './route-matcher';
import { jarcar } from './business';
import './r12-home.css';
import './r24-home-mobile.css';

const heroIds = ['ford-f150-raptor-2019', 'mini-aceman-s-2025', 'toyota-cressida-1984', 'toyota-bz5-2025'];
const galleryIds = ['chevrolet-colorado-ltz-2024', 'tesla-model-3-2021', 'volkswagen-escarabajo-super-beetle-1975', 'bmw-325i-2012'];
const categoryConcepts: ReadonlyArray<{ segment: Segment; title: string; micro: string; featuredId: string }> = [
  { segment: 'pickup', title: 'Para ir más lejos.', micro: 'POTENCIA & VERSATILIDAD', featuredId: 'toyota-hilux-2021' },
  { segment: 'suv', title: 'Espacio para tus planes.', micro: 'COMODIDAD & AVENTURA', featuredId: 'jeep-wrangler-sahara-2010' },
  { segment: 'sedan', title: 'La ciudad es tuya.', micro: 'RITMO & EQUILIBRIO', featuredId: 'hyundai-accent-gl-2015' },
  { segment: 'electrico', title: 'Otra forma de avanzar.', micro: 'MOVILIDAD ELÉCTRICA', featuredId: 'toyota-bz3-2025' },
  { segment: 'clasico', title: 'El carácter no pasa.', micro: 'HISTORIAS SOBRE RUEDAS', featuredId: 'volkswagen-escarabajo-super-beetle-1975' },
];
const findById = (vehicles: readonly JarcarVehicle[], id: string) => vehicles.find(vehicle => vehicle.demoId === id);
const priced = (vehicle: JarcarVehicle) => vehicle.price > 0 ? priceText(vehicle) : 'Consultar precio';

function CountUp({ number, suffix = '' }: { number: number; suffix?: string }) {
  const [display, setDisplay] = useState(number);
  useEffect(() => {
    if (!number || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setDisplay(number); return; }
    let frame = 0;
    const start = performance.now();
    const animate = (time: number) => {
      const progress = Math.min(1, (time - start) / 1000);
      setDisplay(Math.round(number * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [number]);
  return <span className="j12-counter" data-value={number} aria-label={`${number}${suffix}`}><span aria-hidden="true">{display}{suffix}</span></span>;
}

function Hero({ vehicles }: { vehicles: readonly JarcarVehicle[] }) {
  const scenes = heroIds.flatMap(id => findById(vehicles, id) ?? []);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 700px)');
    const onChange = () => setIsMobile(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);
  const count = scenes.length;
  const current = scenes[active % Math.max(count, 1)];
  const change = (step: number) => { if (count) setActive(index => (index + step + count) % count); };

  useEffect(() => {
    if (count <= 1 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setActive(index => (index + 1) % count), 6200);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  function keys(e: KeyboardEvent<HTMLDivElement>) {
    if (e.target instanceof HTMLButtonElement && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      e.preventDefault();
      change(e.key === 'ArrowRight' ? 1 : -1);
    }
  }

  return <section className="j12-hero" aria-label="Jarcar Motors: encontrá tu próximo carro">
    {isMobile && <div className="j24-mobile-hero">
      <div className="j24-mobile-hero-visual">
        {current && <div className="j24-mobile-hero-photo" key={current.demoId}>
          <Picture photo={current.cover} className="j24-mobile-photo" sizes="(max-width: 700px) 100vw, 700px" priority eager />
        </div>}
        <div className="j24-mobile-hero-overlay" aria-hidden="true" />
        <div className="j24-mobile-hero-top"><span className="j24-mobile-dot" aria-hidden="true" /> JARCAR MOTORS <span className="j24-mobile-location">PAVAS / SAN JOSÉ</span></div>
        <div className="j24-mobile-hero-message">
          <span className="j24-mobile-hero-kicker">ENCONTRÁ TU PRÓXIMO CARRO</span>
          <h1>Hay uno<br/><em>para vos.</em></h1>
          <p>Distintos caminos. Una colección para descubrir el tuyo.</p>
          <Link className="j24-mobile-main-cta" to={catalogPath}>Explorar inventario <ArrowUpRight size={19}/></Link>
        </div>
      </div>
      <div className="j24-mobile-selected">
        <div className="j24-mobile-selected-main">
          <div className="j24-mobile-selected-copy" aria-live="polite">
            <span>EN LA COLECCIÓN <b>{String(active + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}</b></span>
            <strong>{current ? nameOf(current) : 'Descubrí Jarcar Motors'}</strong>
            {current && <small>{current.year} · {segmentNames[current.segment]} <span aria-hidden="true">·</span> <b>{priced(current)}</b></small>}
          </div>
          {current && <Link className="j24-mobile-selected-link" to={detailPath(current.demoId)} aria-label={`Ver ficha de ${nameOf(current)}`}><ArrowUpRight size={23}/></Link>}
        </div>
        <div className="j24-mobile-picks" role="group" aria-label="Cambiar vehículo destacado">
          {scenes.map((vehicle, index) => <button type="button" key={vehicle.demoId} aria-pressed={active === index} onClick={() => setActive(index)} aria-label={`Mostrar ${nameOf(vehicle)}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <span>{segmentNames[vehicle.segment]}</span>
            <span className="j24-mobile-pick-line" aria-hidden="true" />
          </button>)}
        </div>
      </div>
      <div className="j24-mobile-hero-end">
        <span><b>{vehicles.length}</b> vehículos</span><i aria-hidden="true" />
        <span><b>{new Set(vehicles.map(v => v.segment)).size}</b> categorías</span>
        <Link to={routePath}>Ayudame a elegir <ArrowRight size={16}/></Link>
      </div>
    </div>}
    {!isMobile && <div className="j12-hero-grid">
      <div className="j12-hero-content">
        <div className="j12-hero-overline j12-entrance"><span className="j12-status-dot"/> JARCAR MOTORS <span className="j12-separator">/</span> PAVAS, SAN JOSÉ</div>
        <h1 id="j12-hero-title" className="j12-entrance">Hay carros.<br/><em>Hay uno</em><br/>para vos<span className="j12-period">.</span></h1>
        <p className="j12-hero-summary j12-entrance">Una selección multimarca para descubrir, comparar y encontrar tu próximo vehículo. Todo empieza acá.</p>
        <div className="j12-hero-actions j12-entrance"><Link className="j12-action j12-action-acid" to={catalogPath}>Explorar vehículos <ArrowUpRight size={20}/></Link><Link className="j12-text-link" to={routePath}>Ayudame a elegir <ArrowRight size={17}/></Link></div>
        <div className="j12-hero-proof"><div><CountUp number={vehicles.length}/><span>UNIDADES EN EL CATÁLOGO</span></div><div><CountUp number={new Set(vehicles.map(v=>v.segment)).size}/><span>TIPOS DE VEHÍCULO</span></div><div className="j12-proof-place"><MapPin size={23}/><span>EN PAVAS<br/>SAN JOSÉ, CR</span></div></div>
      </div>
      <div className="j12-hero-media" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
        {current ? <>
          <div className="j12-hero-picture" key={current.demoId}><Picture photo={current.cover} className="j12-hero-image" sizes="(max-width: 860px) 100vw, 65vw" priority eager/><div className="j12-hero-shade"/></div>
          <div className="j12-photo-badge"><span className="j12-badge-mark">J/</span><span>SELECCIÓN<br/>JARCAR</span></div>
          <div className="j12-photo-caption" aria-live="polite"><div><span>EN LA COLECCIÓN <b>{String(active+1).padStart(2,'0')} / {String(count).padStart(2,'0')}</b></span><h2>{nameOf(current)}</h2><div className="j12-caption-details"><span>{current.year} · {segmentNames[current.segment]}</span><strong>{priced(current)}</strong></div></div><Link aria-label={`Ver ficha de ${nameOf(current)}`} to={detailPath(current.demoId)}><MoveUpRight size={25}/></Link></div>
        </> : <div className="j12-media-empty">Descubrí nuestra selección de vehículos.</div>}
        <div className="j12-hero-rail" onKeyDown={keys} role="group" aria-label="Elegir vehículo destacado">
          <span className="j12-rail-heading">CUATRO FORMAS DE MOVERTE</span>
          <div className="j12-rail-options">{scenes.map((vehicle,index)=><button type="button" key={vehicle.demoId} aria-pressed={active===index} onClick={()=>setActive(index)} aria-label={`Mostrar ${nameOf(vehicle)}`}><span className="j12-rail-number">0{index+1}</span><span>{nameOf(vehicle)}</span><span className="j12-rail-track"/></button>)}</div>
          <div className="j12-rail-arrows"><button onClick={()=>change(-1)} aria-label="Vehículo anterior"><ChevronLeft size={19}/></button><button onClick={()=>change(1)} aria-label="Vehículo siguiente"><ChevronRight size={19}/></button></div>
        </div>
      </div>
    </div>}
  </section>;
}

function FindBar({ vehicles }: { vehicles: readonly JarcarVehicle[] }) {
  const nav=useNavigate();
  const [term,setTerm]=useState('');
  const [segment,setSegment]=useState('');
  const [budget,setBudget]=useState('');
  const segments=[...new Set(vehicles.map(v=>v.segment))];
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();const p=new URLSearchParams();if(term.trim())p.set('q',term.trim());if(segment)p.set('tipo',segment);if(budget)p.set('hasta',budget);
    nav(catalogPath + (p.size ? '?' + p.toString() : ''));
  }
  return <section className="j12-find-section" aria-label="Búsqueda rápida de vehículos">
    <div className="j24-mobile-search">
      <div className="j24-mobile-search-heading"><span>¿TENÉS UN MODELO EN MENTE?</span><Link to={routePath}>Necesito ideas <ArrowUpRight size={14}/></Link></div>
      <form className="j24-mobile-search-form" onSubmit={submit}>
        <Search size={19} aria-hidden="true" />
        <input type="search" value={term} onChange={event => setTerm(event.target.value)} placeholder="Buscá por marca o modelo" aria-label="Buscar marca o modelo en el inventario" />
        <button type="submit" aria-label="Buscar vehículos"><ArrowRight size={21}/></button>
      </form>
    </div>
    <div className="j12-find-top"><span><Search size={18}/> TU PRÓXIMO CARRO EMPIEZA CON UNA BÚSQUEDA</span><Link to={routePath}>¿No sabés qué buscar? <ArrowUpRight size={16}/></Link></div>
    <form className="j12-find-grid" onSubmit={submit}>
      <label className="j12-find-text"><span>MARCA O MODELO</span><div><Search size={21}/><input value={term} onChange={e=>setTerm(e.target.value)} placeholder="Ej. Hilux, BMW, eléctrico…" aria-label="Buscar marca o modelo"/></div></label>
      <label><span>TIPO DE VEHÍCULO</span><div><select value={segment} aria-label="Filtrar por tipo" onChange={e=>setSegment(e.target.value)}><option value="">Cualquiera</option>{segments.map(type=><option key={type} value={type}>{segmentNames[type]}</option>)}</select><ChevronDown size={18}/></div></label>
      <label><span>PRESUPUESTO MÁXIMO</span><div><select value={budget} aria-label="Presupuesto máximo" onChange={e=>setBudget(e.target.value)}><option value="">Sin límite</option>{[5,8,10,15,20,30,50].map(m=><option key={m} value={m*1000000}>Hasta {budgetText(m*1000000)}</option>)}</select><ChevronDown size={18}/></div></label>
      <button type="submit">Buscar <ArrowUpRight size={19}/></button>
    </form>
  </section>;
}

function Discovery({ vehicles }: { vehicles: readonly JarcarVehicle[] }) {
  const choices=categoryConcepts.filter(c=>vehicles.some(v=>v.segment===c.segment));
  const [active,setActive]=useState(0);
  const selected=choices[active] ?? choices[0];
  const car=selected ? (findById(vehicles,selected.featuredId) ?? vehicles.find(v=>v.segment===selected.segment)) : undefined;
  if(!car||!selected) return null;
  const matches=vehicles.filter(v=>v.segment===selected.segment).length;
  return <section className="j12-discovery j12-section" aria-labelledby="j12-discovery-heading">
    <div className="j12-section-head j12-enter"><div><span className="j12-eyebrow">01 — EXPLORÁ CON INTENCIÓN</span><h2 id="j12-discovery-heading">¿Qué te <em>mueve?</em></h2></div><p>Un carro para cada momento. Elegí un estilo y descubrí las opciones que hay en el catálogo.</p></div>
    <div className="j12-discovery-frame">
      <div className="j12-category-picker" role="group" aria-label="Explorar por tipo de vehículo">{choices.map((choice,index)=>{
        const n=vehicles.filter(v=>v.segment===choice.segment).length;
        return <button type="button" key={choice.segment} aria-pressed={active===index} onClick={()=>setActive(index)}><span className="j12-choice-index">0{index+1}</span><span className="j12-choice-label">{segmentNames[choice.segment]}<small>{choice.micro}</small></span><span className="j12-choice-count">{n}</span><ArrowUpRight size={21}/></button>;
      })}</div>
      <div className="j12-discovery-preview"><div className="j12-discovery-photo" key={car.demoId}><Picture photo={car.cover} className="j12-discovery-img" sizes="(max-width:900px) 100vw,58vw"/><span className="j12-discovery-photolabel">EN LA COLECCIÓN / {nameOf(car)}</span></div>
        <div className="j12-discovery-caption"><div><span>{selected.micro}</span><h3>{selected.title}</h3><p>{matches} {matches===1?'vehículo':'vehículos'} para descubrir en esta categoría</p></div><Link to={`${catalogPath}?tipo=${selected.segment}`} aria-label={`Ver ${segmentNames[selected.segment]}`}><ArrowUpRight size={24}/></Link></div>
      </div>
    </div>
  </section>;
}

function VehicleFeature({vehicle,index}:{vehicle:JarcarVehicle;index:number}) {
  const {savedIds,toggleSaved}=useGarage();const saved=savedIds.includes(vehicle.demoId);
  return <article className={`j12-vehicle-card j12-vehicle-${index}`}><div className="j12-card-photo"><Link to={detailPath(vehicle.demoId)} aria-label={`Ver ficha de ${nameOf(vehicle)}`}><Picture photo={vehicle.cover} className="j12-card-picture" sizes="(max-width:760px) 90vw, (max-width:1120px) 45vw, 40vw"/></Link><span className="j12-card-tag">{segmentNames[vehicle.segment]} / {vehicle.year}</span><button type="button" className="j12-card-save" aria-pressed={saved} aria-label={`${saved?'Quitar de guardados':'Guardar'} ${nameOf(vehicle)}`} onClick={()=>toggleSaved(vehicle.demoId)}><Heart size={19} fill={saved?'currentColor':'none'}/></button></div><Link to={detailPath(vehicle.demoId)} className="j12-card-details"><span><strong>{nameOf(vehicle)}</strong><small>{vehicle.transmission || 'Consultá características'}</small></span><span><strong>{priced(vehicle)}</strong><ArrowUpRight size={19}/></span></Link></article>;
}

function Selection({vehicles}:{vehicles:readonly JarcarVehicle[]}) {
  const items=galleryIds.flatMap(id=>findById(vehicles,id)??[]);
  if(!items.length)return null;
  return <section className="j12-selection j12-section" aria-labelledby="j12-selection-title">
    <div className="j12-section-head j12-selection-head j12-enter"><div><span className="j12-eyebrow">02 — VEHÍCULOS EN LA MIRA</span><h2 id="j12-selection-title">Una colección.<br/><em>Mucho carácter.</em></h2></div><div><p>Una mirada a los modelos del inventario. Cada ficha incluye fotografías, precio anunciado y detalles para decidir.</p><Link className="j12-inline-link" to={catalogPath}>Ver los {vehicles.length} vehículos <ArrowUpRight size={18}/></Link></div></div>
    <div className="j12-selection-grid">{items.map((vehicle,index)=><VehicleFeature key={vehicle.demoId} vehicle={vehicle} index={index}/>)}</div>
    <div className="j12-selection-footer"><span>ESTO ES SOLO EL PRINCIPIO.</span><Link to={catalogPath}>Explorar toda la colección <ArrowRight size={19}/></Link></div>
  </section>;
}

function RouteTeaser({vehicles}:{vehicles:readonly JarcarVehicle[]}) {
  const [selected,setSelected]=useState<RoutePlan>(routePlans[0].id);
  const result=getRouteResults(vehicles,selected,0);
  const example=result.matching[0];
  return <section className="j12-route" aria-labelledby="j12-route-heading"><div className="j12-route-inner"><div className="j12-route-copy j12-enter"><span className="j12-eyebrow">03 — TU RUTA</span><h2 id="j12-route-heading">No tenés que<br/>saber <em>cuál.</em><br/>Solo para qué.</h2><p>Contanos cómo imaginás usar tu carro. Explorá alternativas según categorías y presupuesto, sin complicaciones.</p><Link className="j12-action j12-action-acid" to={routePath}>Encontrá tu ruta <ArrowUpRight size={19}/></Link></div>
    <div className="j12-route-machine"><div className="j12-route-machine-top"><span>EMPEZÁ POR TU PLAN</span><span>01 / 02</span></div><div className="j12-route-options" role="group" aria-label="Elegir para qué usarías tu carro">{routePlans.map(item=><button key={item.id} type="button" aria-pressed={selected===item.id} onClick={()=>setSelected(item.id)}><span>{item.short}</span><ArrowUpRight size={16}/></button>)}</div><div className="j12-route-result"><div><span>EN TU RADAR</span><strong>{result.matching.length} alternativas</strong><p>{result.definition.line}</p></div>{example && <Link to={detailPath(example.demoId)} aria-label={`Conocer ${nameOf(example)}`}><Picture photo={example.cover} className="j12-route-result-photo" sizes="160px"/><ArrowUpRight size={22}/></Link>}</div><p className="j12-route-footnote">Resultados según el tipo de carrocería. Revisá las fichas para comparar las unidades.</p></div></div></section>;
}

function Story({vehicles}:{vehicles:readonly JarcarVehicle[]}) {
  return <section className="j12-story" aria-labelledby="j12-story-heading"><div className="j12-story-art"><img src="/jarcar-v4/design/story-intelligent-choice.webp" alt="Escena editorial de Jarcar Motors con distintos tipos de vehículos en un entorno tropical costarricense" loading="lazy"/></div><div className="j12-story-copy"><span className="j12-eyebrow">04 — CADA ELECCIÓN CUENTA</span><h2 id="j12-story-heading">Una forma más<br/><em>inteligente</em> de elegir.</h2><p>Fotografías reales, información clara y herramientas que acompañan tu búsqueda. Sin perder de vista lo más importante: el carro que querés.</p><div className="j12-story-actions"><Link to={catalogPath}><span>01</span><strong>Explorá</strong><small>{vehicles.length} vehículos para conocer</small><ArrowUpRight size={18}/></Link><Link to={comparePath}><span>02</span><strong>Compará</strong><small>Hasta tres modelos lado a lado</small><ArrowUpRight size={18}/></Link><Link to={visitPath}><span>03</span><strong>Consultá</strong><small>Preguntá por una unidad específica</small><ArrowUpRight size={18}/></Link></div></div></section>;
}

function VisitCallout() {
  return <section className="j12-visit" aria-labelledby="j12-visit-heading"><div className="j12-visit-heading j12-enter"><span className="j12-eyebrow">05 — DONDE NOS ENCONTRÁS</span><h2 id="j12-visit-heading">La próxima parada:<br/><em>Pavas.</em></h2><p>Encontrá Jarcar Motors, consultá por la unidad que te interesa y organizá tu visita.</p><div className="j12-visit-links"><Link className="j12-action j12-action-acid" to={visitPath}>Contactar a Jarcar <ArrowUpRight size={18}/></Link><a href={jarcar.maps} target="_blank" rel="noopener noreferrer">Cómo llegar <MapPin size={17}/></a></div></div><div className="j12-visit-map"><GoogleMap compact/></div></section>;
}

export function Home() {
  const {data:vehicles=[],isError,refetch}=useQuery({queryKey:['jarcar-v4','inventory'],queryFn:()=>repository.vehicles()});
  return <div className="j12-home"><Hero vehicles={vehicles}/><FindBar vehicles={vehicles}/>
    {isError && <div className="j12-error" role="status">No pudimos cargar el inventario. <button onClick={()=>void refetch()}>Intentar de nuevo</button></div>}
    {vehicles.length>0&&<><Discovery vehicles={vehicles}/><Selection vehicles={vehicles}/><RecentlyViewed vehicles={vehicles}/><RouteTeaser vehicles={vehicles}/><Story vehicles={vehicles}/></>}
    <VisitCallout/>
  </div>;
}
