const PORT = require('./_port.cjs');
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const exists=p=>fs.existsSync(path.join(root,p));
let ts;
try { ts=require('typescript'); } catch { ts=require('./_typescript.cjs'); }
let passed=0;
function check(value,detail){assert.ok(value,detail);passed++}
const modules=[
  'src/jarcar-v4/SavedPage.tsx','src/jarcar-v4/Compare.tsx','src/jarcar-v4/comparison-insights.ts',
  'src/jarcar-v4/CommandPalette.tsx','src/jarcar-v4/Shell.tsx','src/jarcar-v4/main.tsx',
  'src/jarcar-v3/GarageProvider.tsx','src/jarcar-v4/recent.ts'
];
for(const file of modules){
  check(exists(file),`No existe ${file}`);
  const src=read(file);
  const parsed=ts.createSourceFile(file,src,ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  check(parsed.parseDiagnostics.length===0,`${file} sintaxis: ${parsed.parseDiagnostics.map(x=>x.messageText)}`);
  const transformed=ts.transpileModule(src,{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX},reportDiagnostics:true});
  check(transformed.diagnostics.length===0,`${file} transpilación`);
}
for(const file of ['src/jarcar-v4/garage-r16.css','src/jarcar-v4/compare-r16.css','src/jarcar-v4/r16-global.css']) check(exists(file),`Falta estilos ${file}`);
const screens=read('src/jarcar-v4/SavedPage.tsx');
for(const key of ['j16-garage-hero','j16-garage-grid','compareIds','readRecent','clearSaved','clearRecent','Compartir lista','navigator.clipboard','j16-clear-confirm','isPending','isError','toggleCompare','toggleSaved','aria-pressed']) check(screens.includes(key),`Selección: ${key}`);
const cmp=read('src/jarcar-v4/Compare.tsx');
for(const key of ['comparisonInsights(vehicles)','j16-x-insights','Solo diferencias','j16-x-table-scroll','window.print','Compartir selección','params.has(\'v\')','Consultar unidad']) check(cmp.includes(key),`Comparador: ${key}`);
const shell=read('src/jarcar-v4/Shell.tsx');
check(shell.includes('to={savedPath}') && shell.includes('j16-garage-hero-grid'),'R16 en navegación y animación');
const router=read('src/jarcar-v4/main.tsx');
check(router.includes('path="guardados"') && router.includes('lazy(() => import(\'./SavedPage\')'),'Ruta propia cargada de forma diferida');
check(read('src/jarcar-v3/GarageProvider.tsx').includes("action.type === 'clearSaved'"),'Limpieza explícita de guardados');
const palette=read('src/jarcar-v4/CommandPalette.tsx');
check(palette.includes('readRecent()')&&palette.includes('savedPath')&&palette.includes('comparePath')&&palette.includes('routePath'),'Búsqueda conectada a selección e historial');
const recent=read('src/jarcar-v4/recent.ts');
check(recent.includes('recentChangeEvent')&&recent.includes('dispatchEvent'),'Historial sincronizado en la misma pestaña');
check(read('src/jarcar-v4/garage-r16.css').includes('prefers-reduced-motion') && read('src/jarcar-v4/compare-r16.css').includes('@media print'),'Accesibilidad motion e impresión');
check(JSON.parse(read('package.json')).scripts.dev.includes(PORT)&&read('vite.config.ts').includes(PORT)&&read('INICIAR_JARCAR.bat').includes(PORT),'Puerto actual consistente');
check((/test:r16|verificar-r16\.cjs/.test(read('VERIFICAR_JARCAR.bat'))) && JSON.parse(read('package.json')).scripts['test:r16'].includes('verificar-r16.cjs'),'BAT y npm scripts R16');

const insightsFile='src/jarcar-v4/comparison-insights.ts';
const insightJS=ts.transpileModule(read(insightsFile),{fileName:insightsFile,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const mod={};
vm.runInNewContext(insightJS,{exports:mod,Intl,Math,Number,String}, {timeout:1500});
const analyze=mod.comparisonInsights;
const example=(demoId,price,year,value,unit='km',currency='CRC')=>({demoId,price,year,currency,mileage:value===null?null:{value,unit}});
const many=[example('raptor',29000000,2019,85000,'mi'),example('jeep',7900000,2010,84000,'mi'),example('mini',16900000,2025,9000,'km')];
const results=analyze(many);
check(results.length===3,'Tres métricas objetivas con tres unidades');
check(results.find(x=>x.key==='precio').vehicleId==='jeep','Precio menor correcto');
check(results.find(x=>x.key==='anio').vehicleId==='mini','Año mayor correcto');
check(results.find(x=>x.key==='odometro').vehicleId==='mini','Kilometraje km/mi correcto');
check(analyze(many.slice(0,1)).length===0,'Sin comparación para un solo vehículo');
check(!analyze([example('a',100,2022,20000),example('b',100,2022,20000)]).length,'Empates no se anuncian como ventaja');
check(analyze([example('a',2000,2019,null,'km','USD'),example('b',5000,2022,30000,'km','CRC')]).every(x=>x.key!=='precio'),'No se comparan directamente monedas diferentes');
check(analyze([example('a',1000,2019,20000),example('b',2000,2021,null)]).every(x=>x.key!=='odometro'),'Odómetro desconocido no se inventa');
check(analyze([example('a',0,2019,20000),example('b',2000,2021,25000)]).every(x=>x.key!=='precio'),'Precio de una unidad desconocido no permite clasificar todas');
check(analyze([example('a',1000,2019,10000,'mi'),example('b',2000,2019,17000,'km')]).find(x=>x.key==='odometro').vehicleId==='a','Conversión millas a km');
const data=JSON.parse(read('src/jarcar-v3/data/vehicles.seed.json')).vehicles;
const photos=JSON.parse(read('src/jarcar-v3/data/photos.json'));
check(data.length===35 && new Set(data.map(v=>v.id)).size===35,'35 unidades únicas');
check(Object.values(photos).reduce((n,arr)=>n+arr.length,0)===149,'149 fotos');
let variants=0;for(const arr of Object.values(photos))for(const photo of arr)for(const v of photo.variants){check(exists('public'+v.src),`Foto faltante: ${v.src}`);variants++}
check(variants===445,'445 variantes preservadas');
check(!modules.some(file=>/fetch\s*\(\s*[`'\"]?\/api/.test(read(file))),'F6 no conecta backend');
console.log(`JARCAR R16 / F6: ${passed} comprobaciones offline PASS. ${data.length} vehículos; 149 fotografías; ${variants} variantes.`);
console.log('Esta prueba no sustituye npm run build ni una inspección funcional en navegador.');
