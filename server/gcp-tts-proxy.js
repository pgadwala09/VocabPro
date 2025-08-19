// Google Cloud Text-to-Speech proxy
import 'dotenv/config';
import express from 'express';
import { GoogleAuth } from 'google-auth-library';

const app = express();
app.use(express.json({ limit: '2mb' }));

// CORS for local dev
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

function createGoogleAuth() {
  const scopes = ['https://www.googleapis.com/auth/cloud-platform'];
  const jsonCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (jsonCreds) {
    try {
      const credentials = JSON.parse(jsonCreds);
      return new GoogleAuth({ scopes, credentials });
    } catch {
      // fallthrough to default
    }
  }
  return new GoogleAuth({ scopes });
}

app.get('/gcp/health', async (_req, res) => {
  try {
    const auth = createGoogleAuth();
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    res.json({ ok: !!token && !!token.token });
  } catch (e) {
    res.json({ ok: false, error: e?.message || 'auth_failed' });
  }
});

app.post('/gcp/tts', async (req, res) => {
  try {
    const { text, voiceName = 'en-US-Standard-A', languageCode, speakingRate = 1.0 } = req.body || {};
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'missing_text' });
    }
    const lang = languageCode || (typeof voiceName === 'string' && voiceName.includes('-') ? voiceName.split('-').slice(0, 2).join('-') : 'en-US');

    const auth = createGoogleAuth();
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    if (!accessToken || !accessToken.token) {
      return res.status(401).json({ error: 'missing_access_token' });
    }

    const ttsEndpoint = 'https://texttospeech.googleapis.com/v1/text:synthesize';
    const body = {
      input: { text },
      voice: { languageCode: lang, name: voiceName },
      audioConfig: { audioEncoding: 'MP3', speakingRate },
    };

    const r = await fetch(ttsEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const errText = await r.text();
      return res.status(r.status).json({ error: 'gcp_tts_failed', details: errText });
    }

    const data = await r.json();
    const b64 = data?.audioContent;
    if (!b64) return res.status(502).json({ error: 'no_audio_content' });
    const buffer = Buffer.from(b64, 'base64');
    res.setHeader('content-type', 'audio/mpeg');
    res.send(buffer);
  } catch (e) {
    res.status(500).json({ error: 'proxy_error', message: e?.message || 'unknown' });
  }
});

const port = process.env.GCP_TTS_PORT || 8789;
app.listen(port, () => console.log(`GCP TTS proxy listening on :${port}`));


