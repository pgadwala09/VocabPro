-- Pronunciation Insights Database Schema for Supabase

-- Table to store pronunciation recordings and analysis
CREATE TABLE IF NOT EXISTS pronunciation_recordings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    audio_url TEXT,
    audio_blob_data BYTEA,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Whisper/OpenAI Analysis Results
    transcription TEXT,
    confidence_score DECIMAL(5,4), -- 0.0000 to 1.0000
    
    -- Pronunciation Metrics
    duration_ms INTEGER,
    word_count INTEGER,
    words_per_minute DECIMAL(8,2),
    
    -- Voice Analysis
    average_pitch_hz DECIMAL(8,2),
    pitch_range_hz DECIMAL(8,2),
    volume_db DECIMAL(8,2),
    
    -- Phoneme Analysis (JSON)
    phoneme_accuracy JSONB, -- {"phoneme": "accuracy_score"}
    pronunciation_errors JSONB, -- Array of detected errors
    
    -- Communication Style Analysis
    speaking_rate TEXT, -- 'slow', 'normal', 'fast'
    clarity_score DECIMAL(5,4),
    fluency_score DECIMAL(5,4),
    intonation_score DECIMAL(5,4),
    
    -- Overall Scores
    overall_pronunciation_score DECIMAL(5,4),
    improvement_suggestions JSONB -- Array of suggestions
);

-- Table to track user pronunciation progress
CREATE TABLE IF NOT EXISTS pronunciation_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    
    -- Progress Tracking
    attempts_count INTEGER DEFAULT 1,
    best_score DECIMAL(5,4),
    latest_score DECIMAL(5,4),
    average_score DECIMAL(5,4),
    
    -- Improvement Metrics
    first_attempt_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_attempt_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    improvement_rate DECIMAL(5,4), -- Progress over time
    
    -- Difficulty Assessment
    difficulty_level TEXT, -- 'easy', 'medium', 'hard'
    mastery_status TEXT, -- 'learning', 'practicing', 'mastered'
    
    UNIQUE(user_id, word)
);

-- Table to store session-based insights
CREATE TABLE IF NOT EXISTS pronunciation_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    
    -- Session Metrics
    total_words_practiced INTEGER DEFAULT 0,
    total_recordings INTEGER DEFAULT 0,
    average_session_score DECIMAL(5,4),
    
    -- Session Analysis
    focus_areas JSONB, -- Areas that need improvement
    achievements JSONB, -- Words mastered in this session
    session_summary TEXT
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pronunciation_recordings_user_id ON pronunciation_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_pronunciation_recordings_word ON pronunciation_recordings(word);
CREATE INDEX IF NOT EXISTS idx_pronunciation_recordings_created_at ON pronunciation_recordings(created_at);

CREATE INDEX IF NOT EXISTS idx_pronunciation_progress_user_id ON pronunciation_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_pronunciation_progress_word ON pronunciation_progress(word);

CREATE INDEX IF NOT EXISTS idx_pronunciation_sessions_user_id ON pronunciation_sessions(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE pronunciation_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pronunciation_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE pronunciation_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own recordings" ON pronunciation_recordings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recordings" ON pronunciation_recordings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recordings" ON pronunciation_recordings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own progress" ON pronunciation_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON pronunciation_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON pronunciation_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions" ON pronunciation_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON pronunciation_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON pronunciation_sessions
    FOR UPDATE USING (auth.uid() = user_id);


<<<<<<< HEAD
-- Debates metadata used by Live Debates UI
CREATE TABLE IF NOT EXISTS debates (
    id TEXT PRIMARY KEY,
    topic TEXT NOT NULL,
    debate_style TEXT,
    duration INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE debates ENABLE ROW LEVEL SECURITY;

-- Public read is fine for non-sensitive debate metadata
CREATE POLICY IF NOT EXISTS "Read debates" ON debates
    FOR SELECT USING (true);

-- Allow inserts/updates from anon/authenticated (client app)
CREATE POLICY IF NOT EXISTS "Upsert debates" ON debates
    FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Update debates" ON debates
    FOR UPDATE USING (true);
=======
-- =====================================================
-- DEBATE SYSTEM SUPABASE SCHEMA
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Main debates table
CREATE TABLE IF NOT EXISTS debates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    pro_argument TEXT,
    con_argument TEXT,
    selected_rounds INTEGER DEFAULT 1,
    selected_time INTEGER DEFAULT 60, -- in seconds
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual debate turns
CREATE TABLE IF NOT EXISTS debate_turns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debate_id UUID REFERENCES debates(id) ON DELETE CASCADE,
    turn_number INTEGER NOT NULL,
    speaker TEXT NOT NULL CHECK (speaker IN ('user_pro', 'ai_con')),
    transcript TEXT,
    audio_url TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    duration INTEGER, -- in seconds
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Complete debate audio recordings
CREATE TABLE IF NOT EXISTS debate_audio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debate_id UUID REFERENCES debates(id) ON DELETE CASCADE,
    audio_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    duration INTEGER, -- in seconds
    file_size BIGINT, -- in bytes
    file_type TEXT DEFAULT 'audio/mpeg'
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_debates_user_id ON debates(user_id);
CREATE INDEX IF NOT EXISTS idx_debates_status ON debates(status);
CREATE INDEX IF NOT EXISTS idx_debates_created_at ON debates(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_debate_turns_debate_id ON debate_turns(debate_id);
CREATE INDEX IF NOT EXISTS idx_debate_turns_turn_number ON debate_turns(debate_id, turn_number);
CREATE INDEX IF NOT EXISTS idx_debate_turns_speaker ON debate_turns(speaker);

CREATE INDEX IF NOT EXISTS idx_debate_audio_debate_id ON debate_audio(debate_id);
CREATE INDEX IF NOT EXISTS idx_debate_audio_created_at ON debate_audio(created_at DESC);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to get next turn number for a debate
CREATE OR REPLACE FUNCTION get_next_turn_number(debate_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    next_number INTEGER;
BEGIN
    SELECT COALESCE(MAX(turn_number), 0) + 1
    INTO next_number
    FROM debate_turns
    WHERE debate_id = debate_uuid;
    
    RETURN next_number;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to automatically update updated_at
CREATE TRIGGER update_debates_updated_at
    BEFORE UPDATE ON debates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE debates ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_audio ENABLE ROW LEVEL SECURITY;

-- Debates policies
CREATE POLICY "Users can view their own debates" ON debates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own debates" ON debates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debates" ON debates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debates" ON debates
    FOR DELETE USING (auth.uid() = user_id);

-- Debate turns policies
CREATE POLICY "Users can view turns from their debates" ON debate_turns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM debates 
            WHERE debates.id = debate_turns.debate_id 
            AND debates.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert turns to their debates" ON debate_turns
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM debates 
            WHERE debates.id = debate_turns.debate_id 
            AND debates.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update turns from their debates" ON debate_turns
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM debates 
            WHERE debates.id = debate_turns.debate_id 
            AND debates.user_id = auth.uid()
        )
    );

-- Debate audio policies
CREATE POLICY "Users can view audio from their debates" ON debate_audio
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM debates 
            WHERE debates.id = debate_audio.debate_id 
            AND debates.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert audio to their debates" ON debate_audio
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM debates 
            WHERE debates.id = debate_audio.debate_id 
            AND debates.user_id = auth.uid()
        )
    );

