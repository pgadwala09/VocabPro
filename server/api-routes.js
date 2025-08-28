import express from 'express';
import cors from 'cors';
import multer from 'multer';
import OpenAI from 'openai';
import fetch from 'node-fetch';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import turnEngine from './turn-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory (where .env is located)
dotenv.config({ path: '../.env' });
console.log('🔍 Environment variables loaded:');
console.log('  - LINDY_AI_WEBHOOK_URL:', process.env.LINDY_AI_WEBHOOK_URL);
console.log('  - N8N_WEBHOOK_URL:', process.env.N8N_WEBHOOK_URL);
console.log('  - VITE_SERPAPI_KEY:', process.env.VITE_SERPAPI_KEY ? 'Set' : 'Not set');
console.log('  - VITE_FIRECRAWL_API_KEY:', process.env.VITE_FIRECRAWL_API_KEY ? 'Set' : 'Not set');

const app = express();
const port = process.env.API_PORT || 3003;

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
});

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:5175', 'http://localhost:5176'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Initialize OpenAI client with fallback
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'API Routes',
    services: {
      transcription: !!process.env.OPENAI_API_KEY,
      aiResponse: !!process.env.OPENAI_API_KEY,
      tts: !!process.env.ELEVENLABS_API_KEY,
      supabase: !!process.env.SUPABASE_URL,
      googleAI: !!process.env.VITE_GOOGLE_AI_STUDIO_API_KEY
    }
  });
});

// ElevenLabs voices endpoint
app.get('/api/elevenlabs/voices', async (req, res) => {
  try {
    const API_KEY = process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY;
    if (!API_KEY) {
      return res.status(401).json({ error: 'missing_api_key' });
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': API_KEY }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'failed_to_fetch_voices' });
    }

    const data = await response.json();
    res.json({ voices: data.voices || [] });
  } catch (error) {
    console.error('ElevenLabs voices error:', error);
    res.status(500).json({ error: 'proxy_error', message: error.message });
  }
});

// ElevenLabs TTS endpoint
app.post('/api/elevenlabs/tts', async (req, res) => {
  try {
    const API_KEY = process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY;
    if (!API_KEY) {
      return res.status(401).json({ error: 'missing_api_key' });
    }

    const { text, voiceId = '21m00Tcm4TlvDq8ikWAM', model_id = 'eleven_turbo_v2' } = req.body || {};
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'missing_text' });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 
        accept: 'audio/mpeg', 
        'content-type': 'application/json', 
        'xi-api-key': API_KEY 
      },
      body: JSON.stringify({ text, model_id })
    });

    if (!response.ok) {
      const body = await response.text();
      return res.status(response.status).send(body || 'tts_error');
    }

    res.setHeader('content-type', 'audio/mpeg');
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    res.status(500).json({ error: 'proxy_error', message: error.message });
  }
});

// ElevenLabs health check endpoint
app.get('/api/elevenlabs/health', async (req, res) => {
  try {
    const API_KEY = process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY;
    if (!API_KEY) {
      return res.status(200).json({ ok: false, message: 'missing_api_key' });
    }

    const response = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: { 'xi-api-key': API_KEY }
    });

    if (!response.ok) {
      const msg = await response.text();
      return res.status(200).json({ ok: false, status: response.status, message: msg || 'invalid_key_or_plan' });
    }

    const info = await response.json().catch(() => ({}));
    res.json({ ok: true, info });
  } catch (error) {
    console.error('ElevenLabs health check error:', error);
    res.status(200).json({ ok: false, message: 'proxy_offline_or_network' });
  }
});

// Human audio upload endpoint
app.post('/api/human-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { debateId, turnNumber, speaker } = req.body;
    console.log('Human audio upload:', {
      debateId,
      turnNumber,
      speaker,
      fileName: req.file.originalname,
      fileSize: req.file.size
    });

    // For now, we'll return a local URL since we don't have Supabase configured
    // In production, this would upload to Supabase Storage
    const audioUrl = `data:audio/webm;base64,${req.file.buffer.toString('base64')}`;
    
    console.log('Human audio upload completed');
    res.json({ 
      audioUrl,
      message: 'Audio uploaded successfully',
      fileSize: req.file.size
    });
  } catch (error) {
    console.error('Human upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed', 
      details: error.message 
    });
  }
});

