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


