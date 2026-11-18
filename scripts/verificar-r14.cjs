const PORT = require('./_port.cjs');
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');const file=p=>fs.readFileSync(path.join(root,p),'utf8');const exists=p=>fs.existsSync(path.join(root,p));let checks=0;
function check(condition,msg){assert.ok(condition,msg);checks++}
const detail=file('src/jarcar-v4/Detail.tsx');const css=file('src/jarcar-v4/r14-detail.css');
for(const p of ['src/jarcar-v4/Detail.tsx','src/jarcar-v4/r14-detail.css','src/jarcar-v4/main.tsx','src/jarcar-v3/data/photos.json','src/jarcar-v3/data/vehicles.seed.json','INICIAR_JARCAR.bat','VERIFICAR_JARCAR.bat']) check(exists(p),'Falta '+p);
const requirements=[
  ['Estructura editorial', 'j14-masthead'],['Precio y consulta contextual','jd-decision-top'],['Galería principal','jd-photo-trigger'],
  ['Tira fotográfica', 'j14-filmstrip'],['Miniatura seleccionada','aria-pressed={selected === index}'],
  ['Progreso fotográfico','j14-photo-progress'],['Controles por teclado','function arrowKeys'],['Swipe táctil','function endTouch'],
  ['Zoom modal accesible','<Dialog.Content'],['Restauración de foco','onCloseAutoFocus'],
  ['Especificaciones','j14-fact-icon'],['Datos no verificados','Por confirmar'],
  ['Listado desplegable','j14-check-disclosure'],['Persistencia local revisión','localStorage.setItem'],
  ['Comparador conservado','toggleCompare'],['Guardados conservados','toggleSaved'],
  ['Compartir público/local','localOnly'],['Fallback compartición local','La dirección local no es pública'],
  ['Visita contextual','motivo: \'visita\''],['Relacionados','<Related'],['CTA móvil','r10-mobile-decision'],
  ['Estados de error','detail.isError'],['Sin backend','repository.detail(demoId)']
];for(const [label,part] of requirements)check(detail.includes(part),'Falta '+label);
for(const selector of ['.j14-detail','.j14-masthead','.j14-header-grid','.j14-detail .jd-decision','.j14-filmstrip','.j14-photo-progress','.j14-detail .jd-facts','.j14-visit-band','.j14-check-disclosure','.j14-detail .jd-related'])check(css.includes(selector),'CSS: '+selector);
for(const bp of [1150,900,690,490])check(css.includes(`max-width:${bp}px`),'Falta breakpoint '+bp);
check(css.includes('prefers-reduced-motion'),'Reduce motion');check(css.includes('@media print'),'Impresión');
check(!/fetch\s*\(\s*['"`]\/api\//.test(detail),'F4 no debe llamar backend');
const vehicles=JSON.parse(file('src/jarcar-v3/data/vehicles.seed.json')).vehicles;const photos=JSON.parse(file('src/jarcar-v3/data/photos.json'));
check(vehicles.length===35,'Inventario incompleto');check(Object.values(photos).reduce((a,v)=>a+v.length,0)===149,'Fotografías incompletas');
let variantCount=0;for(const [id,list] of Object.entries(photos)){check(vehicles.some(v=>v.id===id),'Foto sin unidad '+id);for(const photo of list){check(photo.variants.length>=1,'Foto sin variante '+id);for(const variant of photo.variants){check(variant.src.startsWith('/jarcar-v3/vehicles/'),'Ruta externa');check(exists('public'+variant.src),'No existe '+variant.src);variantCount++}}}
check(variantCount===445,'Esperadas 445 variantes WebP');
const pkg=JSON.parse(file('package.json'));check(pkg.scripts.dev.includes(PORT)&&file('vite.config.ts').includes(PORT)&&file('INICIAR_JARCAR.bat').includes(PORT),'Puerto de R14 inconsistente');
const tsPaths=[];const scan=dir=>{for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const rel=path.join(dir,entry.name);if(entry.isDirectory())scan(rel);else if(/\.tsx?$/.test(entry.name))tsPaths.push(rel)}};scan('src');
let ts;try{ts=require('typescript')}catch{try{ts=require('./_typescript.cjs')}catch{}}
if(ts)for(const f of tsPaths){const ast=ts.createSourceFile(f,file(f),ts.ScriptTarget.Latest,true,f.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);check(ast.parseDiagnostics.length===0,`Parse falló ${f}`)}
else console.log('TypeScript local no disponible: la sintaxis debe verificarse con npm run check');
console.log(`JARCAR R14/F4: ${checks} comprobaciones offline PASS (${vehicles.length} vehículos, 149 fotografías y ${variantCount} variantes).`);
console.log('Build React/Vite y pruebas visuales reales: no incluidas en estas comprobaciones.');
