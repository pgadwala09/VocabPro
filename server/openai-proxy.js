// Enhanced OpenAI proxy for Whisper, TTS, and Chat completions
import express from 'express';
import multer from 'multer';
import FormData from 'form-data';

const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json({ limit: '10mb' }));
const upload = multer();

const API_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
const BASE = 'https://api.openai.com/v1';

console.log('OpenAI API Key available:', !!API_KEY);

// Health check
app.get('/health', (_req, res) => res.json({ 
  ok: true, 
  timestamp: new Date().toISOString(),
  endpoints: ['/api/openai/transcriptions', '/api/openai/tts', '/api/openai/chat']
}));

// Whisper transcription proxy with enhanced response
app.post('/api/openai/transcriptions', upload.any(), async (req, res) => {
  try {
    const auth = req.headers['authorization'] || (API_KEY ? `Bearer ${API_KEY}` : undefined);
    if (!auth) return res.status(401).json({ error: 'missing_api_key' });

    // Rebuild FormData request
    const form = new FormData();
    const filePart = (req.files && req.files.find(f => f.fieldname === 'file')) || req.files?.[0];
    if (filePart) {
      form.append('file', filePart.buffer, filePart.originalname || 'audio.wav');
    }
    
    // Add other form fields
    for (const [k, v] of Object.entries(req.body || {})) {
      form.append(k, v);
    }

    const response = await fetch(`${BASE}/audio/transcriptions`, {
      method: 'POST',
      headers: { 
        Authorization: auth,
        ...form.getHeaders()
      },
      body: form
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Transcription error:', errorText);
      return res.status(response.status).json({ error: 'transcription_failed', details: errorText });
    }

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Transcription proxy error:', error);
    res.status(500).json({ error: 'proxy_error', details: error.message });
  }
});

// OpenAI TTS proxy
app.post('/api/openai/tts', async (req, res) => {
  try {
    const auth = req.headers['authorization'] || (API_KEY ? `Bearer ${API_KEY}` : undefined);
    if (!auth) return res.status(401).json({ error: 'missing_api_key' });
    
    const { text, voice = 'alloy', model = 'tts-1', speed = 1.0 } = req.body || {};
    if (!text) return res.status(400).json({ error: 'missing_text' });

    const response = await fetch(`${BASE}/audio/speech`, {
      method: 'POST',
      headers: { 
        Authorization: auth, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ 
        model, 
        voice, 
        input: text, 
        response_format: 'mp3',
        speed 
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI TTS error:', errorText);
      return res.status(response.status).json({ error: 'tts_failed', details: errorText });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    response.body.pipe(res);
  } catch (error) {
    console.error('TTS proxy error:', error);
    res.status(500).json({ error: 'proxy_error', details: error.message });
  }
});

// OpenAI Chat completions proxy for pronunciation analysis
app.post('/api/openai/chat', async (req, res) => {
  try {
    const auth = req.headers['authorization'] || (API_KEY ? `Bearer ${API_KEY}` : undefined);
    if (!auth) return res.status(401).json({ error: 'missing_api_key' });

    const { messages, model = 'gpt-4o-mini', temperature = 0.7, max_tokens = 1000 } = req.body || {};
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages_required' });
    }

    const response = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: { 
        Authorization: auth, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Chat error:', errorText);
      return res.status(response.status).json({ error: 'chat_failed', details: errorText });
    }

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Chat proxy error:', error);
    res.status(500).json({ error: 'proxy_error', details: error.message });
  }
});

const port = process.env.PORT || 8788;
app.listen(port, () => {
  console.log(`Enhanced OpenAI proxy listening on :${port}`);
  console.log('Available endpoints:');
  console.log('  POST /api/openai/transcriptions - Whisper transcription');
  console.log('  POST /api/openai/tts - Text-to-speech');
  console.log('  POST /api/openai/chat - Chat completions');
  console.log('  GET /health - Health check');
});




