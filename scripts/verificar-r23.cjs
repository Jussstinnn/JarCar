/* R23 F9: verifica estructura de ficha, datos existentes, recursos y estilos.
   No sustituye Vite build ni pruebas interactivas en un navegador real. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('./_typescript.cjs');
const port = require('./_port.cjs');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f),'utf8');
const jsx = read('src/jarcar-v4/Detail.tsx');
const catalog = read('src/jarcar-v4/Catalog.tsx');
const css = read('src/jarcar-v4/r23-detail.css');
const pkg = JSON.parse(read('package.json'));
let checks = 0;
function check(condition, message) {assert.ok(condition,message);checks++;}
check(Number(pkg.version.split('.')[0]) >= 23,'R23 se conserva dentro de la versión actual');
check(/^\d{4,5}$/.test(port),'Puerto válido de desarrollo');
check(!catalog.includes('CatalogIntro') && !catalog.includes('j22-catalog-intro'),'Inventario abre directo en búsqueda, sin banner');
check(!catalog.includes('CatalogOpening') && !catalog.includes('CatalogPause'),'Sin banners de vehículos ni promos intermedias');
check(jsx.includes('j23-masthead'),'Cabecera compacta');
check(jsx.includes('j23-showcase'),'Galera y venta en bloque común');
check(jsx.includes('j23-gallery-column') && jsx.includes('j23-sales-column'),'Columnas de galería y compra');
check(jsx.indexOf('<Gallery key={vehicle.demoId}') < jsx.indexOf('<Decision key={vehicle.demoId}'),'Galería antes del contacto');
check(jsx.includes('j23-information-grid'),'Bloque de información compacto');
check(jsx.includes('j23-detail') && jsx.includes('r23-detail.css'),'CSS versión R23 aplicado');
check(jsx.includes('ArrowLeft') && jsx.includes('jd-breadcrumbs'),'Volver al inventario');
check(jsx.includes('onTouchStart={startTouch}') && jsx.includes('onTouchEnd={endTouch}'),'Gestos táctiles de galería');
check(jsx.includes('Dialog.Portal') && jsx.includes('Dialog.Close'),'Galería ampliada accesible');
check(jsx.includes('jd-thumbnails') && jsx.includes('j14-filmstrip'),'Miniaturas de galería');
check(jsx.includes('type="button" aria-pressed={saved}') && jsx.includes('toggleCompare'),'Guardar y comparar conservados');
check(jsx.includes('shareVehicle') && jsx.includes('localOnly'),'Compartir sin copiar localhost');
check(jsx.includes('priceOf(vehicle)'),'Precio basado en registro');
check(jsx.includes('vehicle.engine') && jsx.includes('vehicle.mileage') && jsx.includes('vehicle.drivetrain'),'Especificaciones del registro');
check(jsx.includes("'Por confirmar'"),'Tratamiento de datos faltantes');
check(jsx.includes('additional = parts.filter'),'Evitar repetir especificaciones en descripción');
check(jsx.includes('j23-source-disclosure'),'Descripción original disponible');
check(jsx.includes('BuyerChecklist') && jsx.includes('Related'),'Revisión y sugerencias conservadas');
check(jsx.includes('r10-mobile-decision'),'Consulta móvil conservada');
check(jsx.includes('jarcar.phoneHref'),'Contacto telefónico desde datos Jarcar');
check(!jsx.includes('fox suspension') && !jsx.includes('Garantía certificada'),'No inventar certificaciones ni equipamiento');
check(!jsx.includes('ford_f_150_raptor_en_pavas.png'),'Imagen conceptual no usada como anuncio');
for(const query of ['.j23-showcase','.j23-information-grid','.j23-detail .jd-facts','.j23-detail .jd-publication','.j23-detail .j14-visit-band','@media(max-width:620px)','@media(prefers-reduced-motion:reduce)'])check(css.includes(query),`Estilo faltante: ${query}`);
// La sintaxis TypeScript y JSX es comprobable sin instalar React.
for(const f of ['src/jarcar-v4/Detail.tsx','src/jarcar-v4/Catalog.tsx','src/jarcar-v4/Conocenos.tsx']){
 const sf=ts.createSourceFile(f,read(f),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 check(sf.parseDiagnostics.length===0,`TSX invalido: ${f} ${sf.parseDiagnostics.map(e=>e.messageText)}`);
}
// Inventario completo y recursos intactos.
const seed = JSON.parse(read('src/jarcar-v3/data/vehicles.seed.json'));
const media = JSON.parse(read('src/jarcar-v3/data/photos.json'));
check(seed.vehicles.length === 35,'Conservar 35 anuncios');
const photos=Object.values(media).reduce((sum,arr)=>sum+arr.length,0);
check(photos===149,`Conservar fotos (encontradas ${photos})`);
let variants=0;
for(const p of Object.values(media).flat()) for(const v of p.variants){
 const file=path.join(root,'public',v.src.replace(/^\//,''));
 check(fs.existsSync(file),`Falta WebP ${v.src}`);variants++;
}
check(variants===445,`Esperadas 445 variantes, hay ${variants}`);
console.log(`JARCAR R23 QA OFFLINE: ${checks} comprobaciones PASS. ${seed.vehicles.length} vehículos, ${photos} fotografías, ${variants} WebP, puerto ${port}.`);
console.log('Pendiente para certificación: npm run build + QA real Chrome, Safari y móvil.');
