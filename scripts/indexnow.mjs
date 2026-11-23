#!/usr/bin/env node
// Tells Bing, Yandex, Seznam, Naver (and through Bing, ChatGPT search and Copilot)
// that pages changed, so they re-crawl within minutes instead of weeks.
// Run after a deploy is live:  npm run indexnow            (all sitemap URLs)
//                              npm run indexnow -- /research /files/cv.pdf
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const HOST = 'www.luigicaloi.com';
const keyFile = (await readdir(join(ROOT, 'public'))).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) throw new Error('No IndexNow key file found in public/');
const key = keyFile.replace('.txt', '');

let urls = process.argv.slice(2).map((p) => `https://${HOST}${p.startsWith('/') ? p : `/${p}`}`);
if (!urls.length) {
  const sm = await readFile(join(ROOT, 'dist/sitemap-0.xml'), 'utf8').catch(() => {
    throw new Error('dist/sitemap-0.xml missing: run npm run build first');
  });
  urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${keyFile}`, urlList: urls }),
});
console.log(`IndexNow: HTTP ${res.status} for ${urls.length} URL(s)`);
for (const u of urls) console.log(`  ${u}`);
if (res.status >= 400) process.exit(1);
