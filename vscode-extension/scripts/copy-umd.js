const fs = require('fs');
const path = require('path');

const mediaDir = path.join(__dirname, '..', 'media');
const filename = 'simpleMindMap.umd.min.js';

const sources = [
  path.join(__dirname, '..', 'node_modules', 'simple-mind-map', 'dist', filename),
  path.join(__dirname, '..', '..', 'simple-mind-map', 'dist', filename)
];

const dest = path.join(mediaDir, filename);
for (const src of sources) {
  if (fs.existsSync(src)) {
    if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });
    fs.copyFileSync(src, dest);
    console.log('Copied:', src, '->', dest);
    process.exit(0);
  }
}

console.error('UMD not found. Run in web: npm run buildLibrary (or install simple-mind-map and copy from node_modules).');
process.exit(1);
