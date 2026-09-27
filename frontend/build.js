const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const distDir = path.join(srcDir, 'dist');

// Clean dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Assets and files to include in production
const includeItems = [
  'index.html',
  'collection.html',
  'product.html',
  'about.html',
  'contact.html',
  '404.html',
  'desktop.html',
  'assets',
  'img',
  '_headers',
  '_redirects',
  'netlify.toml'
];

for (const item of includeItems) {
  const srcPath = path.join(srcDir, item);
  const destPath = path.join(distDir, item);
  if (fs.existsSync(srcPath)) {
    fs.cpSync(srcPath, destPath, { recursive: true });
  }
}

console.log('Successfully built clean Arabian Drops production bundle into dist/');
