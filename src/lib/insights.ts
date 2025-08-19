export type DebateInsights = {
  topic: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  argumentStrength: { builder: number; breaker: number; rationale: string };
  keyPoints: string[];
  grammarIssues: Array<{ excerpt: string; issue: string; suggestion: string }>;
};

export type VocabInsights = {
  overallAccuracy: number;
  commonErrors: string[];
  practiceSuggestions: string[];
};

async function callOpenAI(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): Promise<any | null> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  const proxy = import.meta.env.VITE_OPENAI_PROXY as string | undefined;
  const usingProxy = !!proxy;
  const url = usingProxy ? `${proxy}/api/openai/chat` : `https://api.openai.com/v1/chat/completions`;
  if (!apiKey && !usingProxy) return null;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Lightweight text helper for prompts that should return plain text
async function callOpenAIText(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: { temperature?: number; max_tokens?: number }
): Promise<string | null> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  const proxy = import.meta.env.VITE_OPENAI_PROXY as string | undefined;
  const usingProxy = !!proxy;
  const url = usingProxy ? `${proxy}/api/openai/chat` : `https://api.openai.com/v1/chat/completions`;
  if (!apiKey && !usingProxy) return null;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: options?.temperature ?? 0.6,
        max_tokens: options?.max_tokens ?? 220,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content as string | undefined;
    return text || null;
  } catch {
    return null;
  }
}

// Generate a short debate turn for a given side. When opponentLast is provided,
// produce a rebuttal that references it explicitly.
export async function generateDebateTurn(
  side: 'pro' | 'con',
  topic: string,
  opponentLast?: string | null
): Promise<string | null> {
  const system = {
    role: 'system' as const,
    content:
      'You are a world-class competitive debater. Produce a SINGLE short turn (2–4 concise sentences, 8–12 seconds when spoken). Be persuasive, concrete, and avoid meta-language. No headings or labels. No prefaces like "Here is". Output plain text only.'
  };
  const roleInstruction = side === 'pro'
    ? 'Take the PRO position and deliver a crisp opening that frames the issue and gives 1–2 concrete benefits or pieces of evidence.'
    : 'Take the CON position and rebut the opponent directly. Call out a flaw or assumption in their argument, then present a counterpoint with 1 example or impact.';
  const user = {
    role: 'user' as const,
    content: `Topic: ${topic}
${opponentLast ? `Opponent just said: ${opponentLast}
` : ''}Task: ${roleInstruction}`,
  };
  return await callOpenAIText([system, user], { temperature: 0.7, max_tokens: 180 });
}

export async function analyzeDebateTranscript(transcript: string, topic: string): Promise<DebateInsights | null> {
  const system = {
    role: 'system' as const,
    content:
      'You are an expert debate coach. Return ONLY JSON with keys: topic, sentiment (positive|neutral|negative), argumentStrength {builder: 0-100, breaker: 0-100, rationale}, keyPoints (array of short strings), grammarIssues (array of {excerpt, issue, suggestion}).',
  };
  const user = {
    role: 'user' as const,
    content: `Topic: ${topic}\nTranscript:\n${transcript}`,
  };
  const json = await callOpenAI([system, user]);
  return json as DebateInsights | null;
}

export async function analyzeVocabularyAnswers(answers: Array<{ prompt: string; user: string }>): Promise<VocabInsights | null> {
  const system = {
    role: 'system' as const,
    content:
      'You are a language tutor. Return ONLY JSON with keys: overallAccuracy (0-100), commonErrors (array), practiceSuggestions (array).',
  };
  const user = {
    role: 'user' as const,
    content: `Assess these vocabulary attempts: ${JSON.stringify(answers).slice(0, 8000)}`,
  };
  const json = await callOpenAI([system, user]);
  return json as VocabInsights | null;
}

export async function generateSpeakingParagraphs(
  title: string,
  ageGroup: string,
  proficiencyLevel: string,
  curriculum?: string
): Promise<string | null> {
  const system = {
    role: 'system' as const,
    content:
      'You are a creative ESL speech coach. Write 2-3 short paragraphs for speaking practice using vivid, age-appropriate, imaginative language. Use simple stage directions (e.g., [Pause], [Emphasize]) sparingly. Output only plain text.'
  };
  const user = {
    role: 'user' as const,
    content: `Title: ${title}\nAudience: ${ageGroup}\nLevel: ${proficiencyLevel}${curriculum ? `\nCurriculum: ${curriculum}` : ''}\nTask: Generate 2-3 short, engaging paragraphs for a kid to speak aloud.`
  };
  const json = await callOpenAI([system, user]);
  // callOpenAI enforces JSON response_format; for this endpoint we want text.
  // If the proxy responds with a JSON string under {text}, handle both cases.
  if (!json) return null;
  if (typeof json === 'string') return json;
  if (json.text) return json.text as string;
  // Fallback: stringify minimal
  try { return JSON.stringify(json); } catch { return null; }
}

// Generate detailed creative notes with structured sections (Introduction, Beginner, Middle, Conclusion)
export async function generateStructuredNotes(
  title: string,
  baseContent: string,
  ageGroup: string,
  proficiencyLevel: string,
  curriculum?: string
): Promise<string | null> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  const proxy = import.meta.env.VITE_OPENAI_PROXY as string | undefined;
  const url = (proxy || 'https://api.openai.com') + '/v1/chat/completions';
  if (!apiKey && !proxy) return null;

  const system = {
    role: 'system',
    content:
      'You are a master ESL content writer and storyteller. ALWAYS produce vivid, student-friendly notes in EXACTLY four sections: Introduction, Beginner, Middle, Conclusion. Use imaginative and creative language (metaphors, kid-friendly analogies), while being clear and accurate. Output plain text ONLY (no markdown headings beyond the section titles).'
  } as const;
  const user = {
    role: 'user',
    content:
      `Title: ${title}
Audience: ${ageGroup}
Level: ${proficiencyLevel}${curriculum ? `\nCurriculum: ${curriculum}` : ''}
Source content (may be rough markdown/links). If short or low-quality, expand with your own knowledge while keeping it age-appropriate:\n${baseContent.slice(0, 6000)}\n
Task: Return four sections with BLANK LINES between them. Use the following structure and length targets:
Introduction: 3–4 sentences (70–120 words). Give a vivid hook and define the topic simply.
Beginner: 5–7 short bullets. Explain basics with friendly examples and a micro-activity.
Middle: 2 paragraphs (120–200 words total). Add a creative analogy or mini-story + one hands-on activity idea.
Conclusion: 3 bullets of key takeaways + 1 short challenge question.

Write in lively, positive tone. Avoid repetition. Plain text only (no JSON).`
  } as const;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [system, user],
        temperature: 0.8,
        max_tokens: 1200,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content as string | undefined;
    return text || null;
  } catch {
    return null;
  }
}

export async function transcribeAudioWhisper(audio: Blob): Promise<string | null> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  const proxy = import.meta.env.VITE_OPENAI_PROXY as string | undefined;
  const url = (proxy || 'https://api.openai.com') + '/v1/audio/transcriptions';
  if (!apiKey && !proxy) return null;

  const form = new FormData();
  form.append('file', audio, 'recording.webm');
  form.append('model', 'whisper-1');
  form.append('response_format', 'text');

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: form,
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text;
  } catch {
    return null;
  }
}


