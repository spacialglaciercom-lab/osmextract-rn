/**
 * Adds missing LogBoxImages PNGs to react-native (fix for missing assets in npm package).
 * Run: node scripts/add-logbox-images.js
 */
const fs = require('fs');
const path = require('path');

// Minimal 1x1 transparent PNG (valid PNG file)
const MINIMAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const dir = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native',
  'Libraries',
  'LogBox',
  'UI',
  'LogBoxImages'
);
const images = [
  'chevron-left.png',
  'chevron-right.png',
  'close.png',
  'alert-triangle.png',
  'loader.png',
];

if (!fs.existsSync(path.join(__dirname, '..', 'node_modules', 'react-native'))) {
  console.error('react-native not found. Run npm install first.');
  process.exit(1);
}

fs.mkdirSync(dir, { recursive: true });
images.forEach((name) => {
  fs.writeFileSync(path.join(dir, name), MINIMAL_PNG);
  console.log('Created', name);
});
console.log('LogBoxImages fix applied. Run "npx patch-package react-native" to persist after npm install.');
