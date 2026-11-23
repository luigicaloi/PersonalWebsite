# Launch checklist: moving luigicaloi.com off Wix

Order matters. The domain is at Wix until the Porkbun transfer finishes; the site moves to Cloudflare; Wix is cancelled last.

## 1. Domain transfer (started Nov 23, 2026)
- [x] Wix → Domains → luigicaloi.com: transfer lock off, EPP (authorization) code requested. WHOIS shows status `ok` (unlocked).
- [x] Porkbun: create account → **Domain Transfer** → `luigicaloi.com` + EPP code → pay (~$11, adds 1 year). Keep WHOIS privacy on.
- [ ] Approve the transfer if Wix or Porkbun emails a confirmation link (otherwise it completes automatically in up to 5 days).
- [ ] **Fallback:** if `whois luigicaloi.com` doesn't show Porkbun by **Nov 27**, renew the domain at Wix for 1 year (the year carries over when the transfer finishes). Don't edit the domain's contact info at Wix (that triggers a 60-day transfer lock).

Check progress any time:
```bash
whois luigicaloi.com | grep -iE 'Registrar:|Expiry|Status'
```

## 2. Cloudflare hosting (can be done before the transfer finishes)
Cloudflare now calls Pages "legacy", so the site runs as a static-assets **Worker** (config in `wrangler.jsonc`).
- [x] Create a free Cloudflare account.
- [x] **Compute → Workers & Pages → Create → Connect GitHub** → choose `luigicaloi/PersonalWebsite`.
  - Project name: `luigicaloi`
  - Build command: `npm run build:checked`
  - Deploy command: `npx wrangler deploy`
  - Node version: pinned to 24 by `.node-version` in the repo
- [x] Open https://luigicaloi.luigicaloi.workers.dev, click through all pages, and test the redirects (all checked Nov 23: pages 200, old Wix URLs 301, AI crawlers 200):
```bash
for p in /teaching-1 /items/x /_files/ugd/50b58f_caed96a1bb484ccf8dcd8a137e6090c7.pdf; do curl -sI "https://luigicaloi.luigicaloi.workers.dev$p" | grep -iE '^(HTTP|location)'; done
```
- [ ] Turn on Web Analytics for the Worker (free, no cookies).

## 3. Cloudflare DNS zone (prepare before the transfer finishes)
- [ ] **Add a domain** → `luigicaloi.com` → Free plan. Cloudflare imports Wix's current records; leave them for now.
- [ ] When asked about AI crawlers, choose **do not block**. Then double-check:
  - Security → Bots: **Block AI bots = off**, Bot Fight Mode = off
  - AI Crawl Control (if shown): all crawlers **allowed**
  - "Managed robots.txt" / Content Signals: **off** (our own `robots.txt` already welcomes crawlers)
- [ ] SSL/TLS → **Full**; Edge Certificates → **Always Use HTTPS = on**.
- [ ] Note the two Cloudflare nameservers shown (e.g. `xxx.ns.cloudflare.com`).

## 4. Cutover (when Porkbun shows the domain as yours)
- [ ] Porkbun → luigicaloi.com → **Authoritative nameservers** → replace with the two Cloudflare nameservers.
- [ ] Wait for Cloudflare to mark the zone **Active** (minutes to a few hours).
- [ ] Worker `luigicaloi` → **Settings → Domains & Routes → Add → Custom domain** → add `www.luigicaloi.com`, then `luigicaloi.com`. Cloudflare replaces the old Wix records automatically; delete any leftover A records pointing to `185.230.63.*` or CNAME to `wixdns.net`.
- [ ] Rules → **Redirect Rules** → template "Redirect from root to WWW": `luigicaloi.com/*` → `https://www.luigicaloi.com/${1}`, 301, preserve query string.
- [ ] Worker → Settings → Domains & Routes: turn **off** the `workers.dev` and preview URLs, so only www.luigicaloi.com is indexed.
- [ ] Verify:
```bash
curl -sI http://luigicaloi.com | grep -iE '^(HTTP|location)'
curl -sI https://luigicaloi.com | grep -iE '^(HTTP|location)'
curl -sI https://www.luigicaloi.com/ | grep -iE '^HTTP'
curl -sI -A GPTBot https://www.luigicaloi.com/ | grep -iE '^HTTP'
```
Expect 301 → `https://www.luigicaloi.com/`, then 200, and 200 for GPTBot (not 403).

## 5. Wix shutdown (only after step 4 is verified)
- [ ] Cancel the Wix Premium plan (or let it expire).
- [ ] Close the Wix account **only after** `whois` shows Porkbun as registrar.

## 6. Search engines & AI visibility
- [ ] **Google Search Console** → Add property → **Domain** → `luigicaloi.com` → verify with the TXT record (add it in Cloudflare DNS). → Sitemaps → submit `https://www.luigicaloi.com/sitemap-index.xml`. → URL Inspection → Request indexing for `/`, `/research`, `/teaching`.
- [ ] **Bing Webmaster Tools** → sign in → **Import from Google Search Console**. (Bing's index feeds ChatGPT search and Microsoft Copilot.)
- [ ] Run `npm run indexnow` once the site is live.
- [ ] Put `https://www.luigicaloi.com` on your Google Scholar, ORCID, RePEc/IDEAS, LinkedIn and Insper profile pages, and add those profile URLs to `sameAs` in `src/data/site.ts`.
- [ ] A month later: run the `/seo-geo` audit and GEO spot-check.

## Not needed
- **Email:** the domain has no MX records, so no email to migrate. (If you ever want `@luigicaloi.com` addresses, Cloudflare Email Routing is free.)
- **Cloudflare Registrar:** optional later (60+ days after the transfer) to have domain, DNS and hosting in one account. Porkbun is fine to keep.
