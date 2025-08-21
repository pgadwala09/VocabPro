# TTS Setup Instructions

## 🎤 AI Voice is Not Working - Here's How to Fix It

The AI voice requires API keys to work properly. Here's what you need to do:

### 1. **Create a `.env` file**
Create a file named `.env` in the root directory with the following content:

```env
# ElevenLabs API Configuration (REQUIRED for high-quality AI voice)
# Get your free API key from: https://elevenlabs.io/
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Proxy Server URLs (these are already set correctly)
VITE_PROXY_BASE=http://127.0.0.1:8787
VITE_OPENAI_PROXY=http://127.0.0.1:8788
VITE_GCP_TTS_PROXY=http://127.0.0.1:8789
```

### 2. **Get an ElevenLabs API Key**
1. Go to https://elevenlabs.io/
2. Sign up for a free account
3. Go to your profile settings
4. Copy your API key
5. Replace `your_elevenlabs_api_key_here` in the `.env` file with your actual API key

### 3. **Restart the Development Server**
After creating the `.env` file, restart your development server:
```bash
npm run dev
```

### 4. **Test the AI Voice**
1. Open the debate page in your browser
2. Click **"🔊 Simple TTS Test"** - This should work immediately
3. Click **"🔊 Test AI Voice"** - This will test the full TTS system
4. Check the browser console (F12) for detailed logs

### 5. **If Still Not Working**
The system has multiple fallbacks:
- **ElevenLabs TTS** (highest quality, requires API key)
- **OpenAI TTS** (good quality, requires API key)
- **Google Cloud TTS** (good quality, requires API key)
- **Browser Speech Synthesis** (basic, works without API key)

If you don't have API keys, the browser speech synthesis should still work. Try the **"🔊 Simple TTS Test"** button first.

### 6. **Current Status**
✅ **Proxy servers are running** (ElevenLabs, OpenAI, GCP)
❌ **API keys not configured** (this is why AI voice isn't working)
✅ **Browser speech synthesis available** (fallback option)

### 7. **Quick Test**
Try clicking the **"🔊 Simple TTS Test"** button right now - this should work even without API keys!

