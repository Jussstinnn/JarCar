import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, ChevronDown, Link2, Printer, Plus, X } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { mileageText, nameOf, priceText, repository, segmentNames, type JarcarVehicle } from "./data";
import { catalogPath, detailPath, visitPath } from "./paths";
import { comparisonInsights } from "./comparison-insights";
import { useGarage } from "./state";
import { Picture } from "./ui";
import "./catalog.css";
import "./compare-r16.css";

const emptyInventory: readonly JarcarVehicle[] = [];
const availability: Record<JarcarVehicle["availability"], string> = {
  unverified: "Por confirmar", available: "Disponible", reserved: "Reservado", sold: "Vendido",
};
const specs: ReadonlyArray<{ label: string; read: (item: JarcarVehicle) => string }> = [
  { label: "Precio anunciado", read: (item) => item.price > 0 ? priceText(item) : "Consultar" },
  { label: "Año", read: (item) => String(item.year) },
  { label: "Tipo", read: (item) => segmentNames[item.segment] },
  { label: "Kilometraje", read: mileageText },
  { label: "Transmisión", read: (item) => item.transmission ?? "Consultar" },
  { label: "Tracción", read: (item) => item.drivetrain ?? "Consultar" },
  { label: "Combustible", read: (item) => item.fuel ?? "Consultar" },
  { label: "Motor", read: (item) => item.engine ?? "Consultar" },
  { label: "Disponibilidad", read: (item) => availability[item.availability] },
];

