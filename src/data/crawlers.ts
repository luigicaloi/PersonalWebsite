// Crawlers we explicitly welcome. Search engines index the site; AI crawlers let
// ChatGPT, Claude, Perplexity, Gemini, Copilot, etc. read and cite it (GEO).
// The seo-check script verifies robots.txt never blocks any of these.
export const welcomedCrawlers = [
  // Search engines
  'Googlebot',
  'Bingbot',
  'DuckDuckBot',
  'Applebot',
  'YandexBot',
  // AI search / assistants (fetch pages to answer questions and cite sources)
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  // AI model training (opting in helps models know who you are)
  'GPTBot',
  'ClaudeBot',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'meta-externalagent',
  'Amazonbot',
] as const;
