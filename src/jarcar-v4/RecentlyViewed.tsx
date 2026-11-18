import { ArrowRight, ArrowUpRight, History, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { nameOf, priceText, type JarcarVehicle } from './data';
import { catalogPath, detailPath } from './paths';
import { Picture } from './ui';
import { clearRecent, readRecent, recentChangeEvent } from './recent';

export function RecentlyViewed({ vehicles }: { vehicles: readonly JarcarVehicle[] }) {
  const [recent, setRecent] = useState<string[]>(readRecent);
  useEffect(() => { const refresh=()=>setRecent(readRecent());window.addEventListener(recentChangeEvent,refresh);window.addEventListener('storage',refresh);return()=>{window.removeEventListener(recentChangeEvent,refresh);window.removeEventListener('storage',refresh);}; }, []);
  const shown = recent.map(id => vehicles.find(vehicle => vehicle.demoId === id)).filter((v): v is JarcarVehicle => !!v).slice(0,4);
  if (!shown.length) return null;
  return <section className="r10-history" aria-labelledby="r10-history-title">
    <div className="r10-history-heading"><div><span className="r10-kicker"><History size={15}/> RETOMÁ DONDE QUEDASTE</span><h2 id="r10-history-title">Tus últimas <em>miradas.</em></h2></div><button type="button" className="r10-clear" onClick={() => { clearRecent(); setRecent([]); }}><Trash2 size={16}/> Limpiar historial</button></div>
    <div className="r10-history-grid">{shown.map(v => <Link to={detailPath(v.demoId)} key={v.demoId} className="r10-history-item"><Picture photo={v.cover} className="r10-history-image" sizes="(max-width:620px) 80vw,25vw"/><div><span>{v.year}</span><h3>{nameOf(v)}</h3><strong>{priceText(v)}</strong></div><ArrowUpRight className="r10-history-arrow" size={22}/></Link>)}</div>
    <Link to={catalogPath} className="r10-history-catalog">Seguí descubriendo <ArrowRight size={17}/></Link>
  </section>;
}
