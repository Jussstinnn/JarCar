/* QA offline R24 — Home responsive, sin depender de npm install.
   No sustituye Vite build ni prueba móvil real con Chrome/Safari. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const ts = require('./_typescript.cjs');
const port = require('./_port.cjs');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const home = read('src/jarcar-v4/Home.tsx');
const css = read('src/jarcar-v4/r24-home-mobile.css');
const base = read('src/jarcar-v4/r12-home.css');
const pkg = JSON.parse(read('package.json'));
let checks=0;
const verify = (condition, explanation) => {assert.ok(condition,explanation);checks++};
verify(['24.0.0','25.0.0'].includes(pkg.version),'Base R24 conservada en R25');
verify(['4624','4631'].includes(port),'Puerto R24/R25 válido (no R23)');
verify(/4625|4632/.test(pkg.scripts.preview),'Puerto preview exclusivo');
verify(home.includes("import './r24-home-mobile.css'"),'CSS R24 importado en Home');
verify(home.includes('function Hero')&&home.includes('function Discovery')&&home.includes('function FindBar'),'Estructura Home conservada');
verify(home.includes('matchMedia(\'(max-width: 700px)\')')&&home.includes('media.addEventListener(\'change\''),'Deteccion reactiva breakpoint');
verify(home.includes('{isMobile && <div className="j24-mobile-hero">'),'Solo se monta el hero móvil en móvil');
verify(home.includes('{!isMobile && <div className="j12-hero-grid">'),'Solo se monta el hero desktop en escritorio');
verify(home.includes('j24-mobile-hero-visual')&&home.includes('j24-mobile-hero-message'),'Imagen y texto en una composición móvil');
verify(home.includes('j24-mobile-selected-copy')&&home.includes('j24-mobile-picks'),'Modelo seleccionado y controles móviles');
verify(home.includes('const timer = window.setInterval')&&home.includes('setActive(index => (index + 1) % count)'),'Rotación automática conservada');
verify(home.includes("matchMedia('(prefers-reduced-motion: reduce)')"),'Movimiento reducido respetado');
verify(home.includes('j24-mobile-search-form')&&home.includes('onSubmit={submit}'),'Búsqueda móvil funcional');
verify(home.includes('j12-category-picker')&&home.includes('onClick={()=>setActive(index)}'),'Categorías interactivas conservadas');
verify(home.includes('EN LA COLECCIÓN / {nameOf(car)}'),'Etiqueta neutral del vehículo');
verify(home.includes('<FindBar vehicles={vehicles}/>')&&home.includes('<Discovery vehicles={vehicles}/>' ),'Flujo de Home intacto');
verify(home.includes('<Selection vehicles={vehicles}/>')&&home.includes('<RouteTeaser vehicles={vehicles}/>'),'Otras secciones conservadas');
verify(home.includes('<Story vehicles={vehicles}/>')&&home.includes('<VisitCallout/>'),'Story y Visítanos conservados');
verify(css.includes('.j24-mobile-hero,.j24-mobile-search{display:none}'),'Solo móvil por defecto');
verify(css.includes('@media (max-width:700px)')&&css.includes('.j12-hero-grid{display:none!important}'),'Desktop no cambia');
verify(css.includes('.j24-mobile-hero-visual')&&css.includes('.j24-mobile-hero-overlay'),'Fotografía legible');
verify(css.includes('.j24-mobile-picks')&&css.includes('grid-template-columns:repeat(4'),'Carrusel con 4 botones');
verify(css.includes('.j12-category-picker')&&css.includes('overflow-x:auto'),'Categorías desplazables');
verify(css.includes('.j12-discovery-caption')&&css.includes('background:#16271e'),'Tarjeta móvil equilibrada');
verify(css.includes('.j24-mobile-search-form')&&css.includes('display:none!important'),'Búsqueda avanzada oculta solo móvil');
verify(css.includes('body:has(.j12-home) .r9-back-top'),'Botón superpuesto eliminado en Home móvil');
verify(css.includes('@media(max-width:360px)'),'Pantallas pequeñas');
verify(css.includes('@media(prefers-reduced-motion:reduce)'),'Accesibilidad animaciones');
verify(!home.includes('sitio demo')&&!home.includes('versión conceptual'),'Copy sin banners de prototipo');
// El CSS base de escritorio queda completamente intacto.
const originalHash='4df6a9803b664a66f1910d059172bb2ae48c4f5a53010f32177119fa58c7fdf7';
const hash=crypto.createHash('sha256').update(base).digest('hex');
verify(hash === originalHash,'CSS base R23 de escritorio no alterado');
for(const file of fs.readdirSync(path.join(root,'src/jarcar-v4')).filter(n=>n.endsWith('.tsx')||n.endsWith('.ts'))){
  const code=read('src/jarcar-v4/'+file);
  const source=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  verify(source.parseDiagnostics.length===0,`TS/TSX inválido ${file}`);
}
const data=JSON.parse(read('src/jarcar-v3/data/vehicles.seed.json'));
const photos=JSON.parse(read('src/jarcar-v3/data/photos.json'));
verify(data.vehicles.length===35,'35 vehículos intactos');
verify(Object.values(photos).flat().length===149,'149 fotos intactas');
let variants=0;
for(const item of Object.values(photos).flat()){
  for(const variant of item.variants){
    verify(fs.existsSync(path.join(root,'public',variant.src.replace(/^\//,''))),`Imagen perdida: ${variant.src}`);
    variants++;
  }
}
verify(variants===445,'445 variantes intactas');
console.log(`JARCAR R24 QA OFFLINE PASS: ${checks} verificaciones (35 vehículos / 149 fotografías / 445 WebP).`);
console.log('Pendiente: npm run build, pruebas de animación y QA visual real en 320/375/390/430/700 px.');
