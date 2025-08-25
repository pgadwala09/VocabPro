# Debate System Setup Guide

This guide will help you set up the complete 1-on-1 debate system with Supabase integration, audio recording, transcription, AI responses, and TTS.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- OpenAI API key
- ElevenLabs API key (optional, for better TTS)

## Step 1: Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# ElevenLabs Configuration (optional)
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Server Ports
OPENAI_PROXY_PORT=3002
API_PORT=3003
FRONTEND_URL=http://localhost:5173
```

## Step 2: Supabase Database Setup

1. **Create a new Supabase project** or use an existing one
2. **Run the SQL schema** in your Supabase SQL editor:

```sql
-- Copy and paste the contents of src/lib/supabase-schema.sql
-- This will create all necessary tables and RLS policies
```

3. **Set up Storage bucket**:
   - Go to Storage in your Supabase dashboard
   - Create a new bucket called `debate-audio`
   - Set it to public or configure RLS policies as needed

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Start the Development Environment

### Option 1: Start all services at once
```bash
npm run start:all
```

### Option 2: Start services individually
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: API Routes
npm run api:routes

# Terminal 3: OpenAI Proxy
npm run proxy:openai

# Terminal 4: ElevenLabs Proxy (optional)
npm run proxy:eleven
```

## Step 5: Verify Setup

1. **Frontend**: http://localhost:5173
2. **API Routes**: http://localhost:3003/health
3. **OpenAI Proxy**: http://localhost:3002/health

## System Architecture

### Frontend Components
- `OneOnOneDebate.tsx`: Main debate interface
- `DebateTournament.tsx`: Debate management
- `src/lib/supabase.ts`: Database and service functions

### Backend Services
- `server/api-routes.js`: Main API endpoints
- `server/openai-proxy.js`: OpenAI integration
- `server/elevanlabs-proxy.js`: TTS integration

### Database Tables
- `debates`: Debate metadata
- `debate_turns`: Individual debate turns
- `debate_audio`: Complete debate recordings

## Features Implemented

### ✅ Core Debate System
- [x] 1-on-1 debate interface
- [x] User audio recording
- [x] Real-time transcription (OpenAI Whisper)
- [x] AI response generation (GPT-4)
- [x] Text-to-speech (ElevenLabs)
- [x] Turn-based debate flow
- [x] Timer management
- [x] Debate transcript display

### ✅ Database Integration
- [x] Supabase setup with RLS
- [x] Debate creation and management
- [x] Turn storage and retrieval
- [x] Audio file storage
- [x] Real-time updates

### ✅ Audio Processing
- [x] User audio recording (MediaRecorder API)
- [x] Audio upload to Supabase Storage
- [x] Transcription using OpenAI Whisper
- [x] TTS generation with ElevenLabs
- [x] Audio playback controls

### ✅ UI/UX Features
- [x] Modern, responsive design
- [x] Real-time status indicators
- [x] Debate transcript display
- [x] Recent activity tracking
- [x] Download, share, WhatsApp, email buttons
- [x] Timer display with countdown
- [x] Turn status indicators

## API Endpoints

### Transcription
- `POST /api/transcribe` - Convert audio to text

### AI Response Generation
- `POST /api/generate-ai-response` - Generate AI debate responses
- `POST /api/generate-debate-arguments` - Generate initial arguments

### Text-to-Speech
- `POST /api/tts` - Convert text to speech
- `GET /api/voices` - Get available voices

## Debate Flow

1. **Initialize Debate**: User selects topic and settings
2. **User Turn**: 
   - Click "Start Recording"
   - Speak for the selected duration
   - Audio is automatically transcribed
   - Turn is saved to database
3. **AI Turn**:
   - AI generates response based on user input
   - Response is converted to speech
   - Audio plays automatically
   - Turn is saved to database
4. **Repeat**: Process continues for selected number of rounds
5. **Complete**: Full debate is saved with all turns

## Troubleshooting

### Common Issues

1. **Microphone Access**
   - Ensure browser has microphone permissions
   - Check if microphone is working in other applications

2. **API Key Issues**
   - Verify all API keys are correctly set in `.env`
   - Check API key permissions and quotas

3. **Supabase Connection**
   - Verify Supabase URL and anon key
   - Check if RLS policies are correctly configured

4. **Audio Issues**
   - Ensure ElevenLabs API key is set for TTS
   - Check browser audio permissions

### Debug Commands

```bash
# Check API health
curl http://localhost:3003/health
curl http://localhost:3002/health

# Check environment variables
node -e "console.log(require('dotenv').config())"
```

## Production Deployment

### Frontend (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy the `dist` folder
3. Set environment variables in deployment platform

### Backend (Railway/Render)
1. Deploy the `server` folder
2. Set environment variables
3. Configure CORS origins

### Database
1. Use Supabase production instance
2. Configure proper RLS policies
3. Set up monitoring and backups

## Security Considerations

- All API keys are stored server-side
- RLS policies ensure users can only access their own data
- Audio files are stored securely in Supabase Storage
- CORS is configured for specific origins

## Performance Optimization

- Audio files are compressed before upload
- Transcription uses efficient Whisper model
- TTS responses are cached where possible
- Real-time updates use efficient WebSocket connections

## Support

For issues or questions:
1. Check the troubleshooting section
2. Verify all environment variables are set
3. Check browser console for errors
4. Ensure all services are running

## Future Enhancements

- [ ] Multi-language support
- [ ] Debate analytics and insights
- [ ] Voice customization options
- [ ] Debate templates and topics
- [ ] Social sharing features
- [ ] Debate scoring and evaluation

