import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUp, ArrowUpRight, Heart, Menu, X, Columns3, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { nameOf, repository, type JarcarVehicle } from './data';
import { Picture } from './ui';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { catalogPath, comparePath, root, visitPath, routePath, aboutPath, savedPath } from './paths';
import { useGarage } from './state';
import { CommandPalette } from './CommandPalette';

const nav = [
  { label: 'Inventario', path: catalogPath },
  { label: 'Tu ruta', path: routePath },
  { label: 'Nosotros', path: aboutPath },
  { label: 'Comparador', path: comparePath },
  { label: 'Visítanos', path: visitPath },
] as const;

function Wordmark() {
  return <Link className="ja-brand" to={root} aria-label="Jarcar Motors, inicio">
    <img width="34" height="34" src="/jarcar-v4/mark.svg" alt="" />
    <span>jarcar<span>.</span><small>motors</small></span>
  </Link>;
}

export function Shell() {
  const { pathname, search, hash } = useLocation();
  const saved = useGarage();
  const { data: stock = [] } = useQuery({ queryKey: ['jarcar-v4', 'inventory'], queryFn: () => repository.vehicles() });
  const selected = saved.compareIds.flatMap(id => stock.find((item: JarcarVehicle) => item.demoId === id) ?? []);
  const compareDockVisible = saved.compareIds.length > 0 && pathname !== comparePath && pathname !== catalogPath && !pathname.startsWith(`${catalogPath}/`);
  const previous = useRef(pathname);
  const progress = useRef<HTMLDivElement>(null);
  const [showTop, setShowTop] = useState(false);

  // A restrained reading-progress cue and return navigation; no animation library.
  useEffect(() => {
    let frame = 0;
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (progress.current) progress.current.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0})`;
        setShowTop(window.scrollY > 850);
      });
    };
    sync();
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', sync); window.removeEventListener('resize', sync); };
  }, [pathname]);

  // R11/P0: universal, resilient scroll motion. Every eligible element, including
  // those initially inside the viewport and routes loaded with Suspense, may enter.
  // Content is never hidden before JS runs or when reduced motion is preferred.
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!('IntersectionObserver' in window) || media.matches) return;
    const selector = [
      '.jx-hero-kicker', '.jx-hero-copy h1', '.jx-hero-lead',
      '.jx-finder-head', '.jx-worlds-heading', '.jx-curated-top', '.jx-curated-item',
      '.ja-c-heading', '.ja-c-machine', '.ja-cc',
      '.jd-heading', '.jd-gallery', '.jd-facts-section', '.jd-related', '.jd-publication',
      '.r9-about-lead', '.r9-about-gallery-header', '.r9-about-location-header',
      '.r9-about-atmosphere-copy', '.jr-intro', '.jr-stage', '.jr-outcome',
      '.ja-visit-intro', '.ja-visit-form', '.j8-about-hero-message', '.j8-about-family',
      '.j16-garage-hero-grid', '.j16-tile', '.j16-garage-empty', '.j16-x-insights', '.j16-x-table-heading',
      '.j12-entrance', '.j12-enter', '.j12-vehicle-card', '.j12-route-machine', '.j12-story-art', '.j12-visit-map',
      '.j17-hero-center', '.j17-statement', '.j17-window-top', '.j17-window-index',
      '.j17-editorial-content', '.j17-location-top', '.j17-v-head', '.j17-v-contact-rail > a',
      '.j17-v-map-section', '.j17-v-form',
    ].join(',');
    const seen = new WeakSet<Element>();
    const liveAnimations = new Set<Animation>();
    let disposed = false;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        const element = entry.target as HTMLElement;
        if (disposed || media.matches || typeof element.animate !== 'function') continue;
        const index = Array.from(element.parentElement?.children ?? []).indexOf(element);
        const delay = element.classList.contains('ja-cc') || element.classList.contains('jx-curated-item')
          ? Math.min(Math.max(index, 0), 4) * 45 : 0;
        // Respect currently running CSS transitions and page visibility; don't
        // animate elements hidden by a modal or a route teardown.
        if (!element.isConnected || element.closest('[hidden], [inert]')) continue;
        let animation: Animation;
        try { animation = element.animate([
          { opacity: 0.45, transform: 'translate3d(0, 18px, 0)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' },
        ], { duration: 520, delay, easing: 'cubic-bezier(.22,.8,.23,1)', fill: 'both' }); } catch { continue; }
        liveAnimations.add(animation);
        animation.addEventListener('finish', () => { liveAnimations.delete(animation); animation.cancel(); }, { once: true });
        animation.addEventListener('cancel', () => liveAnimations.delete(animation), { once: true });
      }
    }, { threshold: 0.075, rootMargin: '0px 0px -4% 0px' });
    const scan = () => {
      document.querySelectorAll<HTMLElement>(selector).forEach(element => {
        if (seen.has(element)) return;
        seen.add(element);
        // Do not add opacity:0 classes. Inaccessible or unsupported browsers
        // always display the whole page with no dependency on this observer.
        observer.observe(element);
      });
    };
    // Remove artifacts left by the older R9 reveal implementation during HMR.
    document.querySelectorAll('.r9-reveal').forEach(element => element.classList.remove('r9-reveal', 'r9-visible'));
    scan();
    const target = document.getElementById('ja-main');
    const mutations = new MutationObserver(scan);
    if (target) mutations.observe(target, { childList: true, subtree: true });
    const cancelForReducedMotion = () => {
      if (media.matches) liveAnimations.forEach(animation => animation.cancel());
    };
    media.addEventListener('change', cancelForReducedMotion);
    return () => {
      disposed = true;
      observer.disconnect();
      mutations.disconnect();
      media.removeEventListener('change', cancelForReducedMotion);
      liveAnimations.forEach(animation => animation.cancel());
      liveAnimations.clear();
    };
  }, [pathname]);

  useLayoutEffect(() => {
    if (pathname === previous.current) return;
    previous.current = pathname;
    window.scrollTo(0, 0);
    document.getElementById('ja-main')?.focus({ preventScroll: true });
  }, [pathname]);

  useEffect(() => {
    if (hash) {
      const anchor = document.getElementById(hash.slice(1));
      anchor?.scrollIntoView({ block: 'start' });
    }
  }, [hash, pathname]);

  useEffect(() => {
    const page = pathname.replace(/\/$/, '');
    if (page.startsWith(`${catalogPath}/`)) return;
    const viewed = nav.find((item) => item.path === page);
    const title = page === savedPath || (page === catalogPath && new URLSearchParams(search).get('favoritos') === '1')
      ? 'Guardados' : viewed?.label ?? 'Hay carros. Y hay historias.';
    document.title = `${title} — Jarcar Motors`;
  }, [pathname, search]);

  return <>
    <a className="ja-skip" href="#ja-main">Saltar al contenido</a>
    <div className="r9-reading-progress" aria-hidden="true"><div ref={progress}/></div>
    <header className="ja-header ja-header-pinned">
      <div className="ja-frame ja-header-inner">
        <Wordmark />
        <nav className="ja-primary-nav" aria-label="Navegación principal">
          {nav.map(({ label, path }) => <NavLink key={path} to={path}>
            {label}{path === comparePath && saved.compareIds.length > 0 && <span className="ja-count">{saved.compareIds.length}</span>}
          </NavLink>)}
        </nav>
        <div className="ja-header-actions">
          <CommandPalette/>
          <Link className="ja-saved" to={savedPath} aria-label="Vehículos guardados">
            <Heart size={19} aria-hidden="true" /><span>Guardados</span>{saved.savedIds.length > 0 && <b className="ja-count">{saved.savedIds.length}</b>}
          </Link>
          <Dialog.Root>
            <Dialog.Trigger className="ja-menu-trigger" aria-label="Abrir menú"><Menu size={23} /></Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="ja-nav-overlay" />
              <Dialog.Content className="ja-nav-dialog" aria-describedby={undefined}>
                <Dialog.Title>Jarcar Motors</Dialog.Title>
                <Dialog.Close className="ja-nav-close" aria-label="Cerrar menú"><X size={23} /></Dialog.Close>
                <nav aria-label="Navegación móvil">
                  {[{ label: 'Inicio', path: root }, ...nav, { label: 'Guardados', path: savedPath }].map(({ label, path }) =>
                    <Dialog.Close key={path} asChild><Link to={path}>{label}<ArrowUpRight size={19} aria-hidden="true" /></Link></Dialog.Close>,
                  )}
                </nav>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
    <div className="ja-header-spacer" aria-hidden="true" />
    <main id="ja-main" tabIndex={-1}><Outlet /></main>
    <button type="button" className="r9-back-top" data-visible={showTop} onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })} aria-label="Volver arriba" tabIndex={showTop ? 0 : -1}><ArrowUp size={20}/></button>
    {compareDockVisible && <aside className="j18-compare-dock" aria-label="Tu comparación pendiente">
      <div className="j18-dock-intro"><span className="j18-dock-icon"><Columns3 size={19} aria-hidden="true"/></span><span><strong>Tu comparación</strong><small>{saved.compareIds.length} de 3 vehículos</small></span></div>
      <div className="j18-dock-cars" aria-label="Vehículos agregados">{selected.map(car => <div key={car.demoId} className="j18-dock-car" title={nameOf(car)}><Picture photo={car.cover} sizes="62px" decorative/><button type="button" onClick={() => saved.removeCompare(car.demoId)} aria-label={`Quitar ${nameOf(car)} de la comparación`}><X size={13}/></button></div>)}</div>
      <Link to={comparePath} className="j18-dock-action">Comparar ahora <ArrowUpRight size={16}/></Link>
      <button type="button" className="j18-dock-dismiss" onClick={() => selected.forEach(car => saved.removeCompare(car.demoId))} aria-label="Vaciar comparación" title="Vaciar comparación"><Trash2 size={17}/></button>
    </aside>}
    <footer className="ja-footer">
      <div className="ja-frame ja-footer-main">
        <div><Wordmark /><p>Autos nuevos y usados en Pavas, San José.</p></div>
        <nav aria-label="Enlaces de pie de página">{nav.map(({ label, path }) => <Link to={path} key={path}>{label}<ArrowUpRight size={16} aria-hidden="true" /></Link>)}</nav>
        <div className="ja-footer-address"><strong>Jarcar Motors, Costa Rica</strong><p>100 m al norte de la estación de Bomberos de Pavas.</p><a href="https://www.instagram.com/jarcar.motorscr/" target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={15} aria-hidden="true" /></a></div>
      </div>
      <div className="ja-frame ja-footer-base"><span>Jarcar Motors</span><span>© {new Date().getFullYear()} Jarcar Motors · San José, Costa Rica</span></div>
    </footer>
  </>;
}

import './r7.css';
import './r8.css';

import './r9.css';

import './r10.css';
import './r11-motion.css';

import './r12-design.css';

import './r16-global.css';
import './r18-polish.css';
import './r19-polish.css';
import './r25-pinned-header.css';
