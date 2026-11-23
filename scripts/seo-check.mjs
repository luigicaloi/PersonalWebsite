#!/usr/bin/env node
// SEO & GEO check for the built site (dist/). Runs after every build, locally,
// in GitHub Actions and in the Cloudflare build. Any ERROR fails the build so a
// regression can never go live.
//
//   npm run seo:check              check dist/
//   npm run seo:check -- --external  also check outbound links (slower, warnings only)

import { readFile, readdir, access } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
const SITE = 'https://www.luigicaloi.com';
const EXTERNAL = process.argv.includes('--external');

// Keep in sync with src/data/crawlers.ts (checked below).
const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const exists = async (p) => access(p).then(() => true, () => false);
async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

if (!(await exists(DIST))) {
  console.error('dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

const files = await walk(DIST);
const htmlFiles = files.filter((f) => f.endsWith('.html'));

// ---- _redirects ------------------------------------------------------------
const redirects = [];
const redirectsFile = join(DIST, '_redirects');
if (await exists(redirectsFile)) {
  for (const line of (await readFile(redirectsFile, 'utf8')).split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const [from, to, code] = t.split(/\s+/);
    redirects.push({ from, to, code });
  }
} else {
  err('_redirects', 'missing (old Wix URLs would 404)');
}

/** Does a site-relative path resolve to a built file or a redirect? */
async function resolves(pathname) {
  const p = decodeURIComponent(pathname.split('#')[0].split('?')[0]);
  if (p === '/' || p === '') return true;
  const candidates = [join(DIST, p), join(DIST, `${p}.html`), join(DIST, p, 'index.html')];
  for (const c of candidates) if (await exists(c)) return true;
  return redirects.some((r) => r.from === p || (r.from.endsWith('*') && p.startsWith(r.from.slice(0, -1))));
}

for (const r of redirects) {
  if (!['301', '302', '308'].includes(r.code ?? '')) err('_redirects', `${r.from} has no permanent status code`);
  if (r.to.startsWith('/') && !(await resolves(r.to))) err('_redirects', `${r.from} -> ${r.to}: target does not exist`);
}

// ---- sitemap ---------------------------------------------------------------
const sitemapUrls = new Set();
for (const f of files.filter((f) => /sitemap-\d+\.xml$/.test(f))) {
  for (const m of (await readFile(f, 'utf8')).matchAll(/<loc>([^<]+)<\/loc>/g)) sitemapUrls.add(m[1]);
}
if (!sitemapUrls.size) err('sitemap', 'no URLs found in dist/sitemap-*.xml');
for (const u of sitemapUrls) {
  if (!u.startsWith(SITE)) err('sitemap', `${u} is not on ${SITE}`);
  else if (!(await resolves(u.slice(SITE.length) || '/'))) err('sitemap', `${u} has no built page`);
}

// ---- pages -----------------------------------------------------------------
const externalLinks = new Set();
for (const file of htmlFiles) {
  const rel = '/' + relative(DIST, file);
  const is404 = rel === '/404.html';
  const path = rel === '/index.html' ? '/' : rel.replace(/\.html$/, '');
  const doc = parse(await readFile(file, 'utf8'));
  const meta = (sel) => doc.querySelector(sel)?.getAttribute('content')?.trim();
  const where = path;

  const title = doc.querySelector('title')?.text.trim() ?? '';
  if (!title) err(where, 'missing <title>');
  else if (!is404 && (title.length < 25 || title.length > 65)) err(where, `title is ${title.length} chars (want 25–65): "${title}"`);

  const desc = meta('meta[name="description"]') ?? '';
  if (!desc) err(where, 'missing meta description');
  else if (!is404 && (desc.length < 70 || desc.length > 160)) err(where, `description is ${desc.length} chars (want 70–160)`);

  if (doc.querySelector('html')?.getAttribute('lang') !== 'en') err(where, '<html lang="en"> missing');

  const robots = meta('meta[name="robots"]') ?? '';
  if (!is404 && /noindex/.test(robots)) err(where, 'page is marked noindex');

  const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
  if (!canonical) err(where, 'missing canonical link');
  else if (!is404) {
    const expected = path === '/' ? `${SITE}/` : `${SITE}${path}`;
    const norm = (u) => u.replace(/\/$/, '');
    if (norm(canonical) !== norm(expected)) err(where, `canonical ${canonical} should be ${expected}`);
    if (![...sitemapUrls].some((u) => norm(u) === norm(canonical))) err(where, `canonical ${canonical} is not in the sitemap`);
  }

  for (const prop of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type']) {
    if (!meta(`meta[property="${prop}"]`)) err(where, `missing ${prop}`);
  }
  if (!meta('meta[name="twitter:card"]')) err(where, 'missing twitter:card');

  const h1s = doc.querySelectorAll('h1');
  if (h1s.length !== 1) err(where, `has ${h1s.length} <h1> elements (want exactly 1)`);

  // Structured data
  const ld = doc.querySelectorAll('script[type="application/ld+json"]');
  if (!is404 && !ld.length) err(where, 'no JSON-LD structured data');
  for (const s of ld) {
    let data;
    try {
      data = JSON.parse(s.text);
    } catch (e) {
      err(where, `JSON-LD does not parse: ${e.message}`);
      continue;
    }
    const nodes = data['@graph'] ?? [data];
    const person = nodes.find((n) => n['@type'] === 'Person');
    if (!person) err(where, 'JSON-LD has no Person node');
    else for (const k of ['name', 'url', 'jobTitle', 'worksFor', 'image']) if (!person[k]) err(where, `JSON-LD Person missing ${k}`);
    if (person && !(person.sameAs ?? []).length) warn(where, 'Person has no sameAs profile links (add Google Scholar/ORCID/etc. in src/data/site.ts)');
    const walkLd = (o) => {
      if (Array.isArray(o)) return o.forEach(walkLd);
      if (o && typeof o === 'object') {
        if (o['@type'] === 'ScholarlyArticle') {
          for (const k of ['headline', 'author']) if (!o[k]) err(where, `ScholarlyArticle "${o.headline ?? '?'}" missing ${k}`);
        }
        Object.values(o).forEach(walkLd);
      }
    };
    walkLd(data);
  }

  // Images
  for (const img of doc.querySelectorAll('img')) {
    const alt = img.getAttribute('alt');
    if (alt === undefined || (alt.trim() === '' && img.getAttribute('role') !== 'presentation')) err(where, `<img src="${img.getAttribute('src')}"> has no alt text`);
    if (!img.getAttribute('width') || !img.getAttribute('height')) warn(where, `<img src="${img.getAttribute('src')}"> lacks width/height (layout shift)`);
  }

  // Links and assets
  const refs = [
    ...doc.querySelectorAll('a[href]').map((a) => a.getAttribute('href')),
    ...doc.querySelectorAll('link[href]').map((l) => l.getAttribute('href')),
    ...doc.querySelectorAll('img[src], script[src]').map((e) => e.getAttribute('src')),
    ...doc.querySelectorAll('img[srcset]').flatMap((e) => e.getAttribute('srcset').split(',').map((s) => s.trim().split(/\s+/)[0])),
  ];
  for (const href of refs) {
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
    if (/^https?:\/\//.test(href)) {
      if (href.startsWith(SITE)) {
        if (!(await resolves(href.slice(SITE.length) || '/'))) err(where, `link to ${href} does not resolve`);
      } else externalLinks.add(href);
      continue;
    }
    if (href.startsWith('/') && !(await resolves(href))) err(where, `broken internal link/asset: ${href}`);
  }
}

// ---- robots.txt ------------------------------------------------------------
const robotsTxt = await readFile(join(DIST, 'robots.txt'), 'utf8').catch(() => '');
if (!robotsTxt) err('robots.txt', 'missing');
else {
  if (!/^Sitemap:\s*https:\/\/www\.luigicaloi\.com\/sitemap-index\.xml/m.test(robotsTxt)) err('robots.txt', 'no Sitemap line');
  if (/^Disallow:\s*\/\s*$/m.test(robotsTxt)) err('robots.txt', 'contains "Disallow: /" — that blocks a crawler from the whole site');
  const crawlersSrc = await readFile(join(ROOT, 'src/data/crawlers.ts'), 'utf8');
  const welcomed = [...crawlersSrc.matchAll(/'([A-Za-z-]+)'/g)].map((m) => m[1]);
  for (const ua of ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended', 'Bingbot', 'Googlebot']) {
    if (!welcomed.includes(ua)) err('crawlers.ts', `${ua} is no longer in the welcomed list`);
    if (!robotsTxt.includes(`User-agent: ${ua}`)) err('robots.txt', `${ua} is not explicitly allowed`);
  }
}

// ---- llms.txt --------------------------------------------------------------
const llms = await readFile(join(DIST, 'llms.txt'), 'utf8').catch(() => '');
const llmsFull = await readFile(join(DIST, 'llms-full.txt'), 'utf8').catch(() => '');
if (!llms) err('llms.txt', 'missing');
if (!llmsFull) err('llms-full.txt', 'missing');
const paperDir = join(ROOT, 'src/content/papers');
for (const f of (await readdir(paperDir)).filter((f) => f.endsWith('.md'))) {
  const src = await readFile(join(paperDir, f), 'utf8');
  const title = src.match(/^title:\s*"?(.+?)"?\s*$/m)?.[1];
  const body = src.split(/^---\s*$/m)[2]?.trim() ?? '';
  if (title && !llms.includes(title)) err('llms.txt', `missing paper "${title}"`);
  if (body && !llmsFull.includes(body.slice(0, 60))) err('llms-full.txt', `missing abstract of "${title}"`);
}

// ---- IndexNow key ------------------------------------------------------------
if (!files.some((f) => /\/[0-9a-f]{32}\.txt$/.test(f))) warn('indexnow', 'no IndexNow key file in public/');

// ---- external links (optional) ---------------------------------------------
if (EXTERNAL) {
  await Promise.all(
    [...externalLinks].map(async (u) => {
      try {
        let r = await fetch(u, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(15000) });
        if (r.status === 405 || r.status === 403) r = await fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(15000) });
        if (r.status >= 400) warn('external', `${u} -> HTTP ${r.status}`);
      } catch (e) {
        warn('external', `${u} -> ${e.cause?.code ?? e.message}`);
      }
    }),
  );
}

// ---- report ----------------------------------------------------------------
console.log(`SEO/GEO check: ${htmlFiles.length} pages, ${sitemapUrls.size} sitemap URLs, ${redirects.length} redirects${EXTERNAL ? `, ${externalLinks.size} external links` : ''}`);
for (const w of warnings) console.log(`  warn  ${w}`);
for (const e of errors) console.log(`  ERROR ${e}`);
if (errors.length) {
  console.log(`\n${errors.length} error(s). Fix them before deploying.`);
  process.exit(1);
}
console.log(`OK${warnings.length ? ` (${warnings.length} warning(s))` : ''}`);
