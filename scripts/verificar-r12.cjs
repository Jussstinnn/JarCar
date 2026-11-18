const PORT = require('./_port.cjs');
'use strict';
const fs=require('node:fs'), path=require('node:path'), assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'), read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
let checks=0;const pass=(ok,reason)=>{assert.ok(ok,reason);checks++};
const home=read('src/jarcar-v4/Home.tsx'),shell=read('src/jarcar-v4/Shell.tsx');
const css=read('src/jarcar-v4/r12-home.css'),global=read('src/jarcar-v4/r12-design.css');
for(const fn of ['src/jarcar-v4/r12-home.css','src/jarcar-v4/r12-design.css','src/jarcar-v4/Home.tsx','public/jarcar-v4/design/editorial-journey.svg','PLAN_MAESTRO_JARCAR_FRONTEND.md','INICIAR_JARCAR.bat','VERIFICAR_JARCAR.bat'])pass(fs.existsSync(path.join(root,fn)),`Falta ${fn}`);
for(const [name,pattern] of [
 ['hero accesible',/aria-labelledby="j12-hero-title"/],
 ['selector de escenas',/onClick=\{\(\)=>setActive\(index\)\}/],
 ['teclado de escenas',/e\.key === 'ArrowRight'/],
 ['cambio de imagen escena',/key=\{current\.demoId\}/],
 ['búsqueda real a catálogo',/nav\(catalogPath \+/],
 ['filtros de URL',/p\.set\('tipo',segment\)/],
 ['navegación categorías',/onClick=\{\(\)=>setActive\(index\)\}/],
 ['selección real',/galleryIds\.flatMap/],
 ['guardados funcional',/toggleSaved\(vehicle\.demoId\)/],
 ['ruta interactiva',/getRouteResults\(vehicles,selected,0\)/],
 ['historial real',/RecentlyViewed vehicles=\{vehicles\}/],
 ['mapa real',/<GoogleMap compact\s*\/>/],
 ['imagen abstracta propia',/editorial-journey\.svg/],
])pass(pattern.test(home),`Falta ${name}`);
for(const selector of ['.j12-hero','.j12-discovery-frame','.j12-selection-grid','.j12-route-machine','.j12-story','.j12-visit'])pass(css.includes(selector),`Falta CSS ${selector}`);
for(const bp of [1180,900,650,380])pass(css.includes(`max-width:${bp}px`),`Falta adaptación ${bp}`);
pass(css.includes('prefers-reduced-motion'),'falta movimiento reducido');
pass(global.includes('max-width:1040px')&&global.includes('.ja-primary-nav{display:none'),'falta header responsive tablet');
pass(shell.includes("'.j12-entrance'")&&shell.includes("'.j12-vehicle-card'"),'faltan observadores de animación R12');
pass(shell.includes("'./r12-design.css'")&&home.includes("'./r12-home.css'"),'Estilos R12 no importados');
pass(!/fetch\([^)]*\/api\//.test(home),'No usar backend');
const pkg=JSON.parse(read('package.json'));
pass(pkg.scripts.dev.includes(PORT)&&read('vite.config.ts').includes(PORT)&&read('INICIAR_JARCAR.bat').includes(PORT),'Puerto exclusivo actual inconsistente');
const vehicles=JSON.parse(read('src/jarcar-v3/data/vehicles.seed.json')).vehicles;
pass(vehicles.length===35,'Se perdió el inventario de 35');
const photo=JSON.parse(read('src/jarcar-v3/data/photos.json'));
pass(Object.values(photo).reduce((n,items)=>n+items.length,0)===149,'Se perdió alguna de las 149 fotografías');
const ids=[...home.matchAll(/'(?:ford-f150-raptor-2019|mini-aceman-s-2025|toyota-cressida-1984|toyota-bz5-2025|chevrolet-colorado-ltz-2024|tesla-model-3-2021|volkswagen-escarabajo-super-beetle-1975|bmw-325i-2012|toyota-hilux-2021|jeep-wrangler-sahara-2010|hyundai-accent-gl-2015|toyota-bz3-2025)'/g)].map(x=>x[0].slice(1,-1));
pass(ids.length>=10,'pocas unidades mapeadas para distintas secciones');
for(const id of ids)pass(vehicles.some(vehicle=>vehicle.id===id),`No existe unidad ${id}`);
let ts;
try{ ts=require('typescript'); }
catch{ try{ ts=require('./_typescript.cjs'); }
catch{ ts=null; }}
if (ts) for(const dir of ['src/jarcar-v4','src/jarcar-v3','src/jarcar-v3/data']){
 for(const name of fs.readdirSync(path.join(root,dir)).filter(x=>/\.tsx?$/.test(x))){
  const f=path.join(dir,name);const sf=ts.createSourceFile(f,read(f),ts.ScriptTarget.Latest,true,name.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  pass(!sf.parseDiagnostics.length,`Error sintáctico en ${f}: ${sf.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join('; ')}`);
 }
}
if (!ts) console.log('TypeScript parser no disponible; verificar después de npm install.');
console.log(`R12 F1+F2: ${checks} verificaciones estáticas PASS. Build React/QA funcional aún requieren npm.`);
