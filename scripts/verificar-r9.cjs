'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
let checks=0;
function inspect(file,patterns){
 const p=path.join(root,file);if(!fs.existsSync(p))throw Error(`Falta ${file}`);
 const content=fs.readFileSync(p,'utf8');
 for(const [label,pattern] of patterns){checks++;if(!pattern.test(content))throw Error(`${file}: falta ${label}`);}
}
inspect('src/jarcar-v4/Conocenos.tsx',[['familias con contenido dinámico',/function (?:ShowroomSelector|CollectionWindow)/],['navegación teclado',/ArrowRight.*ArrowLeft/],['mapa',/<GoogleMap compact\s*\/>/],['gráfica editorial propia',/(?:r10-editorial-art|j17-editorial-art)/]]);
inspect('src/jarcar-v4/Catalog.tsx',[['modal real',/showModal\(\)/],['vista rápida',/r9-quick-open/],['comparador',/toggleCompare/],['guardados',/toggleSaved/]]);
inspect('src/jarcar-v4/Shell.tsx',[['avance lectura',/r9-reading-progress/],['vuelta arriba',/r9-back-top/],['reveal accesible',/prefers-reduced-motion/]]);
inspect('src/jarcar-v4/Home.tsx',[['flechas para escena',/j12-rail-arrows/],['portada dinámica',/setActive/]]);
inspect('src/jarcar-v4/r9.css',[['tarjeta corregida',/ja-c-grid\[data-opening='true'\] \.ja-cc:first-child/],['modal adaptable',/r9-quick-dialog/],['movimiento reducido',/prefers-reduced-motion/]]);
inspect('src/jarcar-v4/about-r9.css',[['responsive about',/max-width:520px/],['escena',/r9-gallery-stage/]]);
const art=fs.readFileSync(path.join(root,'src/jarcar-v4/r10.css'),'utf8');
if(!art.includes('.r10-editorial-art'))throw Error('Arte editorial propio ausente');checks++;
const photos=JSON.parse(fs.readFileSync(path.join(root,'src/jarcar-v3/data/photos.json'),'utf8'));
const seed=JSON.parse(fs.readFileSync(path.join(root,'src/jarcar-v3/data/vehicles.seed.json'),'utf8'));
if(seed.vehicles.length!==35)throw Error('Cantidad de vehículos alterada');checks++;
if(Object.values(photos).reduce((a,v)=>a+v.length,0)!==149)throw Error('Cantidad de fotografías alterada');checks++;
for(const id of ['toyota-bz5-2025','audi-q5-prestige-2018','chevrolet-colorado-ltz-2024','volkswagen-escarabajo-super-beetle-1975']){checks++;if(!seed.vehicles.some(v=>v.id===id))throw Error('No existe vehículo '+id);}
console.log(`R9: ${checks} comprobaciones de presencia, catálogo, medios y rutas: PASS`);
console.log('NOTA: esto no sustituye TypeScript, build Vite ni QA de navegador.');
