const PORT = require('./_port.cjs');
'use strict';
const fs = require('node:fs'); const path = require('node:path'); const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = filename => fs.readFileSync(path.join(root, filename), 'utf8');
const exists = filename => fs.existsSync(path.join(root, filename));
let tests = 0; const ok = (value, reason) => { assert.ok(value, reason); tests++; };
const catalog = read('src/jarcar-v4/Catalog.tsx'), css = read('src/jarcar-v4/r13-catalog.css');
for (const file of ['src/jarcar-v4/r13-catalog.css', 'src/jarcar-v4/Catalog.tsx', 'src/jarcar-v3/data/vehicles.seed.json', 'src/jarcar-v3/data/photos.json', 'INICIAR_JARCAR.bat','VERIFICAR_JARCAR.bat']) ok(exists(file),`Falta ${file}`);
const requirements = [
  [/function CatalogOpening/, 'apertura editorial'],
  [/j13-opening-chooser/, 'portada con navegación'],
  [/function CatalogPause/, 'interludio editorial'],
  [/setPhotoIndex\(value => \(value \+ 1\) % count\)/, 'siguiente foto en tarjetas'],
  [/setPhotoIndex\(value => \(value - 1 \+ count\) % count\)/, 'foto anterior en tarjetas'],
  [/aria-label=\{`Fotografía siguiente/, 'accesibilidad controles fotos'],
  [/data-view=\{viewMode\}/, 'vista galería/índice'],
  [/viewMode === 'indice'/, 'vista índice'],
  [/visibleResults = results\.slice\(0, visibleCount\)/, 'paginación local'],
  [/setVisibleCount\(n => n \+ 12\)/, 'cargar más funcional'],
  [/applySearch\(data,/, 'búsqueda existente conservada'],
  [/onQuick=\{\(\) => setQuick\(item\)\}/, 'vista rápida conservada'],
  [/onSave=\{\(\) => toggleSaved\(item.demoId\)\}/, 'favoritos conservados'],
  [/onCompare=\{\(\) => toggleCompare\(item.demoId\)\}/, 'comparación conservada'],
  [/import "\.\/r13-catalog\.css"/, 'CSS final importado'],
];
for (const [pattern,name] of requirements) ok(pattern.test(catalog),`Falta ${name}`);
for (const sel of ['.j13-opening','.j13-opening-photo-title','.j13-products[data-view=indice]','.j13-collection-pause','.j13-card-photo-controls','.j13-view-switch','.j13-load-more']) ok(css.includes(sel),`Falta regla ${sel}`);
for (const bp of [1100,830,610,375]) ok(css.includes(`max-width:${bp}px`),`Falta breakpoint ${bp}`);
ok(css.includes('prefers-reduced-motion'), 'Reduce motion missing');
ok(!/\bfetch\s*\(\s*['"`]\/api\//.test(catalog), 'No llamar APIs desde el catálogo');
const vehicles = JSON.parse(read('src/jarcar-v3/data/vehicles.seed.json')).vehicles;
const photos = JSON.parse(read('src/jarcar-v3/data/photos.json'));
ok(vehicles.length===35,'35 vehículos');
ok(Object.values(photos).reduce((n,p)=>n+p.length,0)===149,'149 fotos');
for (const id of ['ford-f150-raptor-2019','mini-aceman-s-2025','toyota-cressida-1984','chevrolet-colorado-ltz-2024']) ok(vehicles.some(v=>v.id===id),`No existe ${id}`);
let ts;
try { ts=require('typescript'); } catch { try { ts=require('./_typescript.cjs'); } catch {} }
if (ts) for (const dir of ['src/jarcar-v4','src/jarcar-v3','src/jarcar-v3/data']) {
  for (const name of fs.readdirSync(path.join(root,dir)).filter(name=>name.endsWith('.ts')||name.endsWith('.tsx'))) {
    const file=path.join(dir,name), source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,name.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
    ok(source.parseDiagnostics.length===0,`Error TS/TSX ${name}: ${source.parseDiagnostics.map(e=>ts.flattenDiagnosticMessageText(e.messageText,' ')).join('; ')}`);
  }
} else console.log('TypeScript parser no disponible; prueba pendiente con npm');
const pkg=JSON.parse(read('package.json'));ok(pkg.scripts.dev.includes(PORT)&&read('vite.config.ts').includes(PORT)&&read('INICIAR_JARCAR.bat').includes(PORT),'Puerto exclusivo R13');
console.log(`JARCAR R13-F3: ${tests} verificaciones offline PASS; compilación/QA de navegador no cubiertas.`);
