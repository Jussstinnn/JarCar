import { ImageOff } from 'lucide-react';
import { useState } from 'react';
import type { Photo } from './data/vehicle';

export function Picture({ photo, sizes, priority = false, eager = false, decorative = false, className = '' }: {
  photo?: Photo | null;
  sizes: string;
  priority?: boolean;
  eager?: boolean;
  decorative?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState<string>();
  const variant = photo?.variants.at(-1);
  const priorityAttribute = priority ? { fetchpriority: 'high' } : {};

  return <div className={`jp-picture ${className}`}>
    {photo && variant && failed !== photo.id ? <img
      src={variant.src} srcSet={photo.variants.map(({ src, width }) => `${src} ${width}w`).join(', ')} sizes={sizes}
      width={variant.width} height={variant.height} alt={decorative ? '' : photo.alt}
      loading={priority || eager ? 'eager' : 'lazy'} decoding={priority ? 'auto' : 'async'} {...priorityAttribute}
      onError={() => setFailed(photo.id)}
    /> : <div className="jp-no-photo" aria-hidden={decorative || undefined}><ImageOff size={24} /><span>Fotografía no disponible</span></div>}
  </div>;
}
