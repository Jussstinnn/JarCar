const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
let ts; try { ts = require('typescript'); } catch { ts = require('./_typescript.cjs'); }
const source = fs.readFileSync(path.join(root, 'src/jarcar-v4/route-matcher.ts'), 'utf8');
const output = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020},reportDiagnostics:true});
assert.equal(output.diagnostics?.length,0, 'No debe haber diagnósticos en motor de rutas');
const moduleExports = {};
vm.runInNewContext(output.outputText, {exports:moduleExports, Object, Array, Map, Set, Number, Math, String});
const {routeBudgets,routePlans,getRouteResults} = moduleExports;
const seed = JSON.parse(fs.readFileSync(path.join(root,'src/jarcar-v3/data/vehicles.seed.json'),'utf8')).vehicles;
const vehicles = seed.map(v => ({demoId:v.id,segment:v.segmentoUX,year:v.anio,price:v.precioCRC,currency:'CRC'}));
let checks=0;
function check(condition, message){assert.ok(condition,message);checks++;}
check(vehicles.length===35,'35 fichas');
check(routePlans.length===5,'5 recorridos');
check(routeBudgets.length===6,'6 presupuestos');
for(const plan of routePlans){
  for(const budget of routeBudgets){
    const result=getRouteResults(vehicles,plan.id,budget);
    const choice = new Set(plan.segments);
    check(result.total === result.matching.length, 'recuento consistente');
    check(result.matching.every(v=>choice.has(v.segment)),'segmentos exactos');
    check(result.matching.every(v=>!budget || v.price<=budget),'respeta presupuesto');
    check(result.alternatives.every(v=>choice.has(v.segment)),'alternativas del mismo estilo');
    check(result.alternatives.length===0||result.matching.length===0,'alternativas sólo sin coincidencias');
    check(result.alternatives.every(v=>budget && v.price>budget),'alternativas siempre fuera de presupuesto');
    check(result.matching.length>0 || !result.exact,'etiquetado honesto');
    check(result.matching.length===0 || result.exact,'etiquetado completo');
  }
}
const noMatch=getRouteResults(vehicles,'trabajo',5_000_000);
check(noMatch.total===0&&noMatch.alternatives.length>0,'opciones superiores al presupuesto cuando no hay coincidencias');
const city=getRouteResults(vehicles,'dia-a-dia',8_000_000);
check(city.total>0 && city.matching.every(v=>v.price<=8_000_000),'ruta de uso diario verificable');
const all=getRouteResults(vehicles,'espacio',0);
check(all.total>0 && all.alternatives.length===0,'sin límite de presupuesto');
const tsxPaths = [
 'src/jarcar-v4/main.tsx','src/jarcar-v4/Shell.tsx','src/jarcar-v4/Home.tsx','src/jarcar-v4/RouteFinder.tsx',
 'src/jarcar-v4/Compare.tsx','src/jarcar-v4/Detail.tsx','src/jarcar-v4/Catalog.tsx','src/jarcar-v4/Visit.tsx'
];
for(const file of tsxPaths){
 const source = fs.readFileSync(path.join(root,file),'utf8');
 const sf = ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 check(sf.parseDiagnostics.length===0, `TSX sin errores sintácticos: ${file}`);
}
check(fs.readFileSync(path.join(root,'src/jarcar-v4/paths.ts'),'utf8').includes('/tu-ruta'),'ruta registrada');
console.log(`R6: ${checks} verificaciones de motor de recomendaciones, casos sin coincidencias, tipos y TSX: OK`);
