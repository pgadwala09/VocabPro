export type LTMatch = {
  message: string;
  offset: number;
  length: number;
  sentence: string;
  ruleId: string;
  replacements: string[];
};

export async function checkGrammarLanguageTool(
  text: string,
  language: string = 'en-US'
): Promise<LTMatch[] | null> {
  if (!text || !text.trim()) return [];

  const base = (import.meta.env.VITE_LT_API_URL as string) || 'https://api.languagetool.org';
  const url = `${base.replace(/\/$/, '')}/v2/check`;

  const params = new URLSearchParams();
  params.set('text', text);
  params.set('language', language);
  // enable both grammar and style
  params.set('enabledOnly', 'false');

  const headers: Record<string, string> = {
    'content-type': 'application/x-www-form-urlencoded',
  };

  // Optional bearer for LT Cloud (e.g., https://api.languagetoolplus.com)
  const bearer = import.meta.env.VITE_LT_BEARER_TOKEN as string | undefined;
  if (bearer) headers['Authorization'] = `Bearer ${bearer}`;

  try {
    const res = await fetch(url, { method: 'POST', headers, body: params });
    if (!res.ok) return null;
    const json = await res.json();
    const matches = (json.matches || []) as any[];
    return matches.map((m) => ({
      message: m.message,
      offset: m.offset,
      length: m.length,
      sentence: m.sentence || '',
      ruleId: m.rule?.id || '',
      replacements: (m.replacements || []).slice(0, 5).map((r: any) => r.value),
    }));
  } catch {
    return null;
  }
}




