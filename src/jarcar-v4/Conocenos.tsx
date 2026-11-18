import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowRight, ArrowUpRight, Instagram, MapPin, Phone } from 'lucide-react';
import { useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { jarcar } from './business';
import { nameOf, repository, segmentNames, type JarcarVehicle, type Segment } from './data';
import { catalogPath, detailPath, routePath, visitPath } from './paths';
import { GoogleMap } from './GoogleMap';
import { Picture } from './ui';
import './about-r17.css';

type Scene = { segment: Segment; label: string; tagline: string; idea: string; id: string };
const scenes: readonly Scene[] = [
  { segment: 'suv', label: 'Espacio', tagline: 'SUV para más planes', idea: 'Espacio, altura y versatilidad para el día a día.', id: 'land-rover-evoque-pure-tech-2019' },
  { segment: 'pickup', label: 'Trabajo', tagline: 'Pickups con carácter', idea: 'Una categoría pensada para quienes necesitan más capacidad.', id: 'chevrolet-colorado-ltz-2024' },
  { segment: 'electrico', label: 'Cambio', tagline: 'Movilidad eléctrica', idea: 'Otra forma de moverse con tecnología más actual.', id: 'toyota-bz3-2025' },
  { segment: 'clasico', label: 'Estilo', tagline: 'Clásicos con personalidad', idea: 'Modelos que destacan por su presencia y su historia visual.', id: 'volkswagen-escarabajo-super-beetle-1975' },
];
const empty: readonly JarcarVehicle[] = [];

function IdentityHighlights() {
  const items = [
    { number: '01', title: 'Inventario multimarca', body: 'Jarcar reúne opciones de distintas categorías para que puedas comparar estilos, tamaños y presupuestos en un solo lugar.' },
    { number: '02', title: 'Fotografías reales', body: 'La experiencia parte de imágenes reales, precios visibles y fichas con la información necesaria para empezar a evaluar una unidad.' },
    { number: '03', title: 'Contacto directo', body: 'Si una unidad te interesa, podés pasar a verla en Pavas o preparar la consulta desde la web antes de tu visita.' },
  ] as const;

  return <section className="j21-identity ja-frame" aria-labelledby="j21-identity-title">
    <div className="j21-identity-head">
      <span className="j17-kicker">02 / QUÉ ENCONTRÁS EN JARCAR</span>
      <h2 id="j21-identity-title">Una selección real.<br/><em>Una experiencia más clara</em><br/>para elegir.</h2>
      <p>La propuesta de Jarcar Motors se apoya en inventario publicado, información visible y una experiencia más ordenada para descubrir y comparar unidades.</p>
    </div>
    <div className="j21-identity-grid">
      {items.map(item => <article key={item.number}>
        <span>{item.number}</span>
        <strong>{item.title}</strong>
        <p>{item.body}</p>
      </article>)}
    </div>
  </section>;
}

function PracticalTools() {
  const tools = [
    { number: '01', title: 'Explorá el inventario', body: 'Filtrá por marca, presupuesto y categoría para encontrar opciones con mayor rapidez.', href: catalogPath, cta: 'Ir al inventario' },
    { number: '02', title: 'Compará mejor', body: 'Guardá tus favoritas y compará hasta tres vehículos para revisar diferencias con más contexto.', href: `${catalogPath}?favoritos=1`, cta: 'Ver guardados' },
    { number: '03', title: 'Prepará tu visita', body: 'Coordiná una consulta y llegá a Pavas con una idea más clara de las unidades que querés conocer.', href: visitPath, cta: 'Coordinar visita' },
  ] as const;

  return <section className="j22-about-tools ja-frame" aria-labelledby="j22-about-tools-title">
    <div className="j22-about-tools-head">
      <span className="j17-kicker">04 / CÓMO SE RECORRE JARCAR</span>
      <h2 id="j22-about-tools-title">Todo pensado para pasar <em>del interés</em> a la visita.</h2>
      <p>La web acompaña la decisión: te deja explorar, comparar y llegar a la consulta con más criterio y menos fricción.</p>
    </div>
    <div className="j22-about-tools-grid">
      {tools.map(tool => <Link key={tool.number} to={tool.href}>
        <span>{tool.number}</span>
        <strong>{tool.title}</strong>
        <p>{tool.body}</p>
        <small>{tool.cta} <ArrowUpRight size={16} /></small>
      </Link>)}
    </div>
  </section>;
}

function CollectionWindow({vehicles}:{vehicles:readonly JarcarVehicle[]}) {
  const [active, setActive] = useState(0);
  const group = useRef<HTMLDivElement>(null);
  const available = scenes.filter(s=>vehicles.some(v=>v.segment===s.segment));
  const scene = available[Math.min(active,available.length-1)] ?? available[0];
  const vehicle = scene && (vehicles.find(v=>v.demoId===scene.id) ?? vehicles.find(v=>v.segment===scene.segment));
  if (!scene || !vehicle) return null;
  const count = vehicles.filter(v=>v.segment===scene.segment).length;
  const go = (next:number) => {setActive(next);(group.current?.querySelectorAll('button')[next] as HTMLButtonElement | undefined)?.focus();};
  function keys(e:KeyboardEvent<HTMLDivElement>) {
    const next = e.key==='ArrowRight'||e.key==='ArrowDown' ? (active+1)%available.length : e.key==='ArrowLeft'||e.key==='ArrowUp' ? (active+available.length-1)%available.length : e.key==='Home' ? 0 : e.key==='End' ? available.length-1 : -1;
    if (next>=0) {e.preventDefault();go(next);}
  }
  return <section className="j17-window" aria-labelledby="j17-window-title">
    <div className="j17-window-top">
      <span className="j17-kicker">03 / CATEGORÍAS</span>
      <h2 id="j17-window-title">Una colección con<br/><em>más de una forma</em><br/>de empezar.</h2>
      <p>Explorá el inventario por categoría y abrí rutas distintas según el tipo de vehículo que querés conocer.</p>
    </div>
    <div className="j17-window-grid">
      <div className="j17-window-index" role="tablist" aria-label="Elegí un tipo de vehículo" onKeyDown={keys} ref={group}>
        {available.map((s,i)=><button type="button" role="tab" aria-selected={active===i} tabIndex={active===i?0:-1} key={s.segment} onClick={()=>setActive(i)} id={`j17-cat-${s.segment}`} aria-controls="j17-cat-panel"><span className="j17-window-number">0{i+1}</span><span><strong>{s.label}</strong><small>{s.tagline}</small></span><ArrowUpRight size={22} aria-hidden="true" /></button>)}
        <Link className="j17-window-all" to={catalogPath}>Ver todo el inventario <ArrowRight size={18}/></Link>
      </div>
      <div id="j17-cat-panel" className="j17-window-stage" role="tabpanel" aria-labelledby={`j17-cat-${scene.segment}`} tabIndex={0}>
        <div key={vehicle.demoId} className="j17-window-media"><Picture photo={vehicle.cover} className="j17-window-photo" sizes="(max-width: 900px) 100vw, 60vw"/><div className="j17-window-ghost" aria-hidden="true">0{active+1}</div></div>
        <div className="j17-window-caption"><div><span>{segmentNames[scene.segment]} · {count} {count===1?'vehículo':'vehículos'}</span><h3>{scene.idea}</h3><p>{nameOf(vehicle)} · {vehicle.year}</p></div><div className="j17-window-links"><Link to={`${catalogPath}?tipo=${scene.segment}`}>Ver categoría <ArrowUpRight size={17}/></Link><Link to={detailPath(vehicle.demoId)}>Conocer esta unidad <ArrowRight size={17}/></Link></div></div>
      </div>
    </div>
  </section>;
}

export function Conocenos() {
  const {data:vehicles=empty}=useQuery({queryKey:['jarcar-v4','inventory'],queryFn:()=>repository.vehicles()});
  const visual = vehicles.find(v=>v.demoId==='mercedes-benz-ml350-2015') ?? vehicles.find(v=>!!v.cover);
  const accent = vehicles.find(v=>v.demoId==='isuzu-qkr-2022') ?? vehicles.find(v=>v.demoId==='fiat-punto-evo-2013');
  return <div className="j17-about">
    <section className="j17-hero" aria-labelledby="j17-title">
      <div className="j17-hero-copy">
        <div className="j17-eyebrow"><span>JARCAR MOTORS</span><span>PAVAS · SAN JOSÉ</span></div>
        <div className="j17-hero-center">
          <span className="j17-kicker">NOSOTROS</span>
          <h1 id="j17-title">UNA FORMA MÁS<br/>CLARA DE <em>DESCUBRIR</em><br/>TU PRÓXIMO CARRO<span className="j17-period">.</span></h1>
          <p>Jarcar Motors presenta una colección multimarca desde Pavas, San José, con fotografías reales, categorías variadas y una experiencia web pensada para explorar mejor cada unidad.</p>
          <div className="j17-hero-actions"><Link to={catalogPath} className="j17-primary">Ver inventario <ArrowUpRight size={19}/></Link><a href="#j17-seleccion" className="j17-text-link">Seguir descubriendo <ArrowDown size={18}/></a></div>
        </div>
        <span className="j17-hero-bottom">INVENTARIO MULTIMARCA · ATENCIÓN DIRECTA · PAVAS <span>{vehicles.length || '—'} VEHÍCULOS</span></span>
      </div>
      <div className="j17-hero-media">
        <div className="j17-hero-picture">{visual&&<Picture photo={visual.cover} sizes="(max-width: 850px) 100vw, 52vw" className="j17-hero-actual" eager priority/>}<span className="j17-hero-outline" aria-hidden="true">JARCAR</span></div>
        <div className="j17-hero-side"><div><span>INVENTARIO DISPONIBLE</span><strong>{vehicles.length || '—'}<small> unidades publicadas</small></strong></div>{accent&&<Link to={detailPath(accent.demoId)} className="j17-mini-car"><Picture photo={accent.cover} sizes="180px" decorative/><span>{nameOf(accent)}<ArrowUpRight size={15}/></span></Link>}</div>
      </div>
    </section>

    <section id="j17-seleccion" className="j17-statement ja-frame">
      <div className="j17-statement-index">01 <span>/ QUIÉNES SON EN LA WEB</span></div>
      <div><h2>Más que ver carros.<br/><em>Es poder compararlos</em><br/>mejor.</h2><p>La página de Jarcar Motors no se plantea como una vitrina genérica. Busca presentar el inventario con mayor orden, mejores recorridos y herramientas útiles para pasar de la curiosidad a la consulta.</p></div>
      <div className="j17-statement-motif" aria-hidden="true"><span>J.</span></div>
    </section>

    <IdentityHighlights/>
    <CollectionWindow vehicles={vehicles}/>

    <section className="j17-editorial ja-frame" aria-labelledby="j17-editorial-title">
      <div className="j17-editorial-art"><img src="/jarcar-v4/design/about-jarcar-collection.webp" alt="Colección de vehículos en un entorno costarricense" loading="lazy"/><div className="j17-editorial-art-top"><span>JARCAR MOTORS</span><span>PAVAS · COSTA RICA</span></div><div className="j17-editorial-art-foot">EXPLORÁ · COMPARÁ · VISITÁ</div></div>
      <div className="j17-editorial-content"><span className="j17-kicker">05 / DEL SITIO A LA VISITA</span><h2 id="j17-editorial-title">La decisión empieza<br/><em>con mejor información.</em></h2><p>Revisá opciones con calma, guardá las unidades que más te interesan y prepará una visita con más claridad sobre el tipo de vehículo que estás buscando.</p><div className="j17-editorial-steps"><Link to={catalogPath}><strong>01</strong><span>Recorré el inventario completo</span><ArrowUpRight size={19}/></Link><Link to={routePath}><strong>02</strong><span>Encontrá una ruta según tu necesidad</span><ArrowUpRight size={19}/></Link><Link to={visitPath}><strong>03</strong><span>Prepará tu consulta y tu visita</span><ArrowUpRight size={19}/></Link></div></div>
    </section>

    <PracticalTools/>

    <section className="j17-location ja-frame" aria-labelledby="j17-location-title"><div className="j17-location-top"><div><span className="j17-kicker">VISITANOS</span><h2 id="j17-location-title">Encontranos<br/><em>en Pavas.</em></h2><p>{jarcar.place}</p></div><div className="j17-location-actions"><a href={jarcar.maps} target="_blank" rel="noopener noreferrer"><MapPin size={17}/> Cómo llegar <ArrowUpRight size={16}/></a><a href={jarcar.phoneHref}><Phone size={17}/> {jarcar.phone}</a><a href={jarcar.instagram} target="_blank" rel="noopener noreferrer"><Instagram size={17}/> Instagram <ArrowUpRight size={16}/></a></div></div><GoogleMap compact/></section>
  </div>;
}
