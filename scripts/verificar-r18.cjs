'use strict';
/* R18 F9 — portable static and data audit. Does not impersonate a Vite build. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execSync } = require('node:child_process');
const ts = require('./_typescript.cjs');
const PORT = require('./_port.cjs');
const root = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const exists = f => fs.existsSync(path.join(root, f));
let checks = 0;
const pass = (ok, message) => { assert.ok(ok, message); checks++; };
const required = [
 'src/jarcar-v4/Shell.tsx','src/jarcar-v4/Home.tsx','src/jarcar-v4/Catalog.tsx',
 'src/jarcar-v4/Detail.tsx','src/jarcar-v4/Compare.tsx','src/jarcar-v4/Conocenos.tsx',
 'src/jarcar-v4/RouteFinder.tsx','src/jarcar-v4/Visit.tsx','src/jarcar-v4/CommandPalette.tsx',
 'src/jarcar-v4/SavedPage.tsx','src/jarcar-v4/r18-polish.css',
 'src/jarcar-v3/GarageProvider.tsx','scripts/_typescript.cjs','scripts/_port.cjs',
 'INICIAR_JARCAR.bat','VERIFICAR_JARCAR.bat','PLAN_MAESTRO_JARCAR_FRONTEND.md',
 'CAMBIOS_R18_F9.md', 'QA_MANUAL_R18.md', 'src/jarcar-v4/business.ts'
];
for (const f of required) pass(exists(f), `Falta recurso estructural: ${f}`);
// Regression assertions for the changes, in addition to R8-R17 dedicated suites.
const shell=read('src/jarcar-v4/Shell.tsx');
const garage=read('src/jarcar-v3/GarageProvider.tsx');
const palette=read('src/jarcar-v4/CommandPalette.tsx');
const style=read('src/jarcar-v4/r18-polish.css');
for(const [name, source, pattern] of [
 ['dock contextual', shell,/compareDockVisible/],
 ['dock en otras páginas',shell,/pathname !== comparePath/],
 ['dock con imágenes reales',shell,/selected\.map\(car/],
 ['dock con opción quitar',shell,/saved\.removeCompare/],
 ['dock enlaza a comparador',shell,/to=\{comparePath\}/],
 ['motion reducido',shell,/prefers-reduced-motion: reduce/],
 ['motion observable',shell,/new IntersectionObserver/],
 ['motion limpio tras navegar',shell,/observer\.disconnect\(\)/],
 ['motion sin ocultar contenido',shell,/\.animate\(\[/],
 ['motion sin animar nodos desmontados',shell,/!element\.isConnected/],
 ['confirmación de guardados',garage,/j18-feedback/],
 ['live region',garage,/aria-live="polite"/],
 ['confirmación con cierre',garage,/dismissNotice/],
 ['confirmación caduca',garage,/window\.setTimeout/],
 ['feedback comparación',garage,/\/jarcar\/comparar/],
 ['feedback guardados',garage,/\/jarcar\/guardados/],
 ['búsqueda global con flecha segura',palette,/Math\.max\(1, matches\.length\) - 1/],
 ['CSS de movimiento reducido',style,/prefers-reduced-motion:reduce/],
 ['CSS responsive móvil',style,/max-width:540px/],
 ['CSS de comparación',style,/j18-compare-dock/],
 ['CSS de feedback',style,/j18-feedback/],
 ['CSS de foco',style,/:focus-visible/],
 ['CSS con tap targets',style,/min-height:44px/],
 ['CSS imágenes de portada',style,/j12-hero-picture/],
 ['CSS safe area',style,/safe-area-inset-bottom/]
]) pass(pattern.test(source), `F9 faltante: ${name}`);
pass(shell.includes("import './r18-polish.css'"),'El estilo de F9 debe cargarse al final');
pass(/R18-F9|R25-VERCEL-PROPOSAL/.test(read('index.html')),'Meta de release actualizada');
pass(read('package.json').includes(PORT)&&read('vite.config.ts').includes(PORT)&&read('INICIAR_JARCAR.bat').includes(PORT),'Puerto R18 consistente');
pass(read('vite.config.ts').includes('strictPort: true'),'Impedir abrir servidor viejo');
pass(read('index.html').includes('noindex, nofollow'),'No publicar propuesta sin aprobación');
// Parse every TS/TSX source file and check relative import paths, not only a sample.
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const tsfiles=walk(path.join(root,'src')).filter(f=>/\.tsx?$/.test(f));
for(const full of tsfiles){
 const rel=path.relative(root,full), src=fs.readFileSync(full,'utf8');
 const sf=ts.createSourceFile(rel,src,ts.ScriptTarget.Latest,true,rel.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 pass(sf.parseDiagnostics.length===0, `${rel}: ${sf.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join('; ')}`);
 for(const node of sf.statements){
   if(!(ts.isImportDeclaration(node)||ts.isExportDeclaration(node))||!node.moduleSpecifier||!ts.isStringLiteral(node.moduleSpecifier))continue;
   const importPath=node.moduleSpecifier.text;
   if(!importPath.startsWith('.'))continue;
   const abs=path.resolve(path.dirname(full),importPath);
   const variants=[abs,abs+'.ts',abs+'.tsx',abs+'.css',abs+'.json',path.join(abs,'index.ts'),path.join(abs,'index.tsx')];
   pass(variants.some(f=>fs.existsSync(f)),`No se encuentra import ${importPath} desde ${rel}`);
 }
 const output=ts.transpileModule(src,{fileName:rel,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}});
 pass((output.diagnostics??[]).length===0,`Falla transpileModule en ${rel}`);
}
// PostCSS parser, local on Windows after npm install or global in offline QA.
let postcss;
try {postcss=require('postcss');}
catch { const globalRoot=execSync('npm root -g',{encoding:'utf8'}).trim();postcss=require(path.join(globalRoot,'postcss')); }
const css=walk(path.join(root,'src')).filter(f=>f.endsWith('.css'));
for(const f of css){const rel=path.relative(root,f); postcss.parse(fs.readFileSync(f,'utf8'),{from:rel});pass(true,`CSS válido: ${rel}`);}
// Inventory is the existing source-of-truth: no invented units or broken local images.
const vehicles=JSON.parse(read('src/jarcar-v3/data/vehicles.seed.json')).vehicles;
const photos=JSON.parse(read('src/jarcar-v3/data/photos.json'));
const files=fs.readdirSync(path.join(root,'public/jarcar-v3/vehicles')).filter(name=>name.endsWith('.webp'));
pass(vehicles.length===35,'35 fichas preservadas');
pass(new Set(vehicles.map(v=>v.id)).size===vehicles.length,'IDs sin duplicados');
pass(Object.values(photos).reduce((count,v)=>count+v.length,0)===149,'149 fotografías originales');
pass(files.length===445,'445 variantes WebP');
for(const file of files){
 const full=path.join(root,'public/jarcar-v3/vehicles',file);
 pass(fs.statSync(full).size>1000,`Imagen vacía o incompleta: ${file}`);
}
const business=read('src/jarcar-v4/business.ts');
pass(business.includes('Pavas')&&business.includes('San José'),'Ubicación comercial preservada');
pass(business.includes('mapsEmbed')&&business.includes('query_place_id='),'Mapa y direcciones preservados');
pass(!/fundada en 2021|garantía asegurada|financiamiento aprobado/i.test(read('src/jarcar-v4/Conocenos.tsx')+read('src/jarcar-v4/Visit.tsx')),'No afirmar servicios inventados');
console.log(`R18/F9 PASS: ${checks} comprobaciones de código, importaciones, CSS, UX y fotografías. Puerto ${PORT}.`);
console.log('Esta auditoría NO acredita tsc semántico, Vite build, interacciones React ni QA visual real.');
