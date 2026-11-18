const PORT = require('./_port.cjs');
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const load = p => fs.readFileSync(path.join(root,p),'utf8');
let checks=0;
function ok(cond,why) { assert.ok(cond,why); checks++; }
const required = [
  'src/jarcar-v4/CommandPalette.tsx','src/jarcar-v4/RecentlyViewed.tsx',
  'src/jarcar-v4/recent.ts','src/jarcar-v4/r10.css','src/jarcar-v4/Compare.tsx',
  'src/jarcar-v4/Detail.tsx','src/jarcar-v4/Home.tsx','src/jarcar-v4/Conocenos.tsx',
  'INICIAR_JARCAR.bat','VERIFICAR_JARCAR.bat','vite.config.ts'
];
for(const p of required)ok(fs.existsSync(path.join(root,p)),`Falta ${p}`);
const rules = [
 ['src/jarcar-v4/Shell.tsx',/CommandPalette/,'búsqueda global en cabecera'],
 ['src/jarcar-v4/CommandPalette.tsx',/showModal\(\)/,'diálogo nativo'],
 ['src/jarcar-v4/CommandPalette.tsx',/ArrowDown/,'búsqueda por teclado'],
 ['src/jarcar-v4/CommandPalette.tsx',/normalize\(term\.trim\(\)\)/,'búsqueda normalizada'],
 ['src/jarcar-v4/CommandPalette.tsx',/isTyping/,'sin robar teclado en formularios'],
 ['src/jarcar-v4/Home.tsx',/RecentlyViewed vehicles=/,'historial contextual'],
 ['src/jarcar-v4/Detail.tsx',/rememberVehicle\(vehicle\.demoId\)/,'registro de visita sin datos personales'],
 ['src/jarcar-v4/Detail.tsx',/r10-mobile-decision/,'CTA móvil específico'],
 ['src/jarcar-v4/Catalog.tsx',/r9-quick-actions/,'vista rápida mantenida'],
 ['src/jarcar-v4/Catalog.tsx',/onPhotoKey/,'teclado en galería rápida'],
 ['src/jarcar-v4/Compare.tsx',/selectedIds/,'enlaces de comparación compatibles'],
 ['src/jarcar-v4/Compare.tsx',/isLocal/,'advertencia sobre enlaces localhost'],
 ['src/jarcar-v4/Conocenos.tsx',/(?:r10-editorial-art|j17-editorial-art)/,'arte editorial no fotográfico'],
 ['src/jarcar-v4/r10.css',/prefers-reduced-motion/,'movimiento reducido'],
 ['src/jarcar-v4/r10.css',/safe-area-inset-bottom/,'safe area móvil'],
 ['src/jarcar-v4/r10.css',/max-width:600px/,'adaptación teléfono'],
 ['package.json',new RegExp(PORT),'puerto actual de la entrega'],
 ['vite.config.ts',new RegExp(PORT),'puerto Vite de R10']
];
for(const [p,pattern,why] of rules)ok(pattern.test(load(p)),why);
const rootApps = ['src/jarcar-v4/main.tsx','src/jarcar-v4/Shell.tsx','src/jarcar-v4/Visit.tsx'];
for(const p of rootApps)ok(!/fetch\([^)]*\/api\//.test(load(p)),`API de servidor detectada en ${p}`);
const inventory = JSON.parse(load('src/jarcar-v3/data/vehicles.seed.json')).vehicles;
const pics=JSON.parse(load('src/jarcar-v3/data/photos.json'));
ok(inventory.length===35, '35 unidades conservadas');
ok(Object.values(pics).reduce((a,p)=>a+p.length,0)===149,'149 fotografías conservadas');
ok(inventory.every(v=>typeof v.id==='string' && !!v.marca && !!v.modelo && Number.isFinite(v.precioCRC)),'identificadores y precios');
let ts;
try{ts=require('typescript');}catch { try{ts=require('./_typescript.cjs');}catch {ts=null;} }
if(ts){
 for(const dir of ['src/jarcar-v4','src/jarcar-v3','src/jarcar-v3/data']){
  for(const f of fs.readdirSync(path.join(root,dir)).filter(x=>/\.tsx?$/.test(x))){
   const p=path.join(dir,f), contents=load(p),sf=ts.createSourceFile(p,contents,ts.ScriptTarget.Latest,true,f.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
   ok(sf.parseDiagnostics.length===0,`Error TSX/TS en ${p}: ${sf.parseDiagnostics.map(x=>ts.flattenDiagnosticMessageText(x.messageText,' ')).join('; ')}`);
  }
 }
}
console.log(`R10: ${checks} comprobaciones estáticas PASS. Tipos semánticos y build Vite requieren dependencias.`);
