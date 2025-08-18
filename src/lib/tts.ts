export async function generateElevenLabsSpeech(text: string): Promise<{ url: string; blob: Blob } | null> {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY as string | undefined;
  const voiceId = (import.meta.env.VITE_ELEVENLABS_VOICE_ID as string | undefined) || '21m00Tcm4TlvDq8ikWAM';
  if (!apiKey) {
    return null;
  }

  const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'accept': 'audio/mpeg',
      'content-type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
      },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const arrayBuffer = await response.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
  const url = URL.createObjectURL(blob);
  return { url, blob };
}

export function speakWithBrowser(text: string) {
  if ('speechSynthesis' in window) {
    try { window.speechSynthesis.cancel(); } catch {}
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.lang = 'en-US';
    window.speechSynthesis.speak(utter);
  }
}

export function stopBrowserSpeech() {
  if ('speechSynthesis' in window) {
    try { window.speechSynthesis.cancel(); } catch {}
  }
}

export async function openAiTts(text: string): Promise<string | null> {
  const base = (import.meta.env.VITE_OPENAI_PROXY || 'http://127.0.0.1:8788');
  try {
    const r = await fetch(base + '/v1/audio/speech', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!r.ok) return null;
    const buf = await r.arrayBuffer();
    return URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }));
  } catch {
    return null;
  }
}


