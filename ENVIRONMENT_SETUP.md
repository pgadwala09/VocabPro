# Fix AI Not Responding Issue

## 🚨 Problem Identified

The AI is not responding because the environment variables are not configured. The application needs these variables to connect to the necessary services.

## 🔧 Quick Fix Steps

### Step 1: Create Environment File

Create a `.env` file in your project root (same folder as `package.json`) with the following content:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# N8n Configuration
VITE_N8N_BASE_URL=http://localhost:5678
VITE_N8N_USERNAME=debate_user
VITE_N8N_PASSWORD=debate_pass

# OpenAI Configuration (Required for AI responses)
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### Step 2: Get Your API Keys

#### For OpenAI (Required for AI responses):
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Replace `your_openai_api_key_here` with your actual key

#### For Supabase (Required for database):
1. Go to [Supabase](https://supabase.com)
2. Create a new project or use existing one
3. Go to Settings → API
4. Copy the URL and anon key
5. Replace the placeholder values

### Step 3: Test the Configuration

1. **Restart your development server**:
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

2. **Navigate to the test page**:
   - Go to `http://localhost:5174/debate-test`
   - Click "Run All Tests" to verify everything is working

3. **Test the debate interface**:
   - Go to `http://localhost:5174/debate-interface`
   - Try sending a message

## 🔍 Alternative: Quick Test Without Full Setup

If you want to test immediately without setting up all services, you can use this minimal configuration:

```env
# Minimal configuration for testing
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_N8N_BASE_URL=http://localhost:5678
VITE_N8N_USERNAME=test
VITE_N8N_PASSWORD=test
```

## 🛠️ Debugging Steps

### 1. Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages when sending a message

### 2. Use Debug Tools
1. Navigate to `http://localhost:5174/debate-test`
2. Run the test suite to identify specific issues

### 3. Check Network Tab
1. Open browser DevTools → Network tab
2. Send a message in the debate interface
3. Look for failed requests

## 🚀 Quick Start Commands

```bash
# 1. Create .env file (copy the content above)
# 2. Restart development server
npm run dev

# 3. Open in browser
# http://localhost:5174/debate-interface
```

## 📞 Common Issues

### Issue: "API key not found"
**Solution**: Make sure your `.env` file is in the project root and contains the correct API key

### Issue: "Network error"
**Solution**: Check if your API key is valid and has sufficient credits

### Issue: "CORS error"
**Solution**: This is normal for local development, the app should still work

## ✅ Success Indicators

When working correctly, you should see:
- ✅ AI responses appear in the chat
- ✅ Messages are stored in history
- ✅ No error messages in browser console
- ✅ Test suite passes all checks

## 🆘 Still Having Issues?

1. **Check the debug guide**: `DEBATE_DEBUG_GUIDE.md`
2. **Run the test suite**: `/debate-test` page
3. **Verify API keys**: Make sure they're valid and have credits
4. **Check network**: Ensure you have internet connection

---

**After creating the `.env` file with your API keys, restart the development server and the AI should start responding! 🚀**
