import * as Dialog from '@radix-ui/react-dialog';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, Check, ChevronLeft, ChevronRight, Expand, Images, MapPin, Scale, Share2, X, Gauge, Fuel, Settings2, CarFront, Camera, Phone, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type TouchEvent } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { mileageText, nameOf, priceText, repository, segmentNames, type JarcarVehicle } from './data';
import { catalogPath, comparePath, detailPath, visitPath } from './paths';
import { useGarage } from './state';
import { Picture } from './ui';
import { jarcar } from './business';
import './detail.css';
import { rememberVehicle } from './recent';

const priceOf = (vehicle: JarcarVehicle) => vehicle.price > 0 && Number.isFinite(vehicle.price) ? priceText(vehicle) : 'Consultar';
const sections = [
  { id: 'fotos', label: 'Fotografías' },
  { id: 'datos', label: 'Especificaciones' },
  { id: 'publicacion', label: 'Descripción' },
  { id: 'antes', label: 'Revisión' },
];

function Gallery({ vehicle }: { vehicle: JarcarVehicle }) {
  const [selected, setSelected] = useState(0);
  const [zoom, setZoom] = useState(false);
  const opener = useRef<HTMLButtonElement | null>(null);
  const thumbRail = useRef<HTMLDivElement>(null);
  const inlineRail = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const photos = vehicle.photos.length ? vehicle.photos : vehicle.cover ? [vehicle.cover] : [];
  const count = photos.length;
  const photo = photos[selected];
  const portrait = photo?.variants.some((variant) => variant.height > variant.width);
  const previews = Array.from({ length: Math.max(0, Math.min(2, count - 1)) }, (_, index) => (selected + index + 1) % count);

  function move(target: number) {
    if (count < 2) return;
    const next = (target + count) % count;
    setSelected(next);
    const ensureVisible = (rail: HTMLDivElement | null, item: Element | null) => {
      if (!rail || !item) return;
      const outer = rail.getBoundingClientRect();
      const rect = item.getBoundingClientRect();
      if (rect.left < outer.left) rail.scrollLeft -= outer.left - rect.left;
      if (rect.right > outer.right) rail.scrollLeft += rect.right - outer.right;
    };
    ensureVisible(inlineRail.current, inlineRail.current?.children.item(next) ?? null);
    ensureVisible(thumbRail.current, thumbRail.current?.children.item(next) ?? null);
  }

  function arrowKeys(event: KeyboardEvent<HTMLElement>) {
    if (count < 2) return;
    const index = event.key === 'ArrowLeft' ? selected - 1 : event.key === 'ArrowRight' ? selected + 1 :
      event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : null;
    if (index === null) return;
    event.preventDefault();
    event.stopPropagation();
    move(index);
  }

  function startTouch(event: TouchEvent) {
    const finger = event.touches[0];
    touch.current = event.touches.length === 1 ? { x: finger.clientX, y: finger.clientY } : null;
    swiped.current = false;
  }

  function endTouch(event: TouchEvent) {
    const start = touch.current;
    touch.current = null;
    const finger = event.changedTouches[0];
    if (!start || !finger || count < 2) return;
    const x = finger.clientX - start.x;
    const y = finger.clientY - start.y;
    if (Math.abs(x) < 42 || Math.abs(x) < Math.abs(y) * 1.4) return;
    swiped.current = true;
    move(selected + (x < 0 ? 1 : -1));
  }

  function open(event: MouseEvent<HTMLButtonElement>) {
    const cancel = swiped.current && event.detail > 0 && event.currentTarget.classList.contains('jd-photo-trigger');
    swiped.current = false;
    if (cancel) return;
    opener.current = event.currentTarget;
    setZoom(true);
  }

  const galleryArrows = count > 1 && <div className="jd-arrows" role="group" aria-label="Navegación de fotos">
    <button type="button" onClick={() => move(selected - 1)} aria-label="Foto anterior"><ChevronLeft size={19} aria-hidden="true" /></button>
    <button type="button" onClick={() => move(selected + 1)} aria-label="Foto siguiente"><ChevronRight size={19} aria-hidden="true" /></button>
  </div>;

  return <section id="fotos" className="jd-gallery" aria-label="Galería del vehículo" tabIndex={-1} onKeyDown={arrowKeys}>
    <Dialog.Root open={zoom} onOpenChange={setZoom}>
      <div className="jd-plate" data-previews={previews.length}>
        <figure className="jd-figure" aria-describedby="jd-photo-caption">
          <span className="j14-photo-serial">JARCAR / GALERÍA · {String(selected + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}</span>
          {photo ? <button className="jd-photo-trigger" type="button" onClick={open} onTouchStart={startTouch} onTouchEnd={endTouch} aria-label={`Ampliar foto, ${photo.label}`}>
            <Picture key={photo.id} photo={photo} sizes="(max-width: 720px) 95vw, (max-width: 1440px) 67vw, 1060px" className={`jd-main-picture${portrait ? ' jd-portrait' : ''}`} priority={selected === 0} eager />
            <span className="jd-expand"><Expand size={16} aria-hidden="true" /><span>Ampliar</span></span>
          </button> : <Picture photo={null} sizes="96vw" className="jd-main-picture" />}
          {count > 1 && <span className="j20-gallery-swipe" aria-hidden="true">Deslizá para explorar <ArrowRight size={16}/></span>}
        </figure>
        {!!previews.length && <div className="jd-previews" aria-label="Otros ángulos del vehículo">
          {previews.map((index, slot) => <button className="jd-preview" key={slot} type="button" aria-label={`Mostrar foto ${index + 1}, ${photos[index].label}`} onClick={() => move(index)}>
            <Picture photo={photos[index]} sizes="(max-width: 720px) 46vw, (max-width: 1440px) 27vw, 400px" decorative className="jd-preview-image" eager />
            <span>{photos[index].label}<ArrowUpRight size={15} aria-hidden="true" /></span>
          </button>)}
        </div>}
      </div>
      <div className="j14-filmstrip" aria-label="Seleccionar fotografía de esta unidad" ref={inlineRail}>
        {photos.map((item, index) => <button key={item.id} type="button" className="j14-film-item" aria-label={`Mostrar fotografía ${index + 1}: ${item.label}`} aria-pressed={selected === index} onClick={() => move(index)}>
          <Picture photo={item} sizes="128px" decorative /><span>{String(index + 1).padStart(2, '0')}</span>
        </button>)}
      </div>
      {count > 1 && <div className="j14-photo-progress" role="progressbar" aria-label="Fotografía seleccionada" aria-valuemin={1} aria-valuemax={count} aria-valuenow={selected + 1}><span style={{ width: `${((selected + 1) / count) * 100}%` }} /></div>}
      <div className="jd-photo-bar">
        <p className="jd-photo-caption" id="jd-photo-caption" aria-live="polite">{photo ? <><strong>{String(selected + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}</strong><span>{photo.label}</span></> : 'Fotografías pendientes'}</p>
        <div className="jd-photo-commands">
          {count > 1 && <button className="jd-photo-all" type="button" onClick={open}><Images size={17} aria-hidden="true" /><span>Ver las {count} fotos</span></button>}
          {galleryArrows}
        </div>
      </div>

      <Dialog.Portal>
        <Dialog.Overlay className="jd-dialog-backdrop" />
        <Dialog.Content className="jd-dialog" onKeyDown={arrowKeys} onCloseAutoFocus={(event) => {
          if (!opener.current?.isConnected) return;
          event.preventDefault();
          opener.current.focus();
        }}>
          <div className="jd-dialog-head">
            <Dialog.Title>{nameOf(vehicle)} <span>{vehicle.year}</span></Dialog.Title>
            <Dialog.Close className="jd-dialog-close" aria-label="Cerrar galería"><X size={21} aria-hidden="true" /></Dialog.Close>
          </div>
          <div className="jd-dialog-media" onTouchStart={startTouch} onTouchEnd={endTouch}>
            <Picture key={photo?.id} photo={photo ?? null} sizes="88vw" className="jd-dialog-picture" eager />
          </div>
          <div className="jd-dialog-controls">
            <Dialog.Description className="jd-dialog-caption" aria-live="polite">{selected + 1} / {count} · {photo?.label}</Dialog.Description>
            {galleryArrows}
          </div>
          {count > 1 && <div className="jd-thumbnails" ref={thumbRail} role="group" aria-label="Elegir foto de la galería">
            {photos.map((item, index) => <button key={item.id} type="button" aria-pressed={index === selected} aria-label={`Ver foto ${index + 1}, ${item.label}`} onClick={() => move(index)}>
              <Picture photo={item} sizes="92px" decorative className="jd-thumb" />
            </button>)}
          </div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </section>;
}

function Decision({ vehicle }: { vehicle: JarcarVehicle }) {
  const { savedIds, compareIds, toggleSaved, toggleCompare } = useGarage();
  const [message, setMessage] = useState('');
  const saved = savedIds.includes(vehicle.demoId);
  const compare = compareIds.includes(vehicle.demoId);
  const limitMessage = 'Tu comparador está completo. Quitá un vehículo para agregar este.';
  const query = new URLSearchParams({ unidad: vehicle.demoId, motivo: 'disponibilidad' });

  async function shareVehicle() {
    const url = new URL(detailPath(vehicle.demoId), window.location.origin).toString();
    const title = `${nameOf(vehicle)} ${vehicle.year} — Jarcar Motors`;
    const localOnly = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (localOnly) {
      try {
        await navigator.clipboard.writeText(`${title} · ${priceOf(vehicle)}. Consultá disponibilidad con Jarcar Motors.`);
        setMessage('Datos del vehículo copiados. La dirección local no es pública.');
      } catch { setMessage('Compartí el nombre del vehículo; el enlace local no funciona fuera de esta computadora.'); }
      return;
    }
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text: `Ficha del ${nameOf(vehicle)} ${vehicle.year}. Precio y disponibilidad por confirmar.`, url });
        setMessage('Ficha compartida desde tu dispositivo.');
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        // La API de compartir podría fallar; ofrecemos copiar como alternativa.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setMessage('Enlace de la ficha copiado. Podés compartirlo donde prefirás.');
    } catch {
      setMessage('Para compartir, copiá la dirección desde la barra del navegador.');
    }
  }

  function changeComparison() {
    if (!compare && compareIds.length >= 3) {
      setMessage(limitMessage);
      return;
    }
    toggleCompare(vehicle.demoId);
    setMessage(compare ? 'Quitaste este vehículo del comparador.' : 'Agregaste este vehículo al comparador.');
  }

  return <div className="jd-decision">
    <div className="jd-decision-top">
      <div className="jd-price-block"><span>Precio anunciado</span><strong>{priceOf(vehicle)}</strong></div>
      <Link to={`${visitPath}?${query}#consulta`} className="jd-contact">Consultar disponibilidad <ArrowUpRight size={18} aria-hidden="true" /></Link>
    </div>
    <div className="jd-direct-channels">
      <a href={`https://wa.me/${jarcar.whatsAppPotential}?text=${encodeURIComponent(`Hola Jarcar, quisiera consultar por ${nameOf(vehicle)} ${vehicle.year} (${priceOf(vehicle)}). ¿Sigue disponible?`)}`} target="_blank" rel="noreferrer">Abrir WhatsApp <ArrowUpRight size={15}/></a>
      <a href={jarcar.phoneHref}>Llamar {jarcar.phone} <ArrowUpRight size={15}/></a>
    </div>
    <div className="jd-decision-foot">
      <button type="button" aria-pressed={saved} onClick={() => {
        toggleSaved(vehicle.demoId);
        setMessage(saved ? 'Quitaste este vehículo de guardados.' : 'Guardaste este vehículo.');
      }}><Bookmark size={17} aria-hidden="true" fill={saved ? 'currentColor' : 'none'} />{saved ? 'Guardado' : 'Guardar'}</button>
      <button type="button" aria-pressed={compare} onClick={changeComparison}>{compare ? <Check size={17} aria-hidden="true" /> : <Scale size={17} aria-hidden="true" />}{compare ? 'En comparador' : 'Comparar'}</button>
      <button type="button" onClick={() => void shareVehicle()}><Share2 size={17} aria-hidden="true" />Compartir ficha</button>
      {compare && <Link className="jd-to-comparison" to={comparePath} aria-label="Ver comparación"><ArrowRight size={17} aria-hidden="true" /></Link>}
    </div>
    <span className="j14-action-status" role="status" aria-live="polite">{message}</span>
  </div>;
}

