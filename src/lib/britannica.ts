export type BritannicaResult = {
  title: string;
  url: string;
  snippet?: string;
};

// Britannica does not provide an open public API. This lightweight helper searches via SerpAPI
// and filters results to encyclopedia Britannica, returning normalized results.
// Requires VITE_SERPAPI_KEY (already supported via src/lib/serp.ts)
import { serpSearch } from './serp';
import { firecrawlSearch } from './firecrawl';

export async function britannicaSearch(query: string, limit = 5): Promise<BritannicaResult[]> {
  // 1) Try SerpAPI (fastest, most reliable when key is available)
  try {
    const serp = await serpSearch({ q: `${query} site:britannica.com OR site:kids.britannica.com`, num: limit, hl: 'en', gl: 'us' });
    const viaSerp = (serp || [])
      .filter(r => r.link && /(kids\.)?britannica\.com\//i.test(r.link))
      .slice(0, limit)
      .map(r => ({ title: r.title, url: r.link!, snippet: r.snippet }));
    if (viaSerp.length > 0) return viaSerp;
  } catch {}

  // 2) Fallback to Firecrawl web search
  try {
    const q = `${query} site:britannica.com OR site:kids.britannica.com`;
    const hits = await firecrawlSearch({ q, limit });
    const viaFirecrawl = (hits || [])
      .filter(h => h.url && /(kids\.)?britannica\.com\//i.test(h.url))
      .slice(0, limit)
      .map(h => ({ title: h.title || h.url, url: h.url, snippet: h.description }));
    return viaFirecrawl;
  } catch {}

  return [];
}


