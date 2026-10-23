const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'docs');
const entries = [
  'index.html', 'config.js', 'data/guides.js', 'pages',
  'assets/css', 'assets/js', 'assets/classes', 'assets/reference',
  'assets/hero', 'assets/backgrounds', 'assets/line',
  'assets/brand/雨沐天堂-logo-v3-中英精品版.png'
];
const manifestPath = path.join(root, 'design', 'pages-manifest.json');
const previous = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')).files : [];
const current = [];
fs.mkdirSync(output, { recursive: true });
if (fs.lstatSync(output).isSymbolicLink()) throw new Error('Deployment directory must not be a symlink.');

function copy(relative) {
  const source = path.join(root, relative);
  const target = path.resolve(output, relative);
  if (!target.startsWith(output + path.sep)) throw new Error('Invalid deployment target.');
  if (fs.lstatSync(source).isSymbolicLink()) throw new Error('Deployment input must not be a symlink.');
  if (fs.statSync(source).isDirectory()) {
    for (const child of fs.readdirSync(source)) copy(path.join(relative, child));
  } else {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
    current.push({ path: relative.split(path.sep).join('/'), sha256: crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex') });
  }
}
for (const entry of entries) copy(entry);
fs.writeFileSync(path.join(output, '.nojekyll'), '');
current.push({ path: '.nojekyll', sha256: crypto.createHash('sha256').update('').digest('hex') });
for (const old of previous) {
  if (current.some(file => file.path === old.path)) continue;
  const stale = path.resolve(output, old.path);
  if (!stale.startsWith(output + path.sep)) throw new Error('Invalid previous deployment entry.');
  if (fs.existsSync(stale) && fs.statSync(stale).isFile()) fs.unlinkSync(stale);
}
fs.writeFileSync(manifestPath, JSON.stringify({ directory: 'docs', files: current }, null, 2) + '\n');
console.log(`Prepared ${current.length} public files in docs/ for independent GitHub Pages deployment.`);
