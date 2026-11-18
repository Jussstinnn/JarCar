'use strict';
/* R20: checks source structure/data integrity, NOT a browser build or visual QA. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('./_typescript.cjs');
const port = require('./_port.cjs');
const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
let checks = 0;
function check(ok, message) { assert.ok(ok, message); checks++; }
const home = read('src/jarcar-v4/Home.tsx');
const catalog = read('src/jarcar-v4/Catalog.tsx');
const detail = read('src/jarcar-v4/Detail.tsx');
const shell = read('src/jarcar-v4/Shell.tsx');
const css = read('src/jarcar-v4/r20-mobile-showroom.css');
const pkg = JSON.parse(read('package.json'));
const seed = JSON.parse(read('src/jarcar-v3/data/vehicles.seed.json'));
check(/^\d{4,5}$/.test(port), 'Puerto válido de desarrollo');
check(Number(pkg.version.split('.')[0]) >= 20, 'Continuidad de funcionalidades R20');
check(fs.existsSync(path.join(root, 'INICIAR_JARCAR.bat')), 'BAT de arranque');
check(fs.existsSync(path.join(root, 'VERIFICAR_JARCAR.bat')), 'BAT de verificación');
check(catalog.includes('import "./r20-mobile-showroom.css"') && detail.includes("import './r20-mobile-showroom.css'"), 'CSS R20 importado después de cada CSS de página');
check(seed.totalRegistros === 35 && seed.vehicles.length === 35, '35 registros originales');
const known = new Set(seed.vehicles.map(v => v.id));
const homeIds = [...home.match(/const heroIds = \[([^\]]+)\]/)[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
check(homeIds.length === 4, 'La Home conserva cuatro vehículos de portada');
for (const id of homeIds) check(known.has(id), `Vehículo destacado existente: ${id}`);
check(!catalog.includes('CatalogOpening') && !catalog.includes('CatalogIntro'), 'Inventario no recupera su banner obsoleto');
check(home.includes('window.setInterval') && home.includes('6200'), 'Rotación Home conserva intervalo');
check(catalog.includes('j20-filter-panel'), 'Inventario conserva búsqueda y filtros sin banner');
check(home.includes('setPaused(true)'), 'Pausa del carrusel de Home al interactuar');
check(home.includes('prefers-reduced-motion: reduce'), 'Movimiento reducido respetado en Home');
for (const [name, source, str] of [
 ['Panel móvil de filtros',catalog,'j20-filter-panel'],
 ['Control de expansión',catalog,'aria-expanded={mobileFilters}'],
 ['Estado de filtros abiertos',catalog,'data-open={mobileFilters}'],
 ['Resultados de aplicar filtros',catalog,'j20-filter-apply'],
 ['Deslizamiento táctil de tarjetas',catalog,'onTouchEnd={event =>'],
 ['Bloqueo de navegación tras deslizar',catalog,'ignoreNextClick.current'],
 ['Indicador para gesto táctil',catalog,'j20-swipe-hint'],
 ['Galería móvil con guía',detail,'j20-gallery-swipe'],
 ['Miniaturas siempre visibles',detail,'ensureVisible(inlineRail.current'],
 ['Miniaturas en diálogo',detail,'ensureVisible(thumbRail.current'],
 ['Búsqueda móvil no oculta',css,'.ja-c-filter-grid>:not(:first-child)'],
 ['Inventario sin banner al abrir',catalog,'j20-filter-panel'],
 ['Tarjetas móvil',css,'.j13-products .j13-vehicle'],
 ['Precio en móvil',css,'.jd-price-block strong'],
 ['Acción fija de consulta',css,'.r10-mobile-decision'],
 ['CSS de accesibilidad de movimiento',css,'prefers-reduced-motion:reduce'],
]) check(source.includes(str), name);
for (const f of ['Home.tsx','Catalog.tsx','Detail.tsx','Shell.tsx']) {
 const file = path.join(root,'src/jarcar-v4',f);
 const parsed = ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 check(parsed.parseDiagnostics.length === 0, `Sintaxis React de ${f}`);
}
const photoFiles=fs.readdirSync(path.join(root,'public/jarcar-v3/vehicles')).filter(name=>name.endsWith('.webp'));
check(photoFiles.length===445,'Las 445 variantes fotográficas continúan');
check(!fs.existsSync(path.join(root,'backend')), 'No se añadió backend');
console.log(`R20 PASS: ${checks} verificaciones de continuidad, fuentes, fotos, puerto y sintaxis. No se han ejecutado React/Vite ni pruebas visuales.`);