// Transcription endpoint using OpenAI Whisper
app.post('/api/transcribe', upload.single('file'), async (req, res) => {
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
app.post('/api/generate-ai-response', async (req, res) => {
  try {
    const { systemPrompt, userPrompt, topic, userTranscript } = req.body;

    if (!systemPrompt || !userPrompt) {
      return res.status(400).json({ error: 'System prompt and user prompt are required' });
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
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      max_tokens: 200,
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
app.post('/api/generate-debate-arguments', async (req, res) => {
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

    const proSystemPrompt = `You are PRO on the topic: "${topic}".
Goal: Defend the proposition clearly. Stay within 150 words.
Debate constraints:
- Do not speak unless it's your turn.
- Be concise and targeted at the opponent's last point.
- End with one actionable insight or data point.`;

    const conSystemPrompt = `You are CON on the topic: "${topic}".
Goal: Refute the proposition clearly. Stay within 150 words.
Debate constraints:
- Do not speak unless it's your turn.
- Be concise and targeted at the opponent's last point.
- End with one probing question or caveat.`;

    const userPrompt = `Generate an initial argument for this debate topic.`;

    const [proCompletion, conCompletion] = await Promise.all([
      openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: proSystemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      }),
      openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: conSystemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 200,
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

// Text-to-Speech endpoint using ElevenLabs
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = '21m00Tcm4TlvDq8ikWAM' } = req.body; // Default voice ID

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    console.log('Generating TTS for text:', text.substring(0, 50) + '...');

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${errorText}`);
    }

    const audioBuffer = await response.buffer();
    console.log('TTS generation completed');

    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(audioBuffer);
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ 
      error: 'TTS generation failed', 
      details: error.message 
    });
  }
});

// Get available ElevenLabs voices
app.get('/api/voices', async (req, res) => {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch voices');
    }

    const voices = await response.json();
    res.json(voices);
  } catch (error) {
    console.error('Error fetching voices:', error);
    res.status(500).json({ 
      error: 'Failed to fetch voices', 
      details: error.message 
    });
  }
});

// =====================================================
// TURN ENGINE ENDPOINTS
// =====================================================

// Initialize a new debate
app.post('/api/debate/initialize', async (req, res) => {
  try {
    const { debateId, config = {} } = req.body;

    if (!debateId) {
      return res.status(400).json({ error: 'Debate ID is required' });
    }

    // Check if debate already exists
    const existingDebate = turnEngine.getDebateState(debateId);
    if (existingDebate) {
      return res.json({ 
        message: 'Debate already exists',
        debate: existingDebate 
      });
    }

    // Initialize new debate
    const result = await turnEngine.initializeDebate(debateId, config);
    
    // Clean the response to avoid circular references
    const cleanResult = {
      success: result.success,
      turn: result.turn ? {
        id: result.turn.id,
        debate_id: result.turn.debate_id,
        turn_number: result.turn.turn_number,
        speaker: result.turn.speaker,
        state: result.turn.state,
        started_at: result.turn.started_at,
        ends_at: result.turn.ends_at,
        created_at: result.turn.created_at
      } : null
    };
    
    res.json({ 
      message: 'Debate initialized successfully',
      ...cleanResult
    });
  } catch (error) {
    console.error('Error initializing debate:', error);
    res.status(500).json({ 
      error: 'Failed to initialize debate', 
      details: error.message 
    });
  }
});

// Get debate state
app.get('/api/debate/:debateId/state', async (req, res) => {
  try {
    const { debateId } = req.params;
    const debate = turnEngine.getDebateState(debateId);
    
    if (!debate) {
      return res.status(404).json({ error: 'Debate not found' });
    }

    res.json({ debate });
  } catch (error) {
    console.error('Error getting debate state:', error);
    res.status(500).json({ 
      error: 'Failed to get debate state', 
      details: error.message 
    });
  }
});

// Get debate statistics
app.get('/api/debate/:debateId/stats', async (req, res) => {
  try {
    const { debateId } = req.params;
    const stats = turnEngine.getDebateStats(debateId);
    
    if (!stats) {
      return res.status(404).json({ error: 'Debate not found' });
    }

    res.json({ stats });
  } catch (error) {
    console.error('Error getting debate stats:', error);
    res.status(500).json({ 
      error: 'Failed to get debate stats', 
      details: error.message 
    });
  }
});

// Start speaking (user or AI)
app.post('/api/debate/:debateId/start-speaking', async (req, res) => {
  try {
    const { debateId } = req.params;
    const { speaker } = req.body;

    const success = turnEngine.startSpeaking(debateId);
    
    if (!success) {
      return res.status(400).json({ 
        error: 'Cannot start speaking at this time',
        reason: 'Not user\'s turn or debate not in waiting state'
      });
    }

    const debateState = turnEngine.getDebateState(debateId);
    res.json({ 
      message: 'Speaking started successfully',
      debate: debateState ? {
        id: debateState.id,
        topic: debateState.topic,
        status: debateState.status,
        currentTurn: debateState.currentTurn ? {
          id: debateState.currentTurn.id,
          speaker: debateState.currentTurn.speaker,
          state: debateState.currentTurn.state,
          ends_at: debateState.currentTurn.ends_at
        } : null
      } : null
    });
  } catch (error) {
    console.error('Error starting speaking:', error);
    res.status(500).json({ 
      error: 'Failed to start speaking', 
      details: error.message 
    });
  }
});

// Complete turn
app.post('/api/debate/:debateId/complete-turn', async (req, res) => {
  try {
    const { debateId } = req.params;
    const turnData = req.body;

    const success = turnEngine.completeTurn(debateId, turnData);
    
    if (!success) {
      return res.status(400).json({ 
        error: 'Cannot complete turn at this time',
        reason: 'Not currently speaking or debate not active'
      });
    }

    const debateState = turnEngine.getDebateState(debateId);
    res.json({ 
      message: 'Turn completed successfully',
      debate: debateState ? {
        id: debateState.id,
        topic: debateState.topic,
        status: debateState.status,
        currentTurn: debateState.currentTurn ? {
          id: debateState.currentTurn.id,
          speaker: debateState.currentTurn.speaker,
          state: debateState.currentTurn.state,
          ends_at: debateState.currentTurn.ends_at
        } : null
      } : null
    });
  } catch (error) {
    console.error('Error completing turn:', error);
    res.status(500).json({ 
      error: 'Failed to complete turn', 
      details: error.message 
    });
  }
});

// Check if user can speak
app.get('/api/debate/:debateId/can-speak/:userId', async (req, res) => {
  try {
    const { debateId, userId } = req.params;
    const canSpeak = turnEngine.canUserSpeak(debateId, userId);
    const debateState = turnEngine.getDebateState(debateId);
    
    res.json({ 
      canSpeak,
      timeRemaining: turnEngine.getTimeRemaining(debateId),
      debate: debateState ? {
        id: debateState.id,
        topic: debateState.topic,
        status: debateState.status,
        currentTurn: debateState.currentTurn ? {
          id: debateState.currentTurn.id,
          speaker: debateState.currentTurn.speaker,
          state: debateState.currentTurn.state,
          ends_at: debateState.currentTurn.ends_at
        } : null
      } : null
    });
  } catch (error) {
    console.error('Error checking speaking permission:', error);
    res.status(500).json({ 
      error: 'Failed to check speaking permission', 
      details: error.message 
    });
  }
});

// Check if AI can speak
app.get('/api/debate/:debateId/ai-can-speak', async (req, res) => {
  try {
    const { debateId } = req.params;
    const canSpeak = turnEngine.canAISpeak(debateId);
    const debateState = turnEngine.getDebateState(debateId);
    
    res.json({ 
      canSpeak,
      timeRemaining: turnEngine.getTimeRemaining(debateId),
      debate: debateState ? {
        id: debateState.id,
        topic: debateState.topic,
        status: debateState.status,
        currentTurn: debateState.currentTurn ? {
          id: debateState.currentTurn.id,
          speaker: debateState.currentTurn.speaker,
          state: debateState.currentTurn.state,
          ends_at: debateState.currentTurn.ends_at
        } : null
      } : null
    });
  } catch (error) {
    console.error('Error checking AI speaking permission:', error);
    res.status(500).json({ 
      error: 'Failed to check AI speaking permission', 
      details: error.message 
    });
  }
});

// Pause debate
app.post('/api/debate/:debateId/pause', async (req, res) => {
  try {
    const { debateId } = req.params;
    const success = turnEngine.pauseDebate(debateId);
    
    if (!success) {
      return res.status(400).json({ error: 'Failed to pause debate' });
    }

    res.json({ message: 'Debate paused successfully' });
  } catch (error) {
    console.error('Error pausing debate:', error);
    res.status(500).json({ 
      error: 'Failed to pause debate', 
      details: error.message 
    });
  }
});

// Resume debate
app.post('/api/debate/:debateId/resume', async (req, res) => {
  try {
    const { debateId } = req.params;
    const success = turnEngine.resumeDebate(debateId);
    
    if (!success) {
      return res.status(400).json({ error: 'Failed to resume debate' });
    }

    res.json({ message: 'Debate resumed successfully' });
  } catch (error) {
    console.error('Error resuming debate:', error);
    res.status(500).json({ 
      error: 'Failed to resume debate', 
      details: error.message 
    });
  }
});

// Force end debate
app.post('/api/debate/:debateId/end', async (req, res) => {
  try {
    const { debateId } = req.params;
    const success = turnEngine.forceEndDebate(debateId);
    
    if (!success) {
      return res.status(400).json({ error: 'Failed to end debate' });
    }

    res.json({ message: 'Debate ended successfully' });
  } catch (error) {
    console.error('Error ending debate:', error);
    res.status(500).json({ 
      error: 'Failed to end debate', 
      details: error.message 
    });
  }
});

// Get all active debates
app.get('/api/debates/active', async (req, res) => {
  try {
    const activeDebates = turnEngine.getActiveDebates();
    res.json({ debates: activeDebates });
  } catch (error) {
    console.error('Error getting active debates:', error);
    res.status(500).json({ 
      error: 'Failed to get active debates', 
      details: error.message 
    });
  }
});

// =====================================================
// ORCHESTRATION ENDPOINTS
// =====================================================

// Start speaking turn
app.post('/api/debate/:id/start-speaking', async (req, res) => {
  try {
    const { id } = req.params;
    const { speaker, duration } = req.body;
    
    const currentTurn = await turnEngine.getCurrentTurn(id);
    if (!currentTurn || currentTurn.speaker !== speaker) {
      return res.status(400).json({ error: 'Not your turn to speak' });
    }

    const result = await turnEngine.startSpeakingTurn(currentTurn.id, duration || 60);
    res.json({ message: 'Speaking turn started', endsAt: result.endsAt });
  } catch (error) {
    console.error('Error starting speaking turn:', error);
    res.status(500).json({ error: 'Failed to start speaking turn' });
  }
});

// Complete turn and advance
app.post('/api/debate/:id/complete-turn', async (req, res) => {
  try {
    const { id } = req.params;
    const { turnData } = req.body;
    
    const currentTurn = await turnEngine.getCurrentTurn(id);
    if (!currentTurn) {
      return res.status(400).json({ error: 'No active turn found' });
    }

    // Complete current turn
    await turnEngine.completeTurn(currentTurn.id, turnData);
    
    // Advance to next turn
    const advanceResult = await turnEngine.advanceTurn(id, currentTurn.id);
    
    res.json({ 
      message: 'Turn completed and advanced',
      nextTurn: advanceResult.nextTurn
    });
  } catch (error) {
    console.error('Error completing turn:', error);
    res.status(500).json({ error: 'Failed to complete turn' });
  }
});

// Check if user can speak
app.get('/api/debate/:id/can-speak/:userId', async (req, res) => {
  try {
    const { id, userId } = req.params;
    const canSpeak = await turnEngine.canUserSpeak(id, userId);
    res.json({ canSpeak });
  } catch (error) {
    console.error('Error checking speaking permission:', error);
    res.status(500).json({ error: 'Failed to check speaking permission' });
  }
});

// Check if AI can speak
app.get('/api/debate/:id/ai-can-speak', async (req, res) => {
  try {
    const { id } = req.params;
    const canSpeak = await turnEngine.canAISpeak(id);
    res.json({ canSpeak });
  } catch (error) {
    console.error('Error checking AI speaking permission:', error);
    res.status(500).json({ error: 'Failed to check AI speaking permission' });
  }
});

// Trigger AI to speak
app.post('/api/debate/:id/ai-speak', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await turnEngine.triggerAISpeak(id);
    
    if (result.success) {
      res.json({ 
        message: 'AI speaking triggered',
        turn: result.turn
      });
    } else {
      res.status(400).json({ error: 'Cannot trigger AI speak' });
    }
  } catch (error) {
    console.error('Error triggering AI speak:', error);
    res.status(500).json({ error: 'Failed to trigger AI speak' });
  }
});

// Manual sweep endpoint for testing
app.post('/api/debate/:id/sweep', async (req, res) => {
  try {
    const { id } = req.params;
    await turnEngine.sweepOverdueTurns();
    res.json({ message: 'Sweep completed' });
  } catch (error) {
    console.error('Error during sweep:', error);
    res.status(500).json({ error: 'Sweep failed' });
  }
});

// N8N Webhook Integration for Content Creation
app.post('/api/create-content', async (req, res) => {
  try {
    const { title, age_group, proficiency } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    console.log('🚀 N8N Webhook: Creating content for:', { title, age_group, proficiency });

    // Get Lindy.ai agent webhook URL from environment variables
    console.log('🔍 Environment check - LINDY_AI_WEBHOOK_URL:', process.env.LINDY_AI_WEBHOOK_URL);
    const lindyWebhookUrl = process.env.LINDY_AI_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL || 'https://your-lindy-agent.com/webhook';
    
    // Prepare payload for Lindy.ai agent
    const lindyPayload = {
      summary: title,
      age: age_group === 'primary' ? 9 : age_group === 'secondary' ? 12 : 16,
      proficiency: proficiency || 'intermediate',
      timestamp: new Date().toISOString(),
      source: 'vocabpro-api',
      request_type: 'content_generation',
      metadata: {
        age_group: age_group || 'general',
        topic: title,
        learning_objectives: ['vocabulary', 'comprehension', 'interactive_activities']
      }
    };

    console.log('📤 Sending to Lindy.ai agent:', lindyWebhookUrl);
    console.log('📦 Payload:', lindyPayload);

    // Send request to Lindy.ai agent
    const response = await axios.post(lindyWebhookUrl, lindyPayload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'VocabPro-API/1.0'
      },
      timeout: 30000 // 30 second timeout
    });

    console.log('✅ N8N webhook response received:', response.status);
    
    // Return the structured content from n8n
    const structuredContent = response.data;
    
    // Optionally save to Supabase here if not done in n8n
    // This would be a good place to add database persistence
    
    res.json({
      success: true,
      message: 'Content created successfully via N8N automation',
      data: structuredContent,
      source: 'n8n-webhook'
    });

  } catch (error) {
    console.error('❌ N8N webhook error:', error);
    
    // Provide fallback response if n8n is not available
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.log('⚠️ N8N not available, providing fallback response');
      return res.json({
        success: false,
        message: 'N8N automation service not available',
        fallback: true,
        data: {
          title: req.body.title,
          content: `This is a fallback response for "${req.body.title}". The N8N automation service is currently unavailable. Please try again later or contact support.`,
          sections: {
            introduction: `Introduction to ${req.body.title}`,
            main_content: `Main content about ${req.body.title}`,
            conclusion: `Conclusion about ${req.body.title}`
          }
        }
      });
    }
    
    res.status(500).json({ 
      error: 'Content creation failed', 
      details: error.message,
      fallback: false
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

// API Proxy endpoints to avoid CORS issues
app.post('/api/proxy/serpapi', async (req, res) => {
  try {
    const { q, location, num, gl, hl } = req.body;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const apiKey = process.env.VITE_SERPAPI_KEY || process.env.SERPAPI_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'SerpAPI key not configured' });
    }

    const query = new URLSearchParams({
      engine: 'google',
      api_key: apiKey,
      q: q,
      ...(location ? { location } : {}),
      ...(gl ? { gl } : {}),
      ...(hl ? { hl } : {}),
      ...(num ? { num: String(num) } : {}),
    });

    const url = `https://serpapi.com/search.json?${query.toString()}`;
    console.log('🔍 SerpAPI proxy request:', url.replace(apiKey, '***HIDDEN***'));

    const response = await axios.get(url);
    const data = response.data;
    
    const organic = data.organic_results || [];
    const results = organic.map((r, idx) => ({
      position: r.position ?? idx + 1,
      title: r.title,
      link: r.link,
      snippet: r.snippet,
      source: r.source,
    }));

    res.json({ results, total: organic.length });
  } catch (error) {
    console.error('SerpAPI proxy error:', error.message);
    res.status(500).json({ error: 'SerpAPI request failed', details: error.message });
  }
});

app.post('/api/proxy/firecrawl', async (req, res) => {
  try {
    const { q, limit } = req.body;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const apiKey = process.env.VITE_FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Firecrawl API key not configured' });
    }

    const url = 'https://api.firecrawl.dev/v1/search';
    console.log('🔍 Firecrawl proxy request for:', q);

    const response = await axios.post(url, {
      query: q,
      limit: limit || 5
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      }
    });

    const data = response.data;
    const results = data.results || data.data || [];
    
    res.json({ results, total: results.length });
  } catch (error) {
    console.error('Firecrawl proxy error:', error.message);
    res.status(500).json({ error: 'Firecrawl request failed', details: error.message });
  }
});

app.post('/api/proxy/firecrawl/scrape', async (req, res) => {
  try {
    const { url, formats } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    const apiKey = process.env.VITE_FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Firecrawl API key not configured' });
    }

    const scrapeUrl = 'https://api.firecrawl.dev/v1/scrape';
    console.log('🔍 Firecrawl scrape request for:', url);

    const response = await axios.post(scrapeUrl, {
      url: url,
      formats: formats || ['markdown', 'html']
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      }
    });

    const data = response.data;
    
    res.json({
      markdown: data.markdown,
      html: data.html,
      raw: data.raw,
      links: data.links,
      meta: data.meta
    });
  } catch (error) {
    console.error('Firecrawl scrape error:', error.message);
    res.status(500).json({ error: 'Firecrawl scrape failed', details: error.message });
  }
});

