// Simple ElevenLabs proxy (dev-use). Do NOT expose without auth in production.
import 'dotenv/config';
import express from 'express';
import multer from 'multer';

// Node 18+ has global fetch; no import needed

const app = express();
app.use(express.json({ limit: '100mb' }));

// Minimal CORS so the Vite dev server can call this proxy
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, xi-api-key');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const upload = multer();

const API_KEY = process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY;
const BASE = 'https://api.elevenlabs.io/v1';
const AGENT_PRO_ID = process.env.ELEVENLABS_AGENT_PRO_ID || '';
const AGENT_CON_ID = process.env.ELEVENLABS_AGENT_CON_ID || '';
// Persist lightweight conversation ids in-memory per session key
const SESSION_CONVERSATIONS = new Map();

app.post('/elevenlabs/tts', async (req, res) => {
  try {
    const { text, voiceId = '21m00Tcm4TlvDq8ikWAM', model_id = 'eleven_turbo_v2' } = req.body || {};
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'missing_text' });
    }
    const r = await fetch(`${BASE}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { accept: 'audio/mpeg', 'content-type': 'application/json', 'xi-api-key': API_KEY },
      body: JSON.stringify({ text, model_id })
    });
    if (!r.ok) {
      const body = await r.text();
      return res.status(r.status).send(body || 'tts_error');
    }
    res.setHeader('content-type', 'audio/mpeg');
<<<<<<< HEAD
    r.body.pipe(res);
=======
    const buffer = await r.arrayBuffer();
    res.send(Buffer.from(buffer));
>>>>>>> origin/main
  } catch (e) {
    res.status(500).json({ error: 'proxy_error', message: e?.message || 'unknown' });
  }
});

// Health check – verifies proxy is up and API key is valid
app.get('/elevenlabs/health', async (req, res) => {
  try {
    const r = await fetch(`${BASE}/user`, {
      headers: { 'xi-api-key': API_KEY }
    });
    if (!r.ok) {
      const msg = await r.text();
      return res.status(200).json({ ok: false, status: r.status, message: msg || 'invalid_key_or_plan' });
    }
    const info = await r.json().catch(() => ({}));
    res.json({ ok: true, info });
  } catch (e) {
    res.status(200).json({ ok: false, message: 'proxy_offline_or_network' });
  }
});

// Conversational AI Agent single-turn endpoint
// Body: { side: 'pro' | 'con', text: string }
app.post('/elevenlabs/agent-turn', async (req, res) => {
  try {
    if (!API_KEY) return res.status(401).json({ error: 'missing_api_key' });
    const { side, text, session, topic } = req.body || {};
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'missing_text' });
    const agentId = side === 'con' ? AGENT_CON_ID : AGENT_PRO_ID;
    if (!agentId) return res.status(400).json({ error: 'missing_agent_id' });

    // 1) Ensure conversation (reuse by session key if provided)
    let convId = session ? SESSION_CONVERSATIONS.get(session) : null;
    if (!convId) {
      const convResp = await fetch(`${BASE}/convai/conversations`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'xi-api-key': API_KEY },
        body: JSON.stringify({ agent_id: agentId })
      });
      if (!convResp.ok) {
        const err = await convResp.text();
        return res.status(convResp.status).json({ error: 'conv_create_failed', details: err });
      }
      const conv = await convResp.json().catch(() => ({}));
      convId = conv.conversation_id || conv.id;
      if (!convId) return res.status(502).json({ error: 'no_conversation_id' });
      if (session) SESSION_CONVERSATIONS.set(session, convId);
      // Prime the conversation with topic and role to keep the agent on-topic
      const primer = `You are the ${side === 'con' ? 'CON' : 'PRO'} debater. Stay strictly on the topic: "${topic || 'the debate topic'}". Keep responses 2-4 concise sentences, persuasive, and on-topic. Do not change topics.`;
      await fetch(`${BASE}/convai/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'xi-api-key': API_KEY },
        body: JSON.stringify({ role: 'user', text: primer })
      }).catch(()=>{});
    }

    // 2) Send user message
    const msgResp = await fetch(`${BASE}/convai/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'xi-api-key': API_KEY },
      body: JSON.stringify({ role: 'user', text })
    });
    if (!msgResp.ok) {
      const err = await msgResp.text();
      return res.status(msgResp.status).json({ error: 'send_msg_failed', details: err });
    }

    // 3) Fetch audio response
    const audioResp = await fetch(`${BASE}/convai/conversations/${convId}/response/audio?output_format=mp3_44100_128`, {
      method: 'GET',
      headers: { accept: 'audio/mpeg', 'xi-api-key': API_KEY }
    });
    if (!audioResp.ok) {
      const err = await audioResp.text();
      return res.status(audioResp.status).json({ error: 'agent_audio_failed', details: err });
    }

    res.setHeader('content-type', 'audio/mpeg');
<<<<<<< HEAD
    audioResp.body.pipe(res);
=======
    const buffer = await audioResp.arrayBuffer();
    res.send(Buffer.from(buffer));
>>>>>>> origin/main
  } catch (e) {
    res.status(500).json({ error: 'proxy_error', message: e?.message || 'unknown' });
  }
});

app.post('/elevenlabs/s2s', upload.single('file'), async (req, res) => {
  try {
    const voiceId = req.body.voiceId || '21m00Tcm4TlvDq8ikWAM';
    const endpoint = `${BASE}/speech-to-speech/${voiceId}?output_format=mp3_44100_128&model_id=eleven_english_sts_v2`;
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'missing_audio' });
    }
    // Send multipart/form-data with field name 'audio'
    const form = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype || 'audio/wav' });
    form.append('audio', blob, 'input.wav');
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'xi-api-key': API_KEY, 'accept': 'audio/mpeg' },
      body: form
    });
    if (!r.ok) {
      const errText = await r.text();
      return res.status(r.status).send(errText);
    }
    res.setHeader('content-type', 'audio/mpeg');
<<<<<<< HEAD
    r.body.pipe(res);
=======
    const buffer = await r.arrayBuffer();
    res.send(Buffer.from(buffer));
>>>>>>> origin/main
  } catch (e) { res.status(500).json({ error: 'proxy_error' }); }
});

// Concatenate multiple MP3 parts (base64-encoded) into a single MP3
// Body: { parts: string[] } where each string is base64 of an mp3 buffer with matching codec/bitrate
app.post('/debate/concat', async (req, res) => {
  try {
    const parts = Array.isArray(req.body?.parts) ? req.body.parts : [];
    if (parts.length === 0) return res.status(400).json({ error: 'no_parts' });
    const buffers = parts.map((b64) => Buffer.from(b64, 'base64'));
    const combined = Buffer.concat(buffers);
    res.setHeader('content-type', 'audio/mpeg');
    res.send(combined);
  } catch (e) {
    res.status(500).json({ error: 'concat_failed', message: e?.message || 'unknown' });
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => console.log(`ElevenLabs proxy listening on :${port}`));






