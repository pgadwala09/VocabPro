# Supabase Setup Guide for Debate System

## 🚀 Quick Setup Steps

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `vocabpro-debate-system`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

### 2. Get Project Credentials
1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

### 3. Set Up Database Schema
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the entire content from `src/lib/supabase-schema.sql`
3. Paste and run the SQL script
4. Verify all tables, functions, and policies are created

### 4. Create Storage Buckets
The SQL script will create these buckets automatically, but verify in **Storage**:

#### Main Audio Bucket: `debate-audio`
- **Public**: ✅ Yes
- **File Size Limit**: 50MB
- **Allowed Types**: `audio/mpeg`, `audio/wav`, `audio/webm`, `audio/mp4`

#### Raw Audio Bucket: `debate-raw` (Optional)
- **Public**: ❌ No (Private)
- **File Size Limit**: 10MB
- **Allowed Types**: `audio/webm`, `audio/wav`, `audio/mp4`

### 5. Configure Environment Variables
Create a `.env` file in your project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI API (for transcription and AI responses)
OPENAI_API_KEY=your-openai-api-key-here

# ElevenLabs API (for text-to-speech)
ELEVENLABS_API_KEY=your-elevenlabs-api-key-here

# Server Configuration
API_PORT=3003
OPENAI_PROXY_PORT=3002
FRONTEND_URL=http://localhost:5173
```

### 6. Test the Setup
1. Start your development server: `npm run dev`
2. Start the API server: `npm run api:routes`
3. Test the debate system

## 📋 Database Schema Overview

### Tables Created:
- **`debates`**: Main debate sessions
- **`debate_turns`**: Individual turns (user/AI)
- **`debate_audio`**: Complete debate recordings

### Functions Created:
- **`get_next_turn_number()`**: Auto-increment turn numbers
- **`update_updated_at_column()`**: Auto-update timestamps
- **`cleanup_old_debates()`**: Clean up old data

### Security Features:
- **Row Level Security (RLS)** enabled on all tables
- **User-specific access**: Users can only see their own data
- **Storage policies**: Secure file upload/download

## 🔧 Storage Bucket Structure

### File Organization:
```
debate-audio/
├── {user_id}/
│   ├── debate_{debate_id}/
│   │   ├── turn_1_user_pro_1234567890.webm
│   │   ├── turn_2_ai_con_1234567891.mp3
│   │   └── complete_debate_1234567892.mp3
│   └── ...
└── ...

debate-raw/ (optional)
├── {user_id}/
│   ├── debate_{debate_id}/
│   │   ├── raw_chunk_1.webm
│   │   ├── raw_chunk_2.webm
│   │   └── ...
│   └── ...
└── ...
```

## 🛡️ Security Policies

### Database Access:
- Users can only read/write their own debates
- All operations require authentication
- Automatic cleanup of old data

### Storage Access:
- Users can upload to their own folders
- Public access for debate audio (for sharing)
- Private access for raw audio chunks

## 🧪 Testing the Setup

### 1. Test Database Connection
```javascript
// In browser console
import { supabase } from './src/lib/supabase.js'
const { data, error } = await supabase.from('debates').select('*')
console.log('Connection test:', { data, error })
```

### 2. Test Storage Upload
```javascript
// Test file upload
const file = new File(['test'], 'test.mp3', { type: 'audio/mpeg' })
const { data, error } = await supabase.storage
  .from('debate-audio')
  .upload('test/test.mp3', file)
console.log('Upload test:', { data, error })
```

### 3. Test Debate Creation
```javascript
// Test creating a debate
const { data, error } = await supabase
  .from('debates')
  .insert({
    topic: 'Test debate topic',
    selected_rounds: 4,
    selected_time: 120
  })
  .select()
console.log('Debate creation test:', { data, error })
```

## 🔍 Troubleshooting

### Common Issues:

1. **"RLS policy violation"**
   - Ensure user is authenticated
   - Check if user_id matches the data owner

2. **"Storage bucket not found"**
   - Verify buckets are created in Supabase dashboard
   - Check bucket names match exactly

3. **"Function not found"**
   - Run the SQL schema script again
   - Check if functions exist in **Database** → **Functions**

4. **"Permission denied"**
   - Verify RLS policies are enabled
   - Check if user has proper authentication

### Debug Commands:
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'debate%';

-- Check if functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name LIKE '%debate%';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename LIKE 'debate%';
```

## 📊 Monitoring

### Useful Queries:
```sql
-- Count debates by status
SELECT status, COUNT(*) FROM debates GROUP BY status;

-- Count turns by speaker
SELECT speaker, COUNT(*) FROM debate_turns GROUP BY speaker;

-- Storage usage
SELECT bucket_id, COUNT(*), SUM(metadata->>'size')::bigint as total_size
FROM storage.objects 
WHERE bucket_id LIKE 'debate%'
GROUP BY bucket_id;
```

## 🚀 Production Deployment

### Environment Variables for Production:
```env
# Production Supabase
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# Production URLs
FRONTEND_URL=https://your-domain.com
API_PORT=3003
```

### Security Checklist:
- ✅ RLS policies enabled
- ✅ Storage policies configured
- ✅ Environment variables secured
- ✅ API keys rotated regularly
- ✅ Backup strategy in place

## 📞 Support

If you encounter issues:
1. Check the Supabase dashboard logs
2. Verify all SQL scripts ran successfully
3. Test with the provided test commands
4. Check browser console for errors
5. Verify environment variables are set correctly

