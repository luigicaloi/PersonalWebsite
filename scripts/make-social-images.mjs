// Generates the share image (Open Graph), the profile image used in structured
// data, and the PNG/ICO favicons from the source photo and favicon.svg.
// Run with: node scripts/make-social-images.mjs
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const src = fileURLToPath(new URL('../src/assets/images/profile.jpg', import.meta.url));
const out = (f) => fileURLToPath(new URL(`../public/${f}`, import.meta.url));

// 1200x630 share card: gray band (site colour) with the photo on the right half.
const photo = await sharp(src).resize(600, 630, { fit: 'cover', position: 'attention' }).toBuffer();
const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="630">
  <text x="60" y="300" font-family="Montserrat, Helvetica Neue, Arial, sans-serif" font-size="58" letter-spacing="2" fill="#000">Luigi Caloi</text>
  <text x="62" y="360" font-family="Montserrat, Helvetica Neue, Arial, sans-serif" font-size="24" letter-spacing="1" fill="#000">Assistant Professor, Insper</text>
  <text x="62" y="396" font-family="Montserrat, Helvetica Neue, Arial, sans-serif" font-size="20" fill="#333">Public and development economics</text>
</svg>`);
await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#dcdcdc' } })
  .composite([{ input: label, left: 0, top: 0 }, { input: photo, left: 600, top: 0 }])
  .jpeg({ quality: 85, mozjpeg: true })
  .toFile(out('images/og-image.jpg'));

// Square portrait for schema.org Person.image and knowledge panels.
await sharp(src).resize(800, 800, { fit: 'cover', position: 'attention' }).jpeg({ quality: 85, mozjpeg: true }).toFile(out('images/luigi-caloi.jpg'));

// Favicons from the SVG.
const svg = await readFile(out('favicon.svg'));
await sharp(svg, { density: 300 }).resize(180, 180).png().toFile(out('apple-touch-icon.png'));
const png32 = await sharp(svg, { density: 300 }).resize(32, 32).png().toBuffer();
// Minimal ICO container wrapping one 32x32 PNG.
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
header.writeUInt8(32, 6); header.writeUInt8(32, 7); header.writeUInt8(0, 8); header.writeUInt8(0, 9);
header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12); header.writeUInt32LE(png32.length, 14); header.writeUInt32LE(22, 18);
await writeFile(out('favicon.ico'), Buffer.concat([header, png32]));
console.log('wrote og-image.jpg, luigi-caloi.jpg, apple-touch-icon.png, favicon.ico');
