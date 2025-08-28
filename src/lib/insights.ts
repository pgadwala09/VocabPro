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
    console.log('🔍 OpenAI API call details:');
    console.log('  - URL:', url);
    console.log('  - API Key:', apiKey ? 'Present' : 'Missing');
    console.log('  - Proxy:', proxy ? 'Present' : 'Missing');
    
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
    
    console.log('📡 OpenAI API response status:', res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ OpenAI API error:', errorText);
      return null;
    }
    
    const data = await res.json();
    console.log('📝 OpenAI API response data:', data);
    
    const text = data.choices?.[0]?.message?.content as string | undefined;
    console.log('📄 OpenAI extracted text:', text ? 'Present' : 'Missing');
    
    return text || null;
  } catch (error) {
    console.error('❌ OpenAI API request failed:', error);
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

// Generate comprehensive content with specific sections: Introduction, Middle, Conclusion
export async function generateComprehensiveContent(
  topic: string,
  ageGroup: string,
  proficiencyLevel: string,
  curriculum?: string
): Promise<string | null> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  const proxy = import.meta.env.VITE_OPENAI_PROXY as string | undefined;
  const url = (proxy || 'https://api.openai.com') + '/v1/chat/completions';
  if (!apiKey && !proxy) return null;

  // Generate a random perspective to ensure variety
  const perspectives = [
    'scientific researcher', 'historical expert', 'technology innovator', 'environmental scientist',
    'cultural anthropologist', 'economic analyst', 'medical professional', 'space explorer',
    'artistic creator', 'philosophical thinker', 'social activist', 'future predictor'
  ];
  const randomPerspective = perspectives[Math.floor(Math.random() * perspectives.length)];

  // Generate random focus areas for variety
  const focusAreas = [
    'cutting-edge developments', 'historical evolution', 'global impact', 'future implications',
    'scientific breakthroughs', 'cultural significance', 'economic importance', 'environmental effects',
    'social transformation', 'technological innovation', 'human psychology', 'sustainability aspects'
  ];
  const randomFocus = focusAreas[Math.floor(Math.random() * focusAreas.length)];

  const system = {
    role: 'system',
    content:
      `You are a world-renowned ${randomPerspective} and master educator with deep expertise in ${randomFocus}. You specialize in creating advanced, sophisticated learning materials that go beyond basic information. Your content should be intellectually stimulating, factually rich, and provide unique insights that students won't find elsewhere. Use advanced vocabulary, complex concepts, and provide detailed analysis while maintaining accessibility for the target age group.`
  } as const;

  const user = {
    role: 'user',
    content:
      `Create ADVANCED and SOPHISTICATED content about "${topic}" for ${ageGroup} students at ${proficiencyLevel} level${curriculum ? ` following ${curriculum} curriculum` : ''}.

IMPORTANT: This must be ADVANCED content with:
- Sophisticated vocabulary and complex concepts
- Detailed technical explanations
- Multiple perspectives and viewpoints
- Controversial or debated aspects
- Cutting-edge research and developments
- Global and cultural implications
- Future predictions and trends
- Interdisciplinary connections

Structure the content in exactly THREE sections with clear headings:

INTRODUCTION:
- Provide a sophisticated definition that goes beyond basic explanations
- Include multiple interpretations or perspectives on what ${topic} means
- Highlight advanced benefits and advantages that aren't commonly known
- Use sophisticated, academic language while remaining accessible
- Include why this topic is crucial for future understanding and development
- Mention controversial or debated aspects of ${topic}

MIDDLE SECTION:
- Provide ADVANCED facts, evidence, and supporting information about ${topic}
- Include cutting-edge research, recent discoveries, and breakthrough findings
- Present multiple viewpoints, including opposing or controversial perspectives
- Use sophisticated analogies and complex examples
- Include interdisciplinary connections (how ${topic} relates to other fields)
- Provide detailed technical explanations and mechanisms
- Include global implications and cultural variations
- Mention future trends, predictions, and emerging developments
- Include statistical data, research studies, and expert opinions
- Discuss challenges, limitations, and areas of ongoing research

CONCLUSION:
- Synthesize complex information into powerful insights
- Provide sophisticated takeaways that demonstrate deep understanding
- Include thought-provoking questions that challenge conventional thinking
- End with advanced implications for the future
- Suggest areas for further research and exploration
- Include philosophical or ethical considerations
- Provide actionable steps for advanced learning and application

Requirements:
- Use ADVANCED vocabulary appropriate for ${proficiencyLevel} level
- Include complex concepts and sophisticated explanations
- Provide multiple perspectives and viewpoints
- Include controversial or debated aspects
- Make interdisciplinary connections
- Include cutting-edge research and developments
- Discuss global implications and cultural variations
- Include future predictions and trends
- Use sophisticated analogies and examples
- Provide detailed technical explanations
- Include statistical data and expert opinions
- Discuss challenges and limitations
- Make it intellectually stimulating and thought-provoking

Output plain text with clear section headings. Make this content significantly more advanced and sophisticated than typical educational materials.`
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
        temperature: 0.9, // Higher temperature for more creative and varied responses
        max_tokens: 2000, // Increased token limit for more detailed content
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

// Generate multiple advanced perspectives on the same topic
export async function generateMultiplePerspectives(
  topic: string,
  ageGroup: string,
  proficiencyLevel: string,
  curriculum?: string
): Promise<Array<{ perspective: string; content: string }> | null> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  const proxy = import.meta.env.VITE_OPENAI_PROXY as string | undefined;
  const url = (proxy || 'https://api.openai.com') + '/v1/chat/completions';
  if (!apiKey && !proxy) return null;

  const perspectives = [
    'Scientific Research Perspective',
    'Historical Evolution Perspective',
    'Global Cultural Perspective',
    'Future Technology Perspective',
    'Environmental Impact Perspective',
    'Economic Analysis Perspective',
    'Social Psychology Perspective',
    'Philosophical Ethics Perspective'
  ];

  const results: Array<{ perspective: string; content: string }> = [];

  // Generate content from 3 random perspectives
  const selectedPerspectives = perspectives.sort(() => 0.5 - Math.random()).slice(0, 3);

  for (const perspective of selectedPerspectives) {
    try {
      const system = {
        role: 'system',
        content: `You are a world-renowned expert specializing in ${perspective.toLowerCase()}. You provide sophisticated, advanced analysis that goes far beyond basic information. Your content should be intellectually challenging, factually rich, and provide unique insights from your specialized perspective.`
      } as const;

      const user = {
        role: 'user',
        content: `Analyze "${topic}" from the ${perspective} for ${ageGroup} students at ${proficiencyLevel} level${curriculum ? ` following ${curriculum} curriculum` : ''}.

Provide ADVANCED analysis including:
- Sophisticated technical explanations
- Cutting-edge research and developments
- Controversial or debated aspects
- Multiple viewpoints and interpretations
- Statistical data and expert opinions
- Future implications and predictions
- Global and cultural variations
- Interdisciplinary connections

Structure in three sections:
INTRODUCTION: Sophisticated definition and advanced benefits
MIDDLE SECTION: Detailed analysis, research, and multiple viewpoints
CONCLUSION: Complex insights and future implications

Use advanced vocabulary and complex concepts while remaining accessible. Make this significantly more sophisticated than typical educational content.`
      } as const;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [system, user],
          temperature: 0.9,
          max_tokens: 1500,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content as string | undefined;
        if (text) {
          results.push({ perspective, content: text });
        }
      }
    } catch (error) {
      console.warn(`Failed to generate perspective: ${perspective}`, error);
    }
  }

  return results.length > 0 ? results : null;
}

