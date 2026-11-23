# luigicaloi.com

Luigi Caloi's academic website. A static [Astro](https://astro.build) site that replaced the old Wix site in Nov 2026, built as a faithful copy of the Wix design. Hosted on Cloudflare (auto-deploys from `main`); domain registered at Porkbun with DNS on Cloudflare.

## Commands
- `npm run dev`: local dev server (or the `site-dev` config in `.claude/launch.json`)
- `npm run build:checked`: build + SEO/GEO check. **Must print OK before any push.** Cloudflare runs the same command, so a failing check blocks the deploy.
- `npm run seo:check -- --external`: also checks outbound links
- `npm run sync:papers`: copy latest CV/paper PDFs from local project folders (`papers.sources.json`, git-ignored) into `public/files/`
- `npm run indexnow`: ping Bing/IndexNow after a deploy is live

## Where things live
- Facts about Luigi (bio, affiliation, contact, page titles/descriptions, `sameAs`): `src/data/site.ts`
- Papers: `src/content/papers/*.md` (schema in `src/content.config.ts`)
- Teaching: `src/data/teaching.ts`
- Structured data (JSON-LD): `src/lib/schema.ts`. `llms.txt`: `src/lib/llms.ts`. `robots.txt`: `src/pages/robots.txt.ts` + `src/data/crawlers.ts`
- Design tokens: `src/styles/global.css`. Measurements come from the Wix site at a 1705px viewport; keep the look unless Luigi asks for changes.
- Old Wix URLs → new: `public/_redirects` (never delete lines)
- Launch / domain / accounts checklist: `docs/LAUNCH.md`

## Rules
- For SEO/GEO tasks (add paper, update CV/bio, audits) follow the `/seo-geo` skill in `.claude/skills/seo-geo/SKILL.md`.
- URLs have no trailing slash (`build.format: 'file'`). If a URL changes, add a 301 in `public/_redirects`.
- Don't hand-edit `dist/`. Don't block crawlers. Don't invent facts about Luigi; ask.
