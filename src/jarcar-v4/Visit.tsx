import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronDown, Clock3, Copy, Instagram, MapPin, MessageCircle, Phone, Route } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { nameOf, priceText, repository, type JarcarVehicle } from './data';
import { catalogPath, detailPath } from './paths';
import { Picture } from './ui';
import { jarcar } from './business';
import { GoogleMap } from './GoogleMap';
import './visit-r17.css';

const topics = [
  {id:'disponibilidad',label:'Precio y disponibilidad'},
  {id:'visita',label:'Coordinar una visita'},
  {id:'caracteristicas',label:'Características y estado'},
  {id:'documentacion',label:'Documentación y condiciones'},
  {id:'general',label:'Consulta general'},
] as const;
type Topic = typeof topics[number]['id'];
const questions = [
  '¿Sigue disponible?', '¿Podemos coordinar una visita?',
  '¿Puedo conocer el historial y estado?', '¿Qué incluye el precio anunciado?',
] as const;
const order = new Intl.Collator('es-CR',{sensitivity:'base'});

function initialMessage(topic:Topic, vehicle:JarcarVehicle|undefined) {
  const name=vehicle ? `${nameOf(vehicle)} ${vehicle.year}` : 'el inventario';
  const message:Record<Topic,string>={
    disponibilidad:`Me gustaría confirmar el precio y la disponibilidad de ${name}.`,
    visita:`Quisiera coordinar una visita para conocer ${vehicle ? `el ${name}` : 'sus vehículos'}. ¿En qué horario puedo pasar?`,
    caracteristicas:`Quisiera consultar por el estado, equipamiento y características de ${name}.`,
    documentacion:`Quisiera conocer la documentación y condiciones de venta de ${name}.`,
    general:`Quisiera hacer una consulta sobre ${name}.`,
  };
  return `Hola, Jarcar Motors. ${message[topic]} Gracias.`;
}