// Generate highly detailed, comprehensive content with multiple paragraphs based on age and proficiency
export async function generateDetailedContent(
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

  // Define paragraph counts based on age and proficiency
  const getParagraphCount = () => {
    if (ageGroup === 'primary') {
      if (proficiencyLevel === 'beginner') return 3;
      if (proficiencyLevel === 'intermediate') return 6;
      if (proficiencyLevel === 'advanced') return 8;
    } else if (ageGroup === 'secondary') {
      if (proficiencyLevel === 'beginner') return 4;
      if (proficiencyLevel === 'intermediate') return 7;
      if (proficiencyLevel === 'advanced') return 9;
    } else if (ageGroup === 'higher-secondary') {
      if (proficiencyLevel === 'beginner') return 5;
      if (proficiencyLevel === 'intermediate') return 8;
      if (proficiencyLevel === 'advanced') return 10;
    }
    return 6; // default
  };

  const paragraphCount = getParagraphCount();

  const system = {
    role: 'system',
    content: `You are a master educator and content creator specializing in creating highly detailed, comprehensive educational content. You excel at producing rich, engaging content with multiple paragraphs that are perfectly tailored to specific age groups and proficiency levels. Your content should be factually accurate, educationally valuable, and engaging for students.`
  } as const;

  const user = {
    role: 'user',
    content: `Create HIGHLY DETAILED and COMPREHENSIVE content about "${title}" for ${ageGroup} students at ${proficiencyLevel} level${curriculum ? ` following ${curriculum} curriculum` : ''}.

IMPORTANT REQUIREMENTS:
- Generate EXACTLY ${paragraphCount} detailed paragraphs (not counting introduction and conclusion)
- Each paragraph should be 150-300 words
- Use age-appropriate vocabulary and complexity
- Include real facts, examples, and educational value
- Make content engaging and speech-ready
- Base content on the provided source material: ${baseContent.slice(0, 4000)}

CONTENT STRUCTURE:
1. INTRODUCTION (1 paragraph): Engaging hook and topic overview
2. MAIN CONTENT (${paragraphCount} paragraphs): Detailed exploration of the topic
3. CONCLUSION (1 paragraph): Summary and key takeaways

PARAGRAPH REQUIREMENTS:
- Primary + Beginner: Simple language, basic concepts, 3 paragraphs
- Primary + Intermediate: More detailed explanations, 6 paragraphs  
- Primary + Advanced: Complex concepts, 8 paragraphs
- Secondary + Beginner: Intermediate complexity, 4 paragraphs
- Secondary + Intermediate: Detailed analysis, 7 paragraphs
- Secondary + Advanced: Advanced concepts, 9 paragraphs
- Higher Secondary + Beginner: College-prep level, 5 paragraphs
- Higher Secondary + Intermediate: Advanced analysis, 8 paragraphs
- Higher Secondary + Advanced: University-level content, 10 paragraphs

EACH PARAGRAPH SHOULD INCLUDE:
- Clear topic sentence
- Supporting details and examples
- Educational facts and information
- Engaging language appropriate for the age group
- Smooth transitions between paragraphs

MAKE THE CONTENT:
- Highly detailed and comprehensive
- Educational and informative
- Engaging and speech-ready
- Age-appropriate in complexity
- Based on real facts and information
- Perfect for presentations and learning

Output the content with clear paragraph breaks. Make this significantly more detailed than typical educational content.`
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
        temperature: 0.7,
        max_tokens: 4000, // Much higher token limit for detailed content
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


