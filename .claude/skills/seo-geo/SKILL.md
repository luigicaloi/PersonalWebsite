---
name: seo-geo
description: SEO & GEO manager for luigicaloi.com. Use to add or update a paper, update the CV or bio, run an SEO/GEO audit, or check how search engines and AI assistants (ChatGPT, Claude, Perplexity, Gemini) see Luigi Caloi. Triggers - "add a paper", "new working paper", "update my CV", "update my bio/affiliation", "SEO audit", "GEO check", "is the site indexed", "/seo-geo".
---

# SEO & GEO manager for luigicaloi.com

The site is built so that **one edit updates everything**: the visible page, meta tags, JSON-LD structured data, `sitemap.xml`, `llms.txt` and `llms-full.txt`. Never hand-edit generated output in `dist/`.

Where facts live:
- `src/data/site.ts`: name, job title, affiliation, PhD, contact, address, page titles/descriptions, `sameAs` profile links
- `src/content/papers/*.md`: one file per paper (frontmatter + abstract as the body)
- `src/data/teaching.ts`: courses
- `src/data/crawlers.ts`: crawlers welcomed in `robots.txt`
- `public/files/`: CV and paper PDFs (`npm run sync:papers` copies them from the project folders listed in `papers.sources.json`)
- `public/_redirects`: old URLs → new URLs (301). Add a line whenever a URL changes; never delete old lines.

Always finish a change with `npm run build:checked`. It must print `OK`. Fix every ERROR; mention warnings to Luigi.

## Workflow: add or update a paper

1. Ask for anything missing: title, coauthors (+ their websites), status (`published` / `working` / `wip`), PDF location or journal link, abstract, image (optional), date.
2. Create/edit `src/content/papers/<slug>.md`. Slug = short kebab-case title. Copy the frontmatter shape from an existing file of the same status. Rules:
   - `order` sets position inside its section (1 = top); renumber the others if needed.
   - Published papers need `journal`, `datePublished` (YYYY-MM), `doi` if there is one, and a `venueLine` like `"**[Journal](url)**, pages, Month Year"`.
   - Working papers with a PDF: `link: /files/papers/<slug>.pdf`, add the source path to `papers.sources.json`, run `npm run sync:papers`.
   - Images go in `src/assets/images/` (any size; Astro optimizes). `imageAlt` is required: describe what the image shows.
   - Add 4–8 honest `keywords` (topics, methods, country). They feed structured data and AI summaries; don't invent claims not in the abstract.
   - Authors are listed alphabetically by surname in structured data (economics convention). If a paper uses a different order, set `authorOrder`.
3. If the paper moved from working → published, add the journal fields, keep the same slug, and if the PDF URL changes add a `_redirects` line from the old PDF path.
4. `npm run build:checked`, then preview with the `site-dev` launch config and look at /research.
5. Commit, push (Cloudflare deploys automatically), then after it's live run `npm run indexnow -- /research`.

## Workflow: update the CV

1. `npm run sync:papers` (copies the CV from the path in `papers.sources.json` to `public/files/cv.pdf`). The URL `/files/cv.pdf` never changes, so links stay valid.
2. `npm run build:checked`, commit, push, then `npm run indexnow -- /files/cv.pdf`.

## Workflow: update bio, title or affiliation

1. Edit `src/data/site.ts` (`person`, `site.description`, page descriptions) and the visible sentence in `src/pages/index.astro` if the wording changes.
2. Keep `site.description` and page descriptions 70–160 chars and titles 25–65 chars (the check enforces this). Lead with the facts people search for: name, role, institution, fields.
3. Build, check, commit, push, `npm run indexnow`.

## Workflow: SEO/GEO audit

Run these and write Luigi a short report (what's good, what to fix, in priority order):
1. `npm run build && npm run seo:check -- --external` (structure, metadata, links incl. coauthor sites).
2. Lighthouse on the live site: `npx lighthouse https://www.luigicaloi.com --only-categories=performance,accessibility,best-practices,seo --quiet --chrome-flags="--headless" --output=json --output-path=/tmp/lh.json` then summarize the four scores (target ≥95) and the top failed audits.
3. Live checks with curl: `https://www.luigicaloi.com/robots.txt`, `/llms.txt`, `/sitemap-index.xml` return 200; `http://luigicaloi.com` 301 → `https://www.luigicaloi.com/`; old URLs (`/teaching-1`, `/items/x`, the `/_files/ugd/...pdf` paths in `public/_redirects`) return 301 to a 200.
4. Confirm Cloudflare isn't blocking AI crawlers: `curl -sI -A "GPTBot" https://www.luigicaloi.com/` and the same for `ClaudeBot` and `PerplexityBot` must return 200, not 403.
5. Remind Luigi to glance at Google Search Console (Pages → indexed count, any errors) and Bing Webmaster Tools; you can't log in for Luigi.
6. `sameAs` in `src/data/site.ts`: if it's empty or missing a profile (Google Scholar, ORCID, RePEc/IDEAS, LinkedIn, Insper faculty page, SSRN), ask Luigi for the URL. This is the single biggest GEO lever: it tells AI systems all these profiles are the same person.

## Workflow: GEO spot-check (how AI assistants describe Luigi)

Search engines can be checked automatically; AI assistants can't, so give Luigi these prompts to paste into ChatGPT (with search), Perplexity, Claude and Google (AI Overview), and compare the answers against `src/data/site.ts` and the papers:
- "Who is Luigi Caloi, the economist?"
- "What does Luigi Caloi research?"
- "Which economists study performance-based intergovernmental transfers in Brazil?"
- "Who wrote 'Greener on the Other Side: Inequity and Tax Compliance'?"
- "Where does Luigi Caloi work, and where did Luigi Caloi earn a PhD?"

For each wrong or missing fact, fix the source: clearer wording in `site.ts`/abstract, a missing `sameAs` link, a missing keyword, or an outdated external profile (Google Scholar, Insper page). Then rebuild, push and `npm run indexnow`.

## Guardrails

- Don't add pages, change URLs, or redesign without Luigi's OK. If a URL must change, add a 301 in `public/_redirects`.
- Never block crawlers in `robots.txt`, never add `noindex` to real pages.
- Don't fabricate facts (awards, affiliations, dates). Ask.
