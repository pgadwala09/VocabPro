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

// Google AI Studio TTS (uses enhanced browser speech synthesis with AI guidance)
export async function googleAITts(text: string): Promise<string | null> {
  try {
    // Check if Google AI Studio API key is available
    if (!import.meta.env.VITE_GOOGLE_AI_STUDIO_API_KEY) {
      console.warn('Google AI Studio API key not configured, using browser speech synthesis');
    }
    
    // Import the Google AI function
    const { googleAITTS } = await import('./googleAI');
    
    // Use the enhanced Google AI TTS function
    const result = await googleAITTS(text);
    if (result) {
      console.log('✅ Google AI Studio TTS successful');
      return result;
    }
    
    // Fallback to enhanced browser speech synthesis with David voice preference
    return await speakWithBrowserEnhanced(text);
  } catch (error) {
    console.error('Google AI TTS error:', error);
    return await speakWithBrowserEnhanced(text);
  }
}

// Enhanced browser speech synthesis with David voice preference
async function speakWithBrowserEnhanced(text: string): Promise<string | null> {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported');
    return null;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any current speech
    
    // Get voices with proper loading
    const getVoices = (): Promise<SpeechSynthesisVoice[]> => {
      return new Promise((resolve) => {
        let voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          resolve(voices);
          return;
        }
        
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
          resolve(voices);
        };
        
        window.speechSynthesis.getVoices();
      });
    };
    
    const voices = await getVoices();
    console.log('🎤 Browser voices available:', voices.map(v => v.name));
    
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1.1;
    utterance.lang = 'en-US';
    utterance.volume = 1.0;
    
    // Find Microsoft David voice specifically
    let selectedVoice = null;
    
    // First priority: Microsoft David (exact match)
    selectedVoice = voices.find(voice => 
      voice.name.toLowerCase() === 'microsoft david' ||
      voice.name.toLowerCase() === 'david' ||
      voice.name.toLowerCase() === 'ms david'
    );
    
    // Second priority: Microsoft David (partial match)
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('microsoft david') ||
        voice.name.toLowerCase().includes('david') ||
        voice.name.toLowerCase().includes('ms david')
      );
    }
    
    // Third priority: Any Microsoft voice
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('microsoft') ||
        voice.name.toLowerCase().includes('windows') ||
        voice.name.toLowerCase().includes('sapi')
      );
    }
    
    // Fourth priority: US English voices
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => 
        voice.lang.startsWith('en-US') && voice.name.toLowerCase().includes('english')
      );
    }
    
    // Fifth priority: Any US English voice
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => voice.lang.startsWith('en-US'));
    }
    
    // Sixth priority: Any English voice
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log('🎤 Browser using voice:', selectedVoice.name, 'Language:', selectedVoice.lang);
    } else {
      console.log('🎤 No preferred voice found, using default');
    }
    
    utterance.onstart = () => console.log('🎤 Browser speech started');
    utterance.onend = () => console.log('🎤 Browser speech ended');
    utterance.onerror = (e) => console.error('🎤 Browser speech error:', e);
    
    window.speechSynthesis.speak(utterance);
    return 'browser-speech-enhanced';
  } catch (error) {
    console.error('Enhanced browser speech synthesis error:', error);
    return null;
  }
}

export async function googleCloudTts(
  text: string,
  opts?: { base?: string; voiceName?: string; languageCode?: string; speakingRate?: number }
): Promise<string | null> {
  const base = opts?.base || (import.meta.env.VITE_GCP_TTS_PROXY || 'http://127.0.0.1:8789');
  try {
    const r = await fetch(base + '/gcp/tts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text,
        voiceName: opts?.voiceName || (import.meta.env.VITE_GCP_VOICE_NAME || 'en-US-Standard-F'),
        languageCode: opts?.languageCode,
        speakingRate: opts?.speakingRate || 1.0,
      })
    });
    if (!r.ok) return null;
    const buf = await r.arrayBuffer();
    return URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }));
  } catch {
    return null;
  }
}


