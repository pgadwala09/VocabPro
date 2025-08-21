-- Quick Supabase Setup for Debate System
-- Run this in your Supabase Dashboard -> SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create debates table (if not exists)
CREATE TABLE IF NOT EXISTS debates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    pro_argument TEXT,
    con_argument TEXT,
    selected_rounds INTEGER DEFAULT 1,
    selected_time INTEGER DEFAULT 60,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create debate_turns table (if not exists)
CREATE TABLE IF NOT EXISTS debate_turns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debate_id UUID REFERENCES debates(id) ON DELETE CASCADE,
    turn_number INTEGER NOT NULL,
    speaker TEXT NOT NULL CHECK (speaker IN ('user_pro', 'ai_con')),
    transcript TEXT,
    audio_url TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    duration INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create debate_audio table (if not exists)
CREATE TABLE IF NOT EXISTS debate_audio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debate_id UUID REFERENCES debates(id) ON DELETE CASCADE,
    audio_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    duration INTEGER,
    file_size BIGINT,
    file_type TEXT DEFAULT 'audio/mpeg'
);

-- Enable Row Level Security
ALTER TABLE debates ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_audio ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for debates
CREATE POLICY "Users can view their own debates" ON debates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own debates" ON debates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debates" ON debates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debates" ON debates
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for debate_turns
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

-- Create RLS policies for debate_audio
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_debates_user_id ON debates(user_id);
CREATE INDEX IF NOT EXISTS idx_debate_turns_debate_id ON debate_turns(debate_id);
CREATE INDEX IF NOT EXISTS idx_debate_audio_debate_id ON debate_audio(debate_id);

-- Success message
SELECT '✅ Debate system tables created successfully!' as status;

