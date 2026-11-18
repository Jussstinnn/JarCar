const PORT = require('./_port.cjs');
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const load = filename => fs.readFileSync(path.join(root, filename), 'utf8');
const exists = filename => fs.existsSync(path.join(root, filename));
let ts; try { ts = require('typescript'); } catch { ts = require('./_typescript.cjs'); }
const source = load('src/jarcar-v4/route-matcher.ts');
const transpiled = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020},reportDiagnostics:true});
assert.equal(transpiled.diagnostics.length, 0,'Transpilación del selector');
const mod = {};
vm.runInNewContext(transpiled.outputText,{exports:mod,Object,Array,Map,Set,Math,Number,String});
const {getRouteResults,routePlans,routeBudgets} = mod;
const rows=JSON.parse(load('src/jarcar-v3/data/vehicles.seed.json')).vehicles;
const vehicles=rows.map(row=>({demoId:row.id,segment:row.segmentoUX,year:row.anio,price:row.precioCRC,currency:'CRC'}));
let count=0;
const check=(cond,label)=>{assert.ok(cond,label);count++};
check(vehicles.length===35,'Se conservan 35 unidades');
check(routePlans.length===5 && routeBudgets.length===6,'Se conservan 5 usos y 6 presupuestos anteriores');
const ids=new Set(vehicles.map(x=>x.demoId));check(ids.size===vehicles.length,'Sin identificadores repetidos');
for(const plan of routePlans){
  for(let budget=0;budget<=50_000_000;budget+=1_000_000){
    const r=getRouteResults(vehicles,plan.id,budget);
    const routeSegments = new Set(plan.segments);
    const direct = vehicles.filter(v=>routeSegments.has(v.segment)&&v.price>0&&v.currency==='CRC'&&(!budget || v.price<=budget));
    check(r.total===r.matching.length && r.total===direct.length,`${plan.id}/${budget}: coincidencias comprobables`);
    check(r.matching.every(v=>routeSegments.has(v.segment) && (!budget || v.price<=budget)),`${plan.id}/${budget}: criterios del resultado`);
    check(r.alternatives.length===0 || (r.matching.length===0 && !!budget),`${plan.id}/${budget}: alternativas solo cuando corresponda`);
    check(r.alternatives.every(v=>routeSegments.has(v.segment)&&v.price>budget),`${plan.id}/${budget}: alternativas claramente fuera de presupuesto`);
    check(r.exact===(r.total>0),`${plan.id}/${budget}: estado exacto coherente`);
    check(direct.every(v=>ids.has(v.demoId)),`${plan.id}/${budget}: vehículos del inventario existente`);
  }
}
const routeComponent = load('src/jarcar-v4/RouteFinder.tsx');
const catalog = load('src/jarcar-v4/Catalog.tsx');
const routeCss = load('src/jarcar-v4/route-r15.css');
for(const [label,pattern] of [
  ['Tres pasos navegables', 'r15-stepper'],['Uso dinámico','routePlans.map'],['Presupuesto personalizable','r15-budget-slider'],
  ['Orden por precio y año','validOrder'],['Favoritos','toggleSaved'],['Comparación','toggleCompare'],
  ['Compartir criterios','share()'],['Aviso presupuesto','FUERA DE PRESUPUESTO'],['Ruta preservada','catalogQuery'],
  ['Más resultados','setVisibleCount'],['Teclado y foco','aria-pressed'],['Movimiento reducido','prefers-reduced-motion'],
]) check((routeComponent+routeCss).includes(pattern),`Función ${label}`);
check(catalog.includes('routePlans')&&catalog.includes('route.segments')&&catalog.includes('"ruta"'),'El inventario respeta la unión de carrocerías');
check(catalog.includes('"hasta"')&&catalog.includes('"orden"'),'Conserva presupuesto y orden');
check(routeComponent.includes('window.location.href')&&routeComponent.includes('localhost'),'Compartir distingue entorno local');
check(routeComponent.includes('isAlternative')&&routeComponent.includes('supera'),'Alternativas no presentadas como coincidencias');
check(routeCss.includes('@media(max-width:600px)')&&routeCss.includes('@media(max-width:890px)'), 'Estilos responsive presentes');
check(routeCss.includes('prefers-reduced-motion:reduce'), 'Respeta movimiento reducido');
for(const file of ['src/jarcar-v4/RouteFinder.tsx','src/jarcar-v4/Catalog.tsx','src/jarcar-v4/route-matcher.ts']){
 const contents=load(file);const syntax=ts.createSourceFile(file,contents,ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 check(syntax.parseDiagnostics.length===0,`${file}: sin errores sintácticos`);
}
const packageJson=JSON.parse(load('package.json'));
check(packageJson.scripts.dev.includes(PORT) && load('vite.config.ts').includes(PORT) && load('INICIAR_JARCAR.bat').includes(PORT), 'Puerto actual consistente');
check(exists('src/jarcar-v4/route-r15.css')&&exists('VERIFICAR_JARCAR.bat'),'Entrega autónoma');
check(!/\bfetch\s*\(/.test(routeComponent),'Sin conexiones externas ni backend para Tu ruta');
const media=JSON.parse(load('src/jarcar-v3/data/photos.json'));const countPhotos=Object.values(media).reduce((sum,v)=>sum+v.length,0);check(countPhotos===149,'149 fotografías registradas');
let variants=0;for(const photos of Object.values(media))for(const photo of photos)for(const variant of photo.variants){ check(exists(`public${variant.src}`),`Imagen local: ${variant.src}`);variants++; }
check(variants===445,'445 variantes presentes');
console.log(`JARCAR R15 / F5: ${count} verificaciones offline PASS; ${vehicles.length} vehículos, ${countPhotos} fotografías, ${variants} archivos de imagen.`);
console.log('Estas comprobaciones NO certifican la compilación React ni las interacciones reales de navegador.');
