import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { Home } from './Home';
import { Shell } from './Shell';
import { GarageProvider } from './state';
import { catalogPath, root } from './paths';
import './estudio.css';
import './rebirth.css';

const Catalog = lazy(() => import('./Catalog').then(({ Catalog }) => ({ default: Catalog })));
const SavedPage = lazy(() => import('./SavedPage').then(({ SavedPage }) => ({ default: SavedPage })));
const Compare = lazy(() => import('./Compare').then(({ Compare }) => ({ default: Compare })));
const Detail = lazy(() => import('./Detail').then(({ Detail }) => ({ default: Detail })));
const RouteFinder = lazy(() => import('./RouteFinder').then(({ RouteFinder }) => ({ default: RouteFinder })));
const Conocenos = lazy(() => import('./Conocenos').then(({ Conocenos }) => ({ default: Conocenos })));
const Visit = lazy(() => import('./Visit').then(({ Visit }) => ({ default: Visit })));
const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false, refetchOnWindowFocus: false } } });
const pageLoading = <p className="ja-frame ja-page-status" role="status">Cargando…</p>;

// Facilita abrir la raiz del proyecto sin perder la ruta principal.
if (window.location.pathname === '/') {
  window.history.replaceState(null, '', '/jarcar' + window.location.search + window.location.hash);
}

const node = document.getElementById('root');
if (node) createRoot(node).render(
  <QueryClientProvider client={client}>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <GarageProvider>
        <Routes>
          <Route path={root} element={<Shell />}>
            <Route index element={<Home />} />
            <Route path="inventario" element={<Suspense fallback={pageLoading}><Catalog /></Suspense>} />
            <Route path="inventario/:demoId" element={<Suspense fallback={pageLoading}><Detail /></Suspense>} />
            <Route path="tu-ruta" element={<Suspense fallback={pageLoading}><RouteFinder /></Suspense>} />
            <Route path="guardados" element={<Suspense fallback={pageLoading}><SavedPage /></Suspense>} />
            <Route path="comparar" element={<Suspense fallback={pageLoading}><Compare /></Suspense>} />
            <Route path="jarcar-motors" element={<Suspense fallback={pageLoading}><Conocenos /></Suspense>} />
            <Route path="visitanos" element={<Suspense fallback={pageLoading}><Visit /></Suspense>} />
            <Route path="*" element={<section className="ja-frame ja-page-status"><h1>Esta página no está disponible.</h1><Link to={catalogPath} className="ja-button">Ir al inventario</Link></section>} />
          </Route>
        </Routes>
      </GarageProvider>
    </BrowserRouter>
  </QueryClientProvider>,
);
