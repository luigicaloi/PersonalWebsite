// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.luigicaloi.com',
  // Emit research.html (served at /research) so URLs match the old Wix site: no trailing slash.
  build: { format: 'file' },
  trailingSlash: 'never',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      lastmod: new Date(),
    }),
  ],
});
