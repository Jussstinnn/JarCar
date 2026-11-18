/* Portable TypeScript parser for offline QA on Windows/Linux.
 * Local project TypeScript takes precedence; global installation is a fallback.
 */
const path = require('node:path');
const { execSync } = require('node:child_process');
try {
  module.exports = require('typescript');
} catch {
  let globalRoot;
  try { globalRoot = execSync('npm root -g', { encoding: 'utf8', timeout: 6000 }).trim(); }
  catch { globalRoot = ''; }
  if (!globalRoot) throw new Error('TypeScript no disponible: ejecutá npm install.');
  module.exports = require(path.join(globalRoot, 'typescript'));
}
