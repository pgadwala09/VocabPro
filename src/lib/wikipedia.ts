export type WikiSearchHit = {
  pageid: number;
  title: string;
  snippet?: string;
};

export type WikiArticle = {
  title: string;
  url: string;
  extract: string;
};

const API_BASE = 'https://en.wikipedia.org/w/api.php';
const REST_BASE = 'https://en.wikipedia.org/api/rest_v1';

export async function wikiSearch(query: string, limit = 5): Promise<WikiSearchHit[]> {
  const params = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: query,
    srlimit: String(limit),
    utf8: '1',
    format: 'json',
    origin: '*',
  });
  try {
    const res = await fetch(`${API_BASE}?${params.toString()}`);
    if (!res.ok) return [];
    const json = await res.json();
    const hits: any[] = json?.query?.search || [];
    return hits.map(h => ({ pageid: h.pageid, title: h.title, snippet: h.snippet }));
  } catch {
    return [];
  }
}

export async function wikiGetSummary(title: string): Promise<WikiArticle | null> {
  const url = `${REST_BASE}/page/summary/${encodeURIComponent(title)}`;
  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return null;
    const json = await res.json();
    const articleUrl = json?.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
    const extract = json?.extract || '';
    return { title: json?.title || title, url: articleUrl, extract };
  } catch {
    return null;
  }
}

export async function wikiBestArticle(query: string): Promise<WikiArticle | null> {
  const hits = await wikiSearch(query, 1);
  const title = hits?.[0]?.title || query;
  const summary = await wikiGetSummary(title);
  return summary;
}










