const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const ts=require('./_typescript.cjs');
let checks=0;
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const assertFile=(p)=>{assert(fs.existsSync(path.join(root,p)),`Falta ${p}`);checks++};
const about=read('src/jarcar-v4/Conocenos.tsx');
const visit=read('src/jarcar-v4/Visit.tsx');
const shell=read('src/jarcar-v4/Shell.tsx');
const aboutCss=read('src/jarcar-v4/about-r17.css');
const visitCss=read('src/jarcar-v4/visit-r17.css');
for(const p of ['src/jarcar-v4/Conocenos.tsx','src/jarcar-v4/Visit.tsx','src/jarcar-v4/Shell.tsx']) {
  const output=ts.transpileModule(read(p),{fileName:p,reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
  assert.equal((output.diagnostics||[]).length,0,`${p}: errores de sintaxis TSX`);checks++;
}
for(const q of ['role="tablist"','aria-selected','j17-cat-panel','onKeyDown','detailPath(vehicle.demoId)','<GoogleMap compact/>','jarcar.place','j17-window']) {assert(about.includes(q),`F7 falta: ${q}`);checks++;}
for(const q of ['#consulta','jarcar.maps','jarcar.phoneHref','jarcar.whatsAppPotential','<GoogleMap/>','navigator.clipboard','maxLength={1200}','changeParam','nameOf(vehicle)','j17-v-question-wrap']) {assert(visit.includes(q),`F8 falta: ${q}`);checks++;}
for(const q of ['.j17-hero','@media(max-width:540px)','prefers-reduced-motion','.j17-window-index','.j17-window-stage']) {assert(aboutCss.includes(q),`CSS F7 falta ${q}`);checks++;}
for(const q of ['.j17-v-copy-button','.j17-v-hero','@media(max-width:540px)','prefers-reduced-motion','.j17-v-form']) {assert(visitCss.includes(q),`CSS F8 falta ${q}`);checks++;}
for(const q of ['.j17-hero-center','.j17-window-top','.j17-v-head','.j17-v-form']) {assert(shell.includes(q),`Motion faltante ${q}`);checks++;}
assert(!/\b(garant[ií]a asegurada|consignaci[oó]n disponible|importaci[oó]n disponible|fundada en 2021)\b/i.test(about+visit),'Afirmación comercial no verificada');checks++;
assert(visitCss.includes('.j17-v-copy-button') && visit.includes('className="j17-v-copy-button"'));checks++;
const seed=JSON.parse(read('src/jarcar-v3/data/vehicles.seed.json'));
const media=JSON.parse(read('src/jarcar-v3/data/photos.json'));
assert.equal(seed.vehicles.length,35);checks++;
assert.equal(Object.values(media).reduce((a,v)=>a+v.length,0),149);checks++;
for(const v of seed.vehicles){assert(typeof v.id==='string' && v.id.length>0);checks++}
const photos=fs.readdirSync(path.join(root,'public/jarcar-v3/vehicles')).filter(s=>s.endsWith('.webp'));
assert.equal(photos.length,445);checks++;
for(const p of photos){assertFile(`public/jarcar-v3/vehicles/${p}`)}
console.log(`R17 PASS: ${checks} comprobaciones de rutas, contenido, sintaxis TSX y medios`);