-- =====================================================
-- STORAGE BUCKETS SETUP
-- =====================================================

-- Create storage buckets (run these in Supabase dashboard SQL editor)

-- Main debate audio bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'debate-audio',
    'debate-audio',
    true,
    52428800, -- 50MB limit
    ARRAY['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/mp4']
) ON CONFLICT (id) DO NOTHING;

-- Optional: Raw audio chunks bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'debate-raw',
    'debate-raw',
    false, -- private bucket
    10485760, -- 10MB limit
    ARRAY['audio/webm', 'audio/wav', 'audio/mp4']
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- debate-audio bucket policies
CREATE POLICY "Users can upload debate audio" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'debate-audio' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view debate audio" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'debate-audio' AND
        (auth.uid()::text = (storage.foldername(name))[1] OR 
         auth.uid()::text = (storage.foldername(name))[2])
    );

CREATE POLICY "Users can update their debate audio" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'debate-audio' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their debate audio" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'debate-audio' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- debate-raw bucket policies (more restrictive)
CREATE POLICY "Users can upload raw audio" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'debate-raw' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their raw audio" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'debate-raw' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their raw audio" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'debate-raw' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- =====================================================
-- SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Insert sample debate (uncomment if needed for testing)
/*
INSERT INTO debates (user_id, topic, status, selected_rounds, selected_time)
VALUES (
    auth.uid(),
    'Should schools adopt AI-assisted learning?',
    'active',
    4,
    120
);
*/

-- =====================================================
-- VIEWS FOR EASY QUERYING
-- =====================================================

-- View for debate summary with turn count
CREATE OR REPLACE VIEW debate_summary AS
SELECT 
    d.id,
    d.topic,
    d.status,
    d.created_at,
    d.selected_rounds,
    d.selected_time,
    COUNT(dt.id) as turn_count,
    MAX(dt.timestamp) as last_activity
FROM debates d
LEFT JOIN debate_turns dt ON d.id = dt.debate_id
GROUP BY d.id, d.topic, d.status, d.created_at, d.selected_rounds, d.selected_time;

-- Grant access to the view
GRANT SELECT ON debate_summary TO authenticated;

-- =====================================================
-- CLEANUP FUNCTIONS
-- =====================================================

-- Function to clean up old debate data (optional)
CREATE OR REPLACE FUNCTION cleanup_old_debates(days_old INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM debate_turns 
    WHERE debate_id IN (
        SELECT id FROM debates 
        WHERE created_at < NOW() - INTERVAL '1 day' * days_old
        AND status = 'completed'
    );
    
    DELETE FROM debate_audio 
    WHERE debate_id IN (
        SELECT id FROM debates 
        WHERE created_at < NOW() - INTERVAL '1 day' * days_old
        AND status = 'completed'
    );
    
    DELETE FROM debates 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_old
    AND status = 'completed';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE debates IS 'Main debate sessions created by users';
COMMENT ON TABLE debate_turns IS 'Individual turns within a debate (user or AI)';
COMMENT ON TABLE debate_audio IS 'Complete debate audio recordings';
COMMENT ON FUNCTION get_next_turn_number(UUID) IS 'Get the next turn number for a debate';
COMMENT ON FUNCTION cleanup_old_debates(INTEGER) IS 'Clean up old completed debates';
>>>>>>> origin/main


