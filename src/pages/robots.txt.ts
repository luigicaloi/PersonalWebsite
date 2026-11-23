import type { APIRoute } from 'astro';
import { welcomedCrawlers } from '../data/crawlers';

export const GET: APIRoute = ({ site }) => {
  const lines = [
    '# Luigi Caloi — everyone is welcome to crawl this site, including AI search and assistants.',
    '',
    ...welcomedCrawlers.flatMap((ua) => [`User-agent: ${ua}`, 'Allow: /', '']),
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${new URL('/sitemap-index.xml', site)}`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