function Facts({ vehicle }: { vehicle: JarcarVehicle }) {
  const facts = [
    { title: 'Año', value: String(vehicle.year), Icon: CarFront },
    { title: 'Kilometraje', value: vehicle.mileage ? mileageText(vehicle) : 'Por confirmar', Icon: Gauge },
    { title: 'Transmisión', value: vehicle.transmission || 'Por confirmar', Icon: Settings2 },
    { title: 'Tracción', value: vehicle.drivetrain || 'Por confirmar', Icon: CarFront },
    { title: 'Combustible', value: vehicle.fuel || 'Por confirmar', Icon: Fuel },
    { title: 'Motor', value: vehicle.engine || 'Por confirmar', Icon: Settings2 },
  ];
  const specs = Object.entries({ Versión: vehicle.version, ...vehicle.specs }).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string' && !!entry[1].trim()
  );
  return <section id="datos" className="jd-facts-section" aria-labelledby="jd-facts-title" tabIndex={-1}>
    <header className="jd-section-heading"><div><span className="jd-eyebrow">FICHA TÉCNICA</span><h2 id="jd-facts-title">Datos de <em>esta unidad.</em></h2></div></header>
    <dl className="jd-facts">{facts.map(({ title, value, Icon }) => <div key={title}>
      <span className="j14-fact-icon" aria-hidden="true"><Icon size={20} strokeWidth={1.6}/></span>
      <dt>{title}</dt><dd>{value}</dd>
    </div>)}</dl>
    {!!specs.length && <div className="j23-extra-specs"><h3>Información adicional</h3><dl className="jd-facts-extra">{specs.map(([name,value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl></div>}
    {!!vehicle.equipment?.length && <details className="jd-disclosure"><summary>Ver equipamiento publicado <ChevronRight size={17} aria-hidden="true" /></summary><ul>{vehicle.equipment.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></details>}
  </section>;
}

function Publication({ vehicle }: { vehicle: JarcarVehicle }) {
  const parts = vehicle.description.split(/\s+\/\s+/).map((item) => item.trim()).filter(Boolean);
  // Los datos básicos ya aparecen en la ficha técnica: evitamos repetir
  // año, motor, caja, tracción y kilometraje en una segunda lista enorme.
  const additional = parts.filter((part) => !(
    /^\d{4}$/.test(part) ||
    /^motor\b/i.test(part) ||
    /^(autom[aá]tic[ao]|manual)$/i.test(part) ||
    /^\d+[xX]\d+$/.test(part) ||
    /^[\d., ]+\s*(kmts|kil[oó]metros|km|millas)$/i.test(part)
  ));
  return <section id="publicacion" className="jd-publication j8-detail-story" aria-labelledby="jd-publication-title" tabIndex={-1}>
    <div className="jd-publication-aside">
      <span className="jd-eyebrow">SOBRE EL VEHÍCULO</span>
      <h2 id="jd-publication-title">Conocé <em>la unidad.</em></h2>
      <p>Revisá los datos de este {segmentNames[vehicle.segment].toLocaleLowerCase('es-CR')} {vehicle.year} y consultá cualquier característica adicional antes de visitarnos.</p>
    </div>
    <div className="j8-detail-story-body">
      {!!vehicle.highlights?.length && <ul className="jd-publication-highlights">{vehicle.highlights.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul>}
      {!!additional.length && <div className="j23-announcement-extras"><h3>Otros datos del anuncio</h3><ul>{additional.map((item,index)=><li key={`${index}-${item}`}>{item}</li>)}</ul></div>}
      <div className="j23-detail-contact-prompt">¿Querés confirmar el estado, los documentos o algún detalle del equipamiento? Prepará una consulta para esta unidad.</div>
      {!!parts.length && <details className="j23-source-disclosure"><summary>Leer descripción publicada <ChevronRight size={16} aria-hidden="true"/></summary><p>{vehicle.description}</p></details>}
      <Link to={`${visitPath}?${new URLSearchParams({unidad:vehicle.demoId,motivo:'caracteristicas'})}#consulta`} className="j23-more-question">Consultar características <ArrowUpRight size={17} aria-hidden="true" /></Link>
    </div>
  </section>;
}

const checks = [
  { id: 'disponibilidad', label: 'Confirmé precio y disponibilidad', detail: 'Consultá si la unidad sigue disponible antes de coordinar tu visita.' },
  { id: 'historial', label: 'Solicité historial y documentación', detail: 'Consultá titularidad, gravámenes, marchamo, RTV y documentación aplicable.' },
  { id: 'inspeccion', label: 'Coordiné una revisión independiente', detail: 'Motor, caja, suspensión, carrocería, señales de reparación y diagnóstico.' },
  { id: 'prueba', label: 'Agendé revisión y prueba de manejo', detail: 'Solicitá condiciones y autorización para inspeccionar/probar la unidad.' },
  { id: 'condiciones', label: 'Revisé garantía y condiciones de venta', detail: 'Pedí condiciones por escrito; no damos por hecho que haya garantías adicionales.' },
  { id: 'traspaso', label: 'Pregunté por traspaso y costos', detail: 'Verificá impuestos, traspaso, gestión y gastos antes de concretar.' },
] as const;

function BuyerChecklist({ vehicle }: { vehicle: JarcarVehicle }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const storeKey = `jarcar:revision:v1:${vehicle.demoId}`;
  const [completed, setCompleted] = useState<readonly string[]>(() => {
    try { const parsed: unknown = JSON.parse(localStorage.getItem(storeKey) ?? '[]'); return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string' && checks.some((check) => check.id === value)) : []; }
    catch { return []; }
  });
  const update = (id: string) => {
    const next = completed.includes(id) ? completed.filter((entry) => entry !== id) : [...completed, id];
    setCompleted(next);
    try { localStorage.setItem(storeKey, JSON.stringify(next)); } catch { /* Modo privado sin almacenamiento */ }
  };
  return <section className="jd-buyer j14-check-section" id="antes" aria-labelledby="jd-buyer-title" tabIndex={-1}>
    <div className="jd-buyer-intro"><span className="jd-eyebrow">03 / TU TRANQUILIDAD</span><h2 id="jd-buyer-title">Comprá con <em>criterio.</em></h2><p>Una guía personal para las preguntas que vale la pena hacer antes de elegir.</p><div className="jd-check-progress"><strong>{completed.length}<span>/{checks.length}</span></strong><span>revisiones marcadas por vos<br/>Se guardan en este navegador</span></div></div>
    <details className="j14-check-disclosure" ref={detailsRef}><summary><span><ShieldCheck size={21} aria-hidden="true"/> Abrir mi lista de revisión</span><span>{completed.length} / {checks.length} <ChevronRight size={19} aria-hidden="true"/></span></summary>
      <div className="jd-check-list">{checks.map((check,index)=> <label key={check.id} className="jd-check-row"><input type="checkbox" checked={completed.includes(check.id)} onChange={()=>update(check.id)} /><span className="jd-check-number">{String(index+1).padStart(2,'0')}</span><span className="jd-check-copy"><strong>{check.label}</strong><small>{check.detail}</small></span><span className="jd-check-box" aria-hidden="true">{completed.includes(check.id) ? '✓' : '+'}</span></label>)}
        <div className="jd-check-actions"><Link to={`${visitPath}?${new URLSearchParams({unidad:vehicle.demoId,motivo:'caracteristicas'})}#consulta`}>Consultar esta unidad <ArrowUpRight size={18} /></Link><button type="button" onClick={()=>{if(detailsRef.current)detailsRef.current.open=true; window.print()}}>Imprimir ficha y lista</button></div>
      </div>
    </details>
  </section>;
}

function Related({ vehicles, back }: { vehicles: readonly JarcarVehicle[]; back: string }) {
  const suggestions = vehicles.slice(0, 3);
  if (!suggestions.length) return null;
  return <section className="jd-related" aria-labelledby="jd-related-title">
    <header className="jd-section-heading"><h2 id="jd-related-title">Seguí explorando</h2><Link to={catalogPath}>Todo el inventario <ArrowUpRight size={17} aria-hidden="true" /></Link></header>
    <div className="jd-related-grid">{suggestions.map((vehicle) => <Link className="jd-related-vehicle" key={vehicle.demoId} to={detailPath(vehicle.demoId)} state={{ from: back }}>
      <Picture photo={vehicle.cover} sizes="(max-width: 510px) 38vw, (max-width: 720px) 48vw, 32vw" className="jd-related-picture" decorative />
      <div><p>{vehicle.year} · {segmentNames[vehicle.segment]}</p><h3>{nameOf(vehicle)}</h3><strong>{priceOf(vehicle)}</strong></div><ArrowUpRight size={20} aria-hidden="true" />
    </Link>)}</div>
  </section>;
}

export function Detail() {
  const { demoId = '' } = useParams<{ demoId: string }>();
  const { hash, key, state } = useLocation();
  const from = state?.from;
  const back = typeof from === 'string' && (from === catalogPath || from.startsWith(`${catalogPath}?`)) ? from : catalogPath;
  const detail = useQuery({ queryKey: ['jarcar-v4', 'detail', demoId], queryFn: () => repository.detail(demoId), enabled: !!demoId });
  const related = useQuery({ queryKey: ['jarcar-v4', 'related', demoId], queryFn: () => repository.related(demoId), enabled: !!demoId });
  const vehicle = detail.data;

  useEffect(() => {
    if (vehicle) rememberVehicle(vehicle.demoId);
    document.title = `${vehicle ? `${nameOf(vehicle)} ${vehicle.year}` : 'Ficha de vehículo'} — Jarcar Motors`;
  }, [vehicle]);

  useEffect(() => {
    if (!vehicle || !sections.some(({ id }) => hash === `#${id}`)) return;
    const section = document.getElementById(hash.slice(1));
    section?.scrollIntoView({ block: 'start' });
    section?.focus({ preventScroll: true });
  }, [hash, key, vehicle]);

  if (detail.isLoading) return <div className="ja-frame jd-state" role="status">Cargando la ficha del vehículo…</div>;
  if (!vehicle) return <section className="ja-frame jd-state">
    <h1>{detail.isError ? 'La ficha no cargó.' : 'No encontramos ese vehículo.'}</h1>
    <p>Podés seguir explorando los otros anuncios de Jarcar.</p>
    {detail.isError && <button className="jd-contact" type="button" onClick={() => void detail.refetch()}>Intentar de nuevo</button>}
    <Link className="jd-back" to={back}><ArrowLeft size={17} aria-hidden="true" /> Volver al inventario</Link>
  </section>;

  const lead = vehicle.mileage ? mileageText(vehicle) : 'Kilometraje por confirmar';
  const query = new URLSearchParams({ unidad: vehicle.demoId, motivo: 'visita' });
  const availability = vehicle.availability === 'reserved' ? 'Reservado' : vehicle.availability === 'sold' ? 'Vendido' : 'Disponibilidad por confirmar';

  return <article className="j14-detail j23-detail">
    <header className="j14-masthead j23-masthead">
      <div className="ja-frame j14-header-inner">
        <nav className="jd-breadcrumbs j14-breadcrumbs" aria-label="Ruta de navegación">
          <Link className="jd-back" to={back}><ArrowLeft size={16} aria-hidden="true"/> Inventario</Link>
          <span>{segmentNames[vehicle.segment]}</span>
          <span aria-current="page">{nameOf(vehicle)} · {vehicle.year}</span>
        </nav>
        <div className="j14-header-grid j23-header-grid">
          <div className="j14-masthead-copy">
            <span className="j14-eyebrow">JARCAR MOTORS / {segmentNames[vehicle.segment].toUpperCase()}</span>
            <h1>{nameOf(vehicle)}<span className="j14-title-mark">.</span></h1>
            <p className="j14-headline-lead">{vehicle.year} <span aria-hidden="true">·</span> {lead} {vehicle.transmission ? <> <span aria-hidden="true">·</span> {vehicle.transmission}</> : null}</p>
          </div>
          <div className="j23-header-actions" aria-label="Información rápida">
            <span>{availability}</span>
            <span><Camera size={16} aria-hidden="true"/>{vehicle.photos.length} {vehicle.photos.length === 1 ? 'foto' : 'fotos'}</span>
          </div>
        </div>
      </div>
    </header>

    <div className="ja-frame j23-showcase" aria-label="Fotografías y consulta del vehículo">
      <div className="j23-gallery-column"><Gallery key={vehicle.demoId} vehicle={vehicle}/></div>
      <aside className="j23-sales-column" aria-label="Precio y contacto"><Decision key={vehicle.demoId} vehicle={vehicle}/>
        <p className="j23-sales-note"><MapPin size={17} aria-hidden="true"/> Consultá los detalles para conocer esta unidad en Pavas, San José.</p>
      </aside>
    </div>

    <div className="j14-nav-shell j23-nav-shell"><nav className="ja-frame jd-jump j14-jump" aria-label="Secciones de esta ficha">
      {sections.map(({ id, label }) => <Link key={id} to={{hash:`#${id}`}} state={{from:back}}>{label}</Link>)}
      <Link to={`${visitPath}?${query}#consulta`} className="jd-location"><MapPin size={16} aria-hidden="true"/> Coordinar visita <ArrowUpRight size={16} aria-hidden="true"/></Link>
    </nav></div>

    <div className="ja-frame j14-information j23-information">
      <div className="j23-information-grid">
        <Facts vehicle={vehicle}/>
        <Publication vehicle={vehicle}/>
      </div>
      <BuyerChecklist key={vehicle.demoId} vehicle={vehicle}/>
      <section className="j14-visit-band j23-visit-band" aria-label="Conocer el vehículo en persona">
        <div className="j14-visit-content"><span>JARCAR MOTORS / PAVAS, SAN JOSÉ</span><h2>¿Querés verlo <em>en persona?</em></h2><p>Consultá la disponibilidad y prepará tu visita antes de salir.</p></div>
        <div className="j14-visit-actions"><Link to={`${visitPath}?${query}#consulta`}>Coordinar visita <ArrowUpRight size={19} aria-hidden="true"/></Link><a href={jarcar.phoneHref}><Phone size={17} aria-hidden="true"/> Llamar a Jarcar</a></div>
      </section>
      <Related vehicles={related.data ?? []} back={back}/>
    </div>
    <div className="r10-mobile-decision" aria-label="Consulta de este vehículo">
      <span><small>PRECIO ANUNCIADO</small><strong>{priceOf(vehicle)}</strong></span>
      <Link to={`${visitPath}?${new URLSearchParams({unidad:vehicle.demoId,motivo:'disponibilidad'})}#consulta`}>Consultar <ArrowUpRight size={18}/></Link>
    </div>
  </article>;
}

import './r7.css';

import './r14-detail.css';
import './r20-mobile-showroom.css';
import './r23-detail.css';
