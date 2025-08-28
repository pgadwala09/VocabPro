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
  const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:3003';
  
  try {
    const res = await fetch(`${apiUrl}/api/proxy/serpapi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: params.q,
        location: params.location,
        num: params.num,
        gl: params.gl,
        hl: params.hl,
      }),
    });
    
    if (!res.ok) {
      console.warn('SerpAPI proxy request failed:', res.status);
      return [];
    }
    
    const json = await res.json();
    return json.results || [];
  } catch (error) {
    console.error('SerpAPI search error:', error);
    return [];
  }
}