app.post('/api/proxy/wikipedia', async (req, res) => {
  try {
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title parameter is required' });
    }

    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    console.log('🔍 Wikipedia proxy request for:', title);

    const response = await axios.get(url);
    const data = response.data;
    
    res.json({
      title: data.title,
      extract: data.extract,
      content_urls: data.content_urls,
      thumbnail: data.thumbnail
    });
  } catch (error) {
    console.error('Wikipedia proxy error:', error.message);
    res.status(500).json({ error: 'Wikipedia request failed', details: error.message });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(port, () => {
  console.log(`API Routes server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log('Available endpoints:');
  console.log('  POST /api/human-upload - Human audio upload');
  console.log('  POST /api/transcribe - Audio transcription');
  console.log('  POST /api/generate-ai-response - AI response generation');
  console.log('  POST /api/generate-debate-arguments - Debate argument generation');
  console.log('  POST /api/tts - Text-to-speech');
  console.log('  GET /api/voices - Get available voices');
  console.log('  🚀 N8N INTEGRATION:');
  console.log('  POST /api/create-content - Create content via N8N webhook');
  console.log('  🎯 TURN ENGINE ENDPOINTS:');
  console.log('  POST /api/debate/initialize - Initialize debate');
  console.log('  GET /api/debate/:id/state - Get debate state');
  console.log('  POST /api/debate/:id/start-speaking - Start speaking');
  console.log('  POST /api/debate/:id/complete-turn - Complete turn');
  console.log('  GET /api/debate/:id/can-speak/:userId - Check user permission');
  console.log('  GET /api/debate/:id/ai-can-speak - Check AI permission');
});
