import { ArrowUpRight, MapPin } from 'lucide-react';
import { jarcar } from './business';
import './google-map.css';

/** Maps embed without API credentials. Directions use Jarcar's confirmed Google place ID. */
export function GoogleMap({ compact = false }: { compact?: boolean }) {
  return <div className={`j8-map${compact ? ' j8-map-compact' : ''}`}>
    <div className="j8-map-stage">
      <iframe
        title="Google Maps: ubicación de Jarcar Motors en Pavas, San José"
        src={jarcar.mapsEmbed}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
    <div className="j8-map-footer">
      <div><MapPin size={21} aria-hidden="true" /><span><strong>Jarcar Motors</strong><small>100 metros al norte de Bomberos de Pavas, San José</small></span></div>
      <a href={jarcar.maps} target="_blank" rel="noopener noreferrer">Cómo llegar <ArrowUpRight size={19} aria-hidden="true" /></a>
    </div>
  </div>;
}
