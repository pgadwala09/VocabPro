export type FirecrawlSearchParams = {
  q: string;
  limit?: number;
  page?: number;
};

export type FirecrawlSearchResult = {
  title?: string;
  url: string;
  description?: string;
  source?: string;
};

export type FirecrawlScrapeOptions = {
  url: string;
  formats?: Array<'markdown' | 'html' | 'raw' | 'links'>;
};

export type FirecrawlScrapeResponse = {
  markdown?: string;
  html?: string;
  raw?: any;
  links?: Array<{ url: string; text?: string }>;
  meta?: Record<string, any>;
};

const getBaseUrl = () => (import.meta as any).env.VITE_FIRECRAWL_BASE || 'https://api.firecrawl.dev';
const getApiKey = () => (import.meta as any).env.VITE_FIRECRAWL_API_KEY as string | undefined;

async function firecrawlFetch(path: string, body: any) {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('VITE_FIRECRAWL_API_KEY is not set. Firecrawl calls will be skipped.');
    return null;
  }
  const base = getBaseUrl().replace(/\/$/, '');
  const url = `${base}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-api-key': apiKey,
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    try {
      const txt = await res.text();
      console.warn('Firecrawl error', res.status, txt);
    } catch {}
    return null;
  }
  try { return await res.json(); } catch { return null; }
}

async function firecrawlGet(path: string, params: Record<string, any>) {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  const base = getBaseUrl().replace(/\/$/, '');
  const query = new URLSearchParams(params as any).toString();
  const url = `${base}${path}?${query}`;
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'x-api-key': apiKey,
      'Authorization': `Bearer ${apiKey}`,
    }
  });
  if (!res.ok) return null;
  try { return await res.json(); } catch { return null; }
}

export async function firecrawlSearch(params: FirecrawlSearchParams): Promise<FirecrawlSearchResult[]> {
  let json = await firecrawlFetch('/v1/search', {
    query: params.q,
    limit: params.limit ?? 10,
    page: params.page ?? 1,
  });
  if (!json) {
    // Fallback to GET variant if POST is not supported on the account
    json = await firecrawlGet('/v1/search', {
      q: params.q,
      limit: params.limit ?? 10,
      page: params.page ?? 1,
    });
  }
  if (!json) return [];
  const items: any[] = json.results || json.data || [];
  return items.map((r: any) => ({
    title: r.title || r.meta_title,
    url: r.url || r.link,
    description: r.description || r.snippet,
    source: r.source,
  })).filter((r: any) => r.url);
}

export async function firecrawlScrape(options: FirecrawlScrapeOptions): Promise<FirecrawlScrapeResponse | null> {
  const { url, formats = ['markdown', 'links'] } = options;
  const json = await firecrawlFetch('/v1/scrape', {
    url,
    formats,
  });
  if (!json) return null;
  return {
    markdown: json.markdown,
    html: json.html,
    raw: json.raw,
    links: json.links,
    meta: json.meta,
  } as FirecrawlScrapeResponse;
}

export async function firecrawlCrawl(startUrl: string, limit = 10) {
  const json = await firecrawlFetch('/v1/crawl', {
    url: startUrl,
    limit,
  });
  if (!json) return [];
  const pages: any[] = json.pages || json.results || [];
  return pages;
}
