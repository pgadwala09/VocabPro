export async function ttsProxy(text: string, voiceId?: string): Promise<string | null> {
  // Prefer local proxy; if unreachable, fall back to browser speech synthesis
  const endpoint = (import.meta.env.VITE_PROXY_BASE || 'http://127.0.0.1:8787') + '/elevenlabs/tts';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, voiceId }),
  });
  if (!res.ok) {
    try { console.error('TTS proxy error:', await res.text()); } catch {}
    return null;
  }
  const buf = await res.arrayBuffer();
  return URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }));
}

export async function s2sProxy(audio: Blob, voiceId?: string): Promise<string | null> {
  const endpoint = (import.meta.env.VITE_PROXY_BASE || 'http://localhost:8787') + '/elevenlabs/s2s';
  const form = new FormData();
  const filename = audio.type && audio.type.includes('wav') ? 'audio.wav' : 'audio.webm';
  form.append('file', audio, filename);
  if (voiceId) form.append('voiceId', voiceId);
  let res: Response;
  try {
    res = await fetch(endpoint, { method: 'POST', body: form });
  } catch (e) {
    console.error('S2S fetch failed (is proxy running?):', e);
    // Probe health endpoint to provide a clearer message in console
    try {
      const health = await fetch((import.meta.env.VITE_PROXY_BASE || 'http://localhost:8787') + '/elevenlabs/health').then(r => r.json());
      console.error('Proxy health:', health);
    } catch {}
    return null;
  }
  if (!res.ok) {
    try { console.error('S2S proxy error:', await res.text()); } catch {}
    return null;
  }
  const buf = await res.arrayBuffer();
  return URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }));
}







