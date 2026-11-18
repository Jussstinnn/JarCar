const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const seed = JSON.parse(fs.readFileSync(path.join(root,'src/jarcar-v3/data/vehicles.seed.json'), 'utf8'));
const photos = JSON.parse(fs.readFileSync(path.join(root,'src/jarcar-v3/data/photos.json'), 'utf8'));
const ids = new Set(seed.vehicles.map(v=>v.id));
let count = 0, variants = 0;
const missing = [];
for (const [id, list] of Object.entries(photos)) {
  if (!ids.has(id)) missing.push('Sin vehículo: ' + id);
  for (const photo of list) {
    count++;
    for (const v of photo.variants) {
      variants++;
      if (!fs.existsSync(path.join(root,'public',v.src.replace(/^\//,'')))) missing.push(v.src);
    }
  }
}
for (const p of ['src/jarcar-v4/Home.tsx', 'src/jarcar-v4/RouteFinder.tsx', 'src/jarcar-v4/route-finder.css', 'src/jarcar-v4/rebirth.css','public/jarcar-v4/mark.svg','index.html']) {
  if (!fs.existsSync(path.join(root,p))) missing.push(p);
}
console.log(`Jarcar R6: ${seed.vehicles.length} vehículos, ${count} fotografías, ${variants} variantes WebP`);
if (missing.length) { console.error('Archivos faltantes:', missing.slice(0,30)); process.exitCode = 1; }
else console.log('OK: recursos y rutas verificados.');
