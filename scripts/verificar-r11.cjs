const PORT = require('./_port.cjs');
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const get=f=>fs.readFileSync(path.join(root,f),'utf8');
const exists=f=>fs.existsSync(path.join(root,f));
let count=0;
function check(condition, message){assert.ok(condition,message);count++;}
for(const f of ['PLAN_MAESTRO_JARCAR_FRONTEND.md','src/jarcar-v4/r11-motion.css','src/jarcar-v4/Shell.tsx','INICIAR_JARCAR.bat','VERIFICAR_JARCAR.bat'])check(exists(f),`Falta ${f}`);
const shell=get('src/jarcar-v4/Shell.tsx');
check(/const observer = new IntersectionObserver/.test(shell),'Observador de scroll missing');
check(/const mutations = new MutationObserver/.test(shell),'Suspense/lazy not observed');
check(/observer\.observe\(element\)/.test(shell),'New elements not registered');
check(/element\.animate\(\[/.test(shell),'WAAPI animation not found');
check(/media\.matches/.test(shell),'Reduced motion missing');
check(/animation\.cancel\(\)/.test(shell),'Animation lifecycle cleanup missing');
check(!/getBoundingClientRect\(\)\.top\s*<\s*window\.innerHeight\s*\*\s*\.90/.test(shell),'R9 visible-in-viewport skip was not removed');
check(!/el\.classList\.add\('r9-reveal'\)/.test(shell),'Old JS hiding behavior still present');
check(/import '\.\/r11-motion\.css'/.test(shell),'Motion failsafe style not included');
const css=get('src/jarcar-v4/r11-motion.css');
check(/\.r9-reveal.*opacity:\s*1/.test(css),'Fallback content visibility missing');
for(const file of ['package.json','vite.config.ts','INICIAR_JARCAR.bat'])check(get(file).includes(PORT),`Inconsistent current port in ${file}`);
check(get('package.json').includes('test:r11'),'R11 test script missing');
for(const key of ['/jarcar','/jarcar/inventario','/jarcar/tu-ruta','/jarcar/comparar'])check(get('src/jarcar-v4/paths.ts').includes(key.replace('/jarcar','').replace('/','')) || get('src/jarcar-v4/main.tsx').includes('Route'),'Route code missing');
const vehicles=JSON.parse(get('src/jarcar-v3/data/vehicles.seed.json')).vehicles;
const pics=JSON.parse(get('src/jarcar-v3/data/photos.json'));
check(vehicles.length===35,'35 vehicle inventory changed');
check(Object.values(pics).reduce((n,arr)=>n+arr.length,0)===149,'149 photos changed');
let ts;
try {ts=require('typescript')}catch {try{ts=require('./_typescript.cjs')}catch{ts=null}}
if(ts){
  for(const d of ['src/jarcar-v4','src/jarcar-v3'])for(const f of fs.readdirSync(path.join(root,d)).filter(x=>/\.tsx?$/.test(x))){
    const file=path.join(d,f),sf=ts.createSourceFile(file,get(file),ts.ScriptTarget.Latest,true,f.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
    check(sf.parseDiagnostics.length===0,`TS parse error in ${file}: ${sf.parseDiagnostics.map(x=>ts.flattenDiagnosticMessageText(x.messageText,' ')).join(',')}`);
  }
}
console.log(`R11-P0: ${count} verificaciones estáticas PASS. La ejecución React real en Chromium queda pendiente hasta instalar npm.`);