export function Visit() {
  const [params] = useSearchParams();
  const {hash}=useLocation();
  const navigate=useNavigate();
  const requested=params.get('unidad')??'';
  const topic:Topic=topics.find(t=>t.id===params.get('motivo'))?.id??'disponibilidad';
  const inventory=useQuery({queryKey:['jarcar-v4','inventory'],queryFn:()=>repository.vehicles(),select:(rows:readonly JarcarVehicle[])=>[...rows].sort((a,b)=>order.compare(nameOf(a),nameOf(b)))});
  const vehicle=inventory.data?.find(v=>v.demoId===requested);
  const key=`${topic}/${vehicle?.demoId??'general'}`;
  const template=initialMessage(topic,vehicle);
  const [drafts,setDrafts]=useState<Record<string,string>>({});
  const [feedback,setFeedback]=useState<'copied'|'selected'|''>('');
  const [addressFeedback,setAddressFeedback]=useState('');
  const message=drafts[key]??template;
  const field=useRef<HTMLTextAreaElement>(null);
  const form=useRef<HTMLElement>(null);
  useEffect(()=>{if(hash==='#consulta') {form.current?.scrollIntoView({block:'start'});form.current?.focus({preventScroll:true});}},[hash]);

  function changeParam(name:'motivo'|'unidad',value:string) {
    const next=new URLSearchParams(params);
    if(value)next.set(name,value);else next.delete(name);
    navigate({search:next.toString(),hash:'#consulta'},{replace:true,preventScrollReset:true});
    setFeedback('');
  }
  function setMessage(value:string) {setDrafts(d=>({...d,[key]:value}));setFeedback('');}
  function addQuestion(question:string) {
    if(message.includes(question))return;
    const next=`${message.trim()}\n${question}`;
    setMessage(next.slice(0,1200));
  }
  async function copy(event:FormEvent) {
    event.preventDefault();
    if(!message.trim())return;
    try {await navigator.clipboard.writeText(message);setFeedback('copied');}
    catch {field.current?.focus();field.current?.select();setFeedback('selected');}
  }
  async function copyAddress() {
    try {await navigator.clipboard.writeText(jarcar.place);setAddressFeedback('Dirección copiada');}
    catch {setAddressFeedback('Seleccioná y copiá la dirección indicada');}
  }
  const contactHref=`https://wa.me/${jarcar.whatsAppPotential}?text=${encodeURIComponent(message)}`;
  return <div className="j17-visit">
    <section className="j17-v-hero" aria-labelledby="j17-v-title"><div className="j17-v-copy"><div className="j17-v-eyebrow"><span>JARCAR MOTORS</span><span>PAVAS, SAN JOSÉ</span></div><div className="j17-v-head"><span className="j17-v-kicker">VISITANOS / CONTACTO</span><h1 id="j17-v-title">EL SIGUIENTE<br/>PASO ES <em>VENIR.</em></h1><p>Después de explorar, comparar y guardar, lo que sigue es venir a ver el carro en persona. Te esperamos en Pavas, San José.</p><div className="j17-v-hero-actions"><a href={jarcar.maps} target="_blank" rel="noopener noreferrer" className="j17-v-primary">Cómo llegar <ArrowUpRight size={21}/></a><a href="#consulta" className="j17-v-secondary">Prepará tu consulta <ArrowDown size={18}/></a></div></div><div className="j17-v-hero-foot"><span>100 M NORTE DE BOMBEROS DE PAVAS</span><span>JARCAR / COSTA RICA</span></div></div><div className="j17-v-visual"><img src="/jarcar-v4/design/visit-pavas-arrival.webp" alt="Llegada a un showroom automotriz tropical en Costa Rica" loading="eager"/><div className="j17-v-visual-overlay" aria-hidden="true"/><span className="j17-v-visual-label">ENCONTRANOS<br/>EN PAVAS.</span><div className="j17-v-visual-card"><MapPin size={26}/><span>100 metros norte de la estación de Bomberos de Pavas.<strong>San José, Costa Rica</strong></span></div></div></section>

    <section className="j17-v-contact-rail ja-frame" aria-label="Opciones de contacto"><a href={jarcar.maps} target="_blank" rel="noopener noreferrer"><span className="j17-v-contact-icon"><Route size={27}/></span><span><small>01 / DIRECCIÓN</small><strong>Encontranos en Maps</strong><em>Indicaciones para llegar</em></span><ArrowUpRight size={20}/></a><a href={jarcar.phoneHref}><span className="j17-v-contact-icon"><Phone size={26}/></span><span><small>02 / LLAMADA</small><strong>{jarcar.phone}</strong><em>Contactá a Jarcar Motors</em></span><ArrowUpRight size={20}/></a><a href="#consulta"><span className="j17-v-contact-icon"><MessageCircle size={27}/></span><span><small>03 / TU CONSULTA</small><strong>Preguntá por una unidad</strong><em>Con vehículo y motivo</em></span><ArrowRight size={20}/></a></section>

    <section className="j17-v-map-section ja-frame" aria-labelledby="j17-v-map-title"><div className="j17-v-section-head"><div><span className="j17-v-kicker">01 / ENCONTRANOS</span><h2 id="j17-v-map-title">Nos vemos<br/><em>en Pavas.</em></h2></div><div><p>{jarcar.place}</p><button type="button" onClick={()=>void copyAddress()}><Copy size={16}/> Copiar dirección</button><span role="status" className="j17-v-copy-status">{addressFeedback}</span></div></div><GoogleMap/><div className="j17-v-map-bottom"><div><Clock3 size={19}/><span>Antes de salir, confirmá el horario y la disponibilidad del vehículo que te interesa.</span></div><a href={jarcar.instagram} target="_blank" rel="noopener noreferrer"><Instagram size={18}/> Instagram oficial <ArrowUpRight size={16}/></a></div></section>

    <section id="consulta" className="j17-v-inquiry" aria-labelledby="j17-v-form-title" ref={form} tabIndex={-1}><div className="ja-frame j17-v-inquiry-grid"><div className="j17-v-inquiry-copy"><span className="j17-v-kicker">02 / EMPECEMOS A CONVERSAR</span><h2 id="j17-v-form-title">HABLEMOS<br/>DE <em>TU PRÓXIMO</em><br/>CARRO.</h2><p>Elegí qué querés consultar. Podés incluir un vehículo específico y agregar preguntas antes de abrir el mensaje en tu aplicación de mensajería.</p><div className="j17-v-inquiry-note"><span>JARCAR MOTORS</span><strong>Tu consulta, con el contexto correcto.</strong><p>Sin cuentas, sin registros y sin volver a escribir el modelo que estabas mirando.</p></div><Link className="j17-v-catalog" to={catalogPath}>Seguir explorando carros <ArrowUpRight size={17}/></Link></div>
      <form onSubmit={e=>void copy(e)} className="j17-v-form"><div className="j17-v-form-head"><span>PREPARÁ TU MENSAJE</span><span>01 — 03</span></div><div className="j17-v-selectors"><label><span>Motivo de la consulta</span><span className="j17-v-select"><select value={topic} onChange={e=>changeParam('motivo',e.target.value)}>{topics.map(t=><option value={t.id} key={t.id}>{t.label}</option>)}</select><ChevronDown size={18}/></span></label><label><span>Vehículo (opcional)</span><span className="j17-v-select"><select value={vehicle?.demoId??''} disabled={inventory.isPending||inventory.isError} onChange={e=>changeParam('unidad',e.target.value)}><option value="">{inventory.isPending?'Cargando vehículos…':'Consulta general'}</option>{inventory.data?.map(v=><option value={v.demoId} key={v.demoId}>{nameOf(v)} {v.year}</option>)}</select><ChevronDown size={18}/></span></label></div>
      {vehicle&&<Link className="j17-v-selected" to={detailPath(vehicle.demoId)}><Picture photo={vehicle.cover} sizes="108px" decorative/><span><small>ESTÁS CONSULTANDO POR</small><strong>{nameOf(vehicle)} · {vehicle.year}</strong><span>{priceText(vehicle)}</span></span><ArrowUpRight size={18}/></Link>}
      {inventory.isError&&<p className="j17-v-form-alert" role="status">El inventario no pudo cargarse. Podés preparar una consulta general.</p>}
      {requested&&inventory.data&&!vehicle&&<p className="j17-v-form-alert" role="status">La unidad del enlace no se encontró. Elegí otra opción.</p>}
      <label htmlFor="j17-v-message" className="j17-v-message-label">Mensaje</label><textarea id="j17-v-message" rows={5} maxLength={1200} value={message} onChange={e=>setMessage(e.target.value)} ref={field}/><div className="j17-v-question-wrap"><span>AGREGÁ UNA PREGUNTA</span><div>{questions.map(q=><button key={q} type="button" disabled={message.includes(q)} onClick={()=>addQuestion(q)}>{message.includes(q)?<Check size={14}/>:<span aria-hidden="true">+</span>}{q}</button>)}</div></div>
      <div className="j17-v-actions"><a href={contactHref} target="_blank" rel="noopener noreferrer" className="j17-v-send" aria-disabled={!message.trim()} onClick={e=>{if(!message.trim())e.preventDefault();}}>Abrir conversación <ArrowUpRight size={20}/></a><button type="submit" className="j17-v-copy-button"><Copy size={17}/>{feedback==='copied'?'Copiado':'Copiar mensaje'}</button></div>
      <div className="j17-v-form-foot"><p>El mensaje se abre en tu aplicación de mensajería; no se envía desde esta web.</p><span role="status" aria-live="polite">{feedback==='selected'?'Seleccioná el texto y copialo desde el dispositivo.':feedback==='copied'?'Mensaje copiado al portapapeles.':''}</span></div></form></div></section>
  </div>;
}
