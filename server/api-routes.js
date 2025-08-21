import express from 'express';
import cors from 'cors';
import multer from 'multer';
import OpenAI from 'openai';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import turnEngine from './turn-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

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
  res.json({ 
    status: 'OK', 
    service: 'API Routes',
    services: {
      transcription: !!process.env.OPENAI_API_KEY,
      aiResponse: !!process.env.OPENAI_API_KEY,
      tts: !!process.env.ELEVENLABS_API_KEY
    }
  });
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
  console.log(`API Routes server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log('Available endpoints:');
  console.log('  POST /api/human-upload - Human audio upload');
  console.log('  POST /api/transcribe - Audio transcription');
  console.log('  POST /api/generate-ai-response - AI response generation');
  console.log('  POST /api/generate-debate-arguments - Debate argument generation');
  console.log('  POST /api/tts - Text-to-speech');
  console.log('  GET /api/voices - Get available voices');
  console.log('  🎯 TURN ENGINE ENDPOINTS:');
  console.log('  POST /api/debate/initialize - Initialize debate');
  console.log('  GET /api/debate/:id/state - Get debate state');
  console.log('  POST /api/debate/:id/start-speaking - Start speaking');
  console.log('  POST /api/debate/:id/complete-turn - Complete turn');
  console.log('  GET /api/debate/:id/can-speak/:userId - Check user permission');
  console.log('  GET /api/debate/:id/ai-can-speak - Check AI permission');
});
