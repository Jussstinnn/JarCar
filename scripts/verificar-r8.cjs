const PORT = require('./_port.cjs');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const rd=(p)=>fs.readFileSync(path.join(root,p),'utf8');
let checks=0;
function check(ok,msg){assert.ok(ok,msg);checks++}
const files=['index.html','package.json','vite.config.ts','INICIAR_JARCAR.bat','src/jarcar-v4/Conocenos.tsx','src/jarcar-v4/Visit.tsx','src/jarcar-v4/GoogleMap.tsx','src/jarcar-v4/google-map.css','src/jarcar-v4/conocenos.css','src/jarcar-v4/r8.css'];
for(const file of files)check(fs.existsSync(path.join(root,file)),`Missing ${file}`);
for(const file of ['src/jarcar-v4/Conocenos.tsx','src/jarcar-v4/Home.tsx','src/jarcar-v4/Shell.tsx','src/jarcar-v4/RouteFinder.tsx','src/jarcar-v4/Visit.tsx','src/jarcar-v4/Detail.tsx','index.html']) {
  let s=rd(file);
  check(!/propuesta conceptual|sitio no oficial|prototipo|no oficial|frontend independiente|demo de muestra|ficticio/i.test(s.replace(/\.demoId/g,'')),`Internal demo copy leaked into ${file}`);
}
check(rd('src/jarcar-v4/GoogleMap.tsx').includes('<iframe'),'Google Maps iframe missing');
check(rd('src/jarcar-v4/GoogleMap.tsx').includes('referrerPolicy'),'Privacy referrerPolicy missing');
check(rd('src/jarcar-v4/business.ts').includes('query_place_id=ChIJ-Sp9sVP7oI8Rldm4PUDYCFM'),'Google place ID missing');
check(rd('src/jarcar-v4/Visit.tsx').includes('<GoogleMap'),'Google Maps not mounted in Visit');
check(rd('src/jarcar-v4/Conocenos.tsx').includes('<GoogleMap compact/>'),'Google Maps not mounted in About');
check(!rd('src/jarcar-v4/Conocenos.tsx').includes('2021'),'Old registry timeline remains in About');
check(!rd('src/jarcar-v4/Conocenos.tsx').includes('consignación'),'Unverified services remain on About page');
check(!rd('src/jarcar-v4/Visit.tsx').includes('importacion'),'Unverified services remain in contact');
check(rd('src/jarcar-v4/Detail.tsx').includes('La unidad, '),'Vehicle description section missing');
check(rd('src/jarcar-v4/Shell.tsx').includes("label: 'Nosotros'"),'About navigation not renamed');
check(rd('package.json').includes(PORT),'Frontend port incorrect');
check(rd('vite.config.ts').includes(PORT),'Vite port incorrect');
check(rd('INICIAR_JARCAR.bat').includes(PORT),'BAT port incorrect');
const imageRoot=path.join(root,'public/jarcar-v3/vehicles');
const ids=['ford-f150-raptor-2019','jeep-wrangler-sahara-2010','mini-aceman-s-2025','toyota-cressida-1984'];
for (let id of ids) check(fs.existsSync(path.join(imageRoot,id+'-01-1280.webp')),'Missing about image '+id);
const seed=JSON.parse(rd('src/jarcar-v3/data/vehicles.seed.json'));
check(Array.isArray(seed.vehicles)&&seed.vehicles.length===35,'Expected 35 vehicles');
// Syntax parsing with a globally available TypeScript installation (no npm install needed)
try {
 const ts=require('./_typescript.cjs');
 const filesToParse = fs.readdirSync(path.join(root,'src/jarcar-v4')).filter(x=>x.endsWith('.tsx')||x.endsWith('.ts'));
 for (const f of filesToParse) {
   const source=path.join(root,'src/jarcar-v4',f), sourceFile=ts.createSourceFile(source,fs.readFileSync(source,'utf8'),ts.ScriptTarget.Latest,true,f.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
   check(sourceFile.parseDiagnostics.length===0,'TypeScript parsing errors in '+f+': '+sourceFile.parseDiagnostics.map(d=>d.messageText));
 }
} catch(e) { if(e.code==='MODULE_NOT_FOUND') console.log('No global TypeScript parser available: syntax parse deferred'); else throw e; }
console.log(`R8: ${checks} verificaciones de integridad, interfaz, datos y sintaxis superadas.`);
