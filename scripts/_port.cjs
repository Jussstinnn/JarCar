/* The unique port changes every release; regression tests read it from npm scripts.
 * This asserts the Vite, BAT and package.json contract without hardcoding old versions.
 */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const match = pkg.scripts.dev.match(/--port (\d+)\b/);
if (!match) throw new Error('npm run dev requiere --port N');
const port = match[1];
const vite = fs.readFileSync(path.join(root, 'vite.config.ts'), 'utf8');
const bat = fs.readFileSync(path.join(root, 'INICIAR_JARCAR.bat'), 'utf8');
if (!vite.includes(`port: ${port}`) || !vite.includes('strictPort: true') || !bat.includes(port)) throw new Error(`El puerto ${port} no coincide entre Vite/package/BAT`);
module.exports = port;
