export type SerpSearchParams = {
  q: string;
  location?: string;
  num?: number; // number of results
  gl?: string; // country
  hl?: string; // language
};

export type SerpOrganicResult = {
  position: number;
  title: string;
  link: string;
  snippet?: string;
  source?: string;
};

export async function serpSearch(params: SerpSearchParams): Promise<SerpOrganicResult[]> {
  const apiKey = (import.meta as any).env.VITE_SERPAPI_KEY as string | undefined;
  if (!apiKey) {
    console.warn('VITE_SERPAPI_KEY is not set. serpSearch will return empty results.');
    return [];
  }

  const query = new URLSearchParams({
    engine: 'google',
    api_key: apiKey,
    q: params.q,
    ...(params.location ? { location: params.location } : {}),
    ...(params.gl ? { gl: params.gl } : {}),
    ...(params.hl ? { hl: params.hl } : {}),
    ...(params.num ? { num: String(params.num) } : {}),
  });

  const url = `https://serpapi.com/search.json?${query.toString()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    const organic: any[] = json.organic_results || [];
    return organic.map((r, idx) => ({
      position: r.position ?? idx + 1,
      title: r.title,
      link: r.link,
      snippet: r.snippet,
      source: r.source,
    }));
  } catch {
    return [];
  }
}








