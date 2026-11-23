# luigicaloi.com

Source for [www.luigicaloi.com](https://www.luigicaloi.com): Luigi Caloi, Assistant Professor at Insper (public and development economics).

Static site built with [Astro](https://astro.build), hosted on Cloudflare.

```bash
npm install
npm run dev            # http://localhost:4321
npm run build:checked  # build + SEO/GEO check
```

Content lives in `src/data/site.ts` (profile), `src/content/papers/` (one Markdown file per paper) and `src/data/teaching.ts`. See `CLAUDE.md` for the full layout and `docs/LAUNCH.md` for hosting and domain setup.
