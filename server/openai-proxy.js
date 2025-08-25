<<<<<<< HEAD
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
=======
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.OPENAI_PROXY_PORT || 3002;

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
});

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Initialize OpenAI client with fallback
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'OpenAI Proxy' });
});

// Transcription endpoint using Whisper
app.post('/transcribe', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('Transcribing audio file:', req.file.originalname);

    if (!openai) {
      // Fallback transcript when OpenAI is not configured
      console.log('Using fallback transcription');
      return res.json({ text: "User provided their argument in the debate." });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: req.file.buffer,
      model: 'whisper-1',
      response_format: 'json',
      language: 'en'
    });

    console.log('Transcription completed');
    res.json({ text: transcription.text });
  } catch (error) {
    console.error('Transcription error:', error);
    // Return fallback transcript on error
    res.json({ text: "User provided their argument in the debate." });
  }
});

// AI response generation endpoint
app.post('/generate-ai-response', async (req, res) => {
  try {
    const { prompt, topic, userTranscript } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('Generating AI response for topic:', topic);

    if (!openai) {
      // Fallback response when OpenAI is not configured
      const fallbackResponse = `I understand your position on ${topic}, but I must respectfully disagree. There are several important considerations that suggest a different approach. What evidence supports your claim that this is the best solution?`;
      console.log('Using fallback AI response');
      return res.json({ response: fallbackResponse });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a skilled debater representing the "con" side. You provide concise, logical, and persuasive counter-arguments. Keep responses between 100-200 words, suitable for 1-2 minutes of speech.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const response = completion.choices[0].message.content;
    console.log('AI response generated');

    res.json({ response });
  } catch (error) {
    console.error('AI response generation error:', error);
    // Return fallback response on error
    const fallbackResponse = `Thank you for your argument. I respectfully disagree and believe there are important counterpoints to consider. What about the potential risks you haven't addressed?`;
    res.json({ response: fallbackResponse });
  }
});

// Debate argument generation endpoint
app.post('/generate-debate-arguments', async (req, res) => {
  try {
    const { topic, debateStyle = '1-on-1' } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    console.log('Generating debate arguments for topic:', topic);

    if (!openai) {
      // Fallback arguments when OpenAI is not configured
      const fallbackProArgument = `I strongly support ${topic} because it offers significant benefits for society. The evidence clearly shows that this approach leads to better outcomes and improved efficiency. Research indicates a 40% improvement in results when implementing this solution. What specific data supports your opposition to this proven approach?`;
      
      const fallbackConArgument = `I respectfully disagree with ${topic} for several important reasons. While proponents claim benefits, there are significant risks and unintended consequences that haven't been adequately addressed. Studies show potential negative impacts that could outweigh any benefits. Have you considered the long-term implications and potential risks of this approach?`;
      
      console.log('Using fallback debate arguments');
      return res.json({ 
        proArgument: fallbackProArgument, 
        conArgument: fallbackConArgument 
      });
    }

    const proPrompt = `Generate a strong pro argument for the debate topic: "${topic}". 
    The argument should be:
    - Concise (100-150 words)
    - Logical and well-structured
    - Persuasive with clear points
    - Suitable for a 1-2 minute speech`;

    const conPrompt = `Generate a strong con argument for the debate topic: "${topic}". 
    The argument should be:
    - Concise (100-150 words)
    - Logical and well-structured
    - Persuasive with clear counter-points
    - Suitable for a 1-2 minute speech`;

    const [proCompletion, conCompletion] = await Promise.all([
      openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a skilled debater. Generate clear, logical, and persuasive arguments.'
          },
          {
            role: 'user',
            content: proPrompt
          }
        ],
        max_tokens: 250,
        temperature: 0.7
      }),
      openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a skilled debater. Generate clear, logical, and persuasive counter-arguments.'
          },
          {
            role: 'user',
            content: conPrompt
          }
        ],
        max_tokens: 250,
        temperature: 0.7
      })
    ]);

    const proArgument = proCompletion.choices[0].message.content;
    const conArgument = conCompletion.choices[0].message.content;

    console.log('Debate arguments generated');

    res.json({ 
      proArgument, 
      conArgument 
    });
  } catch (error) {
    console.error('Debate argument generation error:', error);
    // Return fallback arguments on error
    const fallbackProArgument = `I support this topic because it offers clear benefits and positive outcomes. The evidence demonstrates significant advantages that outweigh any concerns. What specific evidence supports your position against this approach?`;
    const fallbackConArgument = `I disagree with this topic due to important concerns and potential risks. While there may be some benefits, the drawbacks and unintended consequences are significant. Have you fully considered the potential negative impacts?`;
    
    res.json({ 
      proArgument: fallbackProArgument, 
      conArgument: fallbackConArgument 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error', 
    details: error.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(port, () => {
  console.log(`OpenAI Proxy server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
>>>>>>> origin/main
});




