// Préparation de l'application (#13) : produit index.html, app.js, app.css, lib/ et sw.js
// à partir des sources du dossier src/. Lancer avec : npm install puis npm run build
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';

const bin = (name) => `node_modules/.bin/${name}`;
const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit' });

// 1. Code : JSX → JavaScript ordinaire (React est chargé depuis lib/)
run(bin('esbuild'), ['src/app.jsx', '--outfile=app.js', '--minify', '--target=es2019',
  '--jsx=transform', '--jsx-factory=React.createElement', '--jsx-fragment=React.Fragment',
  '--legal-comments=none', '--log-level=warning']);

// 2. Apparence : seulement les classes Tailwind réellement utilisées
run(bin('tailwindcss'), ['-c', 'tailwind.config.cjs', '-i', 'src/styles.css', '-o', 'app.css', '--minify']);

// 3. Bibliothèques locales (#12)
fs.mkdirSync('lib', { recursive: true });
for (const [pkg, file] of [['react', 'react.production.min.js'], ['react-dom', 'react-dom.production.min.js']]) {
  fs.copyFileSync(`node_modules/${pkg}/umd/${file}`, `lib/${file}`);
}

// 4. Version = empreinte des fichiers ; page et service worker
const files = ['app.js', 'app.css', 'lib/react.production.min.js', 'lib/react-dom.production.min.js',
  'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
  'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'src/index.html'];
const hash = createHash('sha256');
for (const f of files) hash.update(fs.readFileSync(f));
const version = hash.digest('hex').slice(0, 10);

fs.writeFileSync('index.html', fs.readFileSync('src/index.html', 'utf8').replaceAll('__VERSION__', version));
const cached = ['./', './index.html', ...files.filter((f) => !f.startsWith('src/')).map((f) => `./${f}`)];
fs.writeFileSync('sw.js', fs.readFileSync('src/sw.js', 'utf8')
  .replace('__VERSION__', version).replace('__FILES__', JSON.stringify(cached, null, 2)));

console.log(`Application préparée — version ${version}`);
