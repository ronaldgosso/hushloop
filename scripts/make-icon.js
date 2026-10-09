import fs from 'fs';
import path from 'path';

// Source image from generated artifacts
const srcPath = 'C:\\Users\\Neptune\\.gemini\\antigravity-ide\\brain\\c397283b-23f5-4d4e-909b-fac25d5f1800\\focusdeck_app_icon_1791562950559.jpg';
const buildDir = path.resolve('build');
const docsImgDir = path.resolve('docs', 'images');

if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}
if (!fs.existsSync(docsImgDir)) {
  fs.mkdirSync(docsImgDir, { recursive: true });
}

// Copy to docs/images
fs.copyFileSync(srcPath, path.join(docsImgDir, 'focusdeck_app_icon.jpg'));

// Read image bytes
const imgBytes = fs.readFileSync(srcPath);

// Windows Vista+ supports PNG payloads directly in ICO files.
// Let's create an ICO with a 256x256 entry.
// Header: 6 bytes
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // Reserved
header.writeUInt16LE(1, 2); // Type: 1 = Icon
header.writeUInt16LE(1, 4); // Count: 1 image

// Directory Entry: 16 bytes
const entry = Buffer.alloc(16);
entry.writeUInt8(0, 0); // Width: 0 = 256px
entry.writeUInt8(0, 1); // Height: 0 = 256px
entry.writeUInt8(0, 2); // Color count: 0
entry.writeUInt8(0, 3); // Reserved
entry.writeUInt16LE(1, 4); // Color planes
entry.writeUInt16LE(32, 6); // Bits per pixel
entry.writeUInt32LE(imgBytes.length, 8); // Size of image data
entry.writeUInt32LE(22, 12); // Offset to image data (6 + 16 = 22)

const icoBuffer = Buffer.concat([header, entry, imgBytes]);
fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuffer);
fs.writeFileSync(path.join(buildDir, 'icon.png'), imgBytes);

console.log('Successfully generated build/icon.ico (' + icoBuffer.length + ' bytes)');
