#!/usr/bin/env node
// Copies the latest CV and paper PDFs from your project folders into
// public/files/, using the mapping in papers.sources.json (git-ignored, because
// the paths are specific to your computer). Then rebuild and push.
//
//   npm run sync:papers          copy files that changed
//   npm run sync:papers -- --dry show what would change
import { readFile, copyFile, stat, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DRY = process.argv.includes('--dry');
const cfgPath = join(ROOT, 'papers.sources.json');

let cfg;
try {
  cfg = JSON.parse(await readFile(cfgPath, 'utf8'));
} catch {
  console.error('papers.sources.json not found. Copy papers.sources.example.json to papers.sources.json and fill in the paths.');
  process.exit(1);
}

const hash = async (p) => createHash('sha256').update(await readFile(p)).digest('hex');
let changed = 0;
for (const [name, rawSrc] of Object.entries(cfg)) {
  if (name.startsWith('$')) continue;
  const src = rawSrc.replace(/^~(?=\/)/, homedir());
  const dest = join(ROOT, 'public/files', `${name}.pdf`);
  try {
    await stat(src);
  } catch {
    console.error(`  missing  ${name}: ${src}`);
    process.exitCode = 1;
    continue;
  }
  const same = await stat(dest).then(async () => (await hash(src)) === (await hash(dest)), () => false);
  if (same) {
    console.log(`  same     ${name}`);
    continue;
  }
  changed++;
  console.log(`  ${DRY ? 'would copy' : 'copied  '} ${name}  <-  ${src}`);
  if (!DRY) {
    await mkdir(dirname(dest), { recursive: true });
    await copyFile(src, dest);
  }
}
console.log(changed ? `${changed} file(s) ${DRY ? 'would change' : 'updated'}. Rebuild with npm run build:checked, then commit and push.` : 'All PDFs up to date.');