export function Compare() {
  const { state } = useLocation();
  const [params, setParams] = useSearchParams();
  const [shareStatus, setShareStatus] = useState('');
  const { compareIds, toggleCompare, removeCompare } = useGarage();
  const [differences, setDifferences] = useState(false);
  const [candidate, setCandidate] = useState("");
  const addControl = useRef<HTMLSelectElement>(null);
  const goBack = useRef<HTMLAnchorElement>(null);
  const { data = emptyInventory, isPending, isError, refetch } = useQuery({ queryKey: ["jarcar-v4", "inventory"], queryFn: () => repository.vehicles() });

  const from = typeof state?.from === "string" && (state.from === catalogPath || state.from.startsWith(`${catalogPath}?`)) ? state.from : catalogPath;
  const shared = params.has('v');
  const sharedIds = (params.get('v') ?? '').split(',').filter(id => /^[a-z0-9-]{2,90}$/.test(id)).slice(0,3);
  const selectedIds = shared ? [...new Set(sharedIds)] : compareIds;
  const vehicles = selectedIds.slice(0, 3).flatMap((id) => data.find((item) => item.demoId === id) ?? []);
  const options = data.filter((item) => !selectedIds.includes(item.demoId)).sort((a, b) => nameOf(a).localeCompare(nameOf(b), "es-CR"));
  const showPicker = vehicles.length < 3 && options.length > 0;
  const selectedCount = vehicles.length;
  const fields = differences && selectedCount > 1 ? specs.filter(({ read }) => new Set(vehicles.map(read)).size > 1) : specs;
  const insights = comparisonInsights(vehicles);

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!candidate || !showPicker) return;
    if (shared) setParams({ v: [...selectedIds,candidate].slice(0,3).join(',') });
    else toggleCompare(candidate);
    setCandidate("");
    if (selectedCount === 2) requestAnimationFrame(() => goBack.current?.focus());
  }

  function remove(id: string) {
    if (shared) setParams({v:selectedIds.filter(x=>x!==id).join(',')});
    else removeCompare(id);
    requestAnimationFrame(() => (addControl.current ?? goBack.current)?.focus());
  }

  async function shareSelection() {
    const url = new URL(window.location.href);
    url.searchParams.set('v', vehicles.map(v => v.demoId).join(','));
    const isLocal = ['localhost','127.0.0.1','::1'].includes(url.hostname);
    const summary = vehicles.map(v=>`${nameOf(v)} ${v.year} — ${priceText(v)}`).join('\n');
    const text = isLocal ? `Comparación Jarcar Motors:\n${summary}\n(Enlace interactivo disponible cuando el sitio esté publicado.)` : url.toString();
    try { await navigator.clipboard.writeText(text); setShareStatus(isLocal ? 'Copié la selección con modelos y precios. El enlace interactivo funcionará cuando el sitio esté publicado.' : 'Enlace copiado. Podés compartir esta comparación.'); }
    catch { setShareStatus('No se pudo copiar automáticamente. Usá la opción de compartir de tu navegador.'); }
  }

  const picker = showPicker && <form className="ja-x-picker" onSubmit={add}>
    <label><span className="ja-c-sr-only">Elegí un carro para comparar</span>
      <select ref={addControl} value={candidate} onChange={(event) => setCandidate(event.target.value)}>
        <option value="">Elegí un carro</option>
        {options.map((item) => <option key={item.demoId} value={item.demoId}>{nameOf(item)} · {item.year}</option>)}
      </select><ChevronDown size={17} aria-hidden="true" />
    </label>
    <button type="submit" className="ja-button ja-button-accent" disabled={!candidate}><Plus size={18} aria-hidden="true" /> Agregar</button>
  </form>;

  return <div className="ja-compare ja-frame">
    <Link ref={goBack} to={from} className="ja-x-back"><ArrowLeft size={17} aria-hidden="true" /> Volver al inventario</Link>
    <header className="ja-x-heading j16-x-hero">
      <div className="j16-x-overline"><span>JARCAR / TU SELECCIÓN</span><span>UN MISMO LUGAR. DISTINTAS OPCIONES.</span></div>
      <div className="j16-x-hero-grid"><div><h1>Elegí con<br/><em>perspectiva.</em></h1><p>Poné las unidades que te interesan lado a lado. Compará los datos publicados y abrí la ficha de cada vehículo para conocerlo mejor.</p></div>
      <div className="j16-x-hero-art" aria-hidden="true"><span>01</span><span>02</span><span>03</span><i>J.</i></div></div>
      <div className="j16-x-hero-base"><span>PRECIO / AÑO / KILOMETRAJE / EQUIPAMIENTO</span><span>{selectedCount} DE 3 VEHÍCULOS SELECCIONADOS</span></div>
    </header>
    {isError ? <section className="ja-c-empty"><h2>No se pudo recuperar la selección.</h2><button type="button" className="ja-button" onClick={() => void refetch()}>Volver a intentar</button></section>
      : isPending ? <p role="status">Cargando selección…</p>
        : selectedCount === 0 ? <section className="ja-x-empty" aria-label="Armar una comparación">
          <div><h2>Armá tu comparación.</h2><p>Elegí un carro de la lista y agregalo a la selección.</p></div>
          {picker}
        </section> : <section className="ja-x-spread" aria-label="Comparación de vehículos">
          <div className="ja-x-controls">
            <p role="status"><strong>{selectedCount} de 3</strong> en tu selección</p>
            {picker}
            {selectedCount > 1 && <button className="r10-share-compare" type="button" onClick={() => void shareSelection()}><Link2 size={17} aria-hidden="true"/> Compartir selección</button>}
            {selectedCount > 1 && <button className="ja-x-print" type="button" onClick={() => window.print()}><Printer size={17} aria-hidden="true" /> Imprimir / PDF</button>}
            {selectedCount > 1 && <label className="ja-x-differences">
              <input type="checkbox" checked={differences} onChange={(event) => setDifferences(event.target.checked)} /> Solo diferencias
            </label>}
          </div>
          {!!shareStatus && <p className="r10-share-status" role="status">{shareStatus}</p>}
          {shared && <p className="r10-share-status">Comparación abierta desde un enlace compartido. Podés modificarla sin afectar los vehículos guardados en este navegador.</p>}
          {selectedCount === 1 && <p className="ja-x-instruction">Agregá un segundo carro para contrastar sus datos.</p>}
          {selectedCount > 1 && <section className="j16-x-insights" aria-labelledby="j16-x-insights-title">
            <header><span>LECTURA RÁPIDA</span><h2 id="j16-x-insights-title">Las diferencias, <em>a primera vista.</em></h2><p>Solo resaltamos diferencias objetivas de los anuncios. No calificamos el estado de los vehículos.</p></header>
            {insights.length > 0 ? <div className="j16-x-insight-grid">{insights.map(insight => {
              const matched = vehicles.find(v => v.demoId === insight.vehicleId)!;
              return <article key={insight.key} className="j16-x-insight">
                <span>{insight.title}</span><strong>{insight.value}</strong>
                <Link to={detailPath(matched.demoId)}><span>{nameOf(matched)}</span><ArrowUpRight size={17}/></Link>
                <small>{insight.detail}</small>
              </article>;
            })}</div> : <p className="j16-x-no-differences">No hay ventajas únicas comprobables en precio, año o kilometraje entre las unidades seleccionadas. Revisá las características completas abajo.</p>}
          </section>}
          <div className="j16-x-table-heading"><div><span>FICHA COMPARATIVA</span><h2>Los detalles <em>cuentan.</em></h2></div><p>Deslizá horizontalmente en móvil para explorar las columnas.</p></div>
          <div className="j16-x-table-scroll" role="region" aria-label="Tabla comparativa; desplazable horizontalmente en pantallas pequeñas" tabIndex={0}>
          <table className="ja-x-table" data-columns={selectedCount} role="table" aria-label="Datos de los carros seleccionados">
            <thead role="rowgroup"><tr role="row">
              <th scope="col" className="ja-x-specs-head" role="columnheader">Ficha técnica</th>
              {vehicles.map((item) => <th scope="col" role="columnheader" key={item.demoId}>
                <div className="ja-x-car">
                  <Link to={detailPath(item.demoId)} state={{ from, back: from }} aria-label={`Ver ficha de ${nameOf(item)}`}>
                    <Picture photo={item.cover} className="ja-x-picture" sizes="(max-width: 620px) 31vw, 375px" decorative />
                    <span>{nameOf(item)}</span>
                  </Link>
                  <button type="button" onClick={() => remove(item.demoId)} aria-label={`Quitar ${nameOf(item)} de comparación`}><X size={17} aria-hidden="true" /></button>
                </div>
                <Link className="j16-x-contact" to={`${visitPath}?${new URLSearchParams({unidad:item.demoId,motivo:'disponibilidad'})}#consulta`}>Consultar unidad <ArrowUpRight size={15}/></Link>
              </th>)}
            </tr></thead>
            <tbody role="rowgroup">{fields.map(({ label, read }) => <tr key={label} role="row" data-price={label === "Precio anunciado"}>
              <th scope="row" role="rowheader">{label}</th>
              {vehicles.map((item) => <td key={item.demoId} role="cell">{read(item)}</td>)}
            </tr>)}</tbody>
          </table></div>
          {!fields.length && <p className="ja-x-instruction">Los datos mostrados coinciden entre los carros de la selección.</p>}
          <p className="ja-c-notice">Precios y características según anuncios consultados; confirmá estado, equipamiento, precio y disponibilidad con Jarcar antes de tomar una decisión.</p>
        </section>}
  </div>;
}
