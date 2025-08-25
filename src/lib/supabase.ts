import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

// Create a mock client if environment variables are not set
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Auth helper functions
export const signUp = async (email: string, password: string, name: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    
    if (error) {
      console.error('Signup error:', error);
      return { data: null, error };
    }
    
    // Check if email confirmation is required
    if (data.user && !data.session) {
      return { 
        data: { 
          user: data.user, 
          requiresEmailConfirmation: true 
        }, 
        error: null 
      };
    }
    
    return { data, error };
  } catch (err) {
    console.error('Signup exception:', err);
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred during signup' } 
    };
  }
};
// Types for debate system
export interface Debate {
  id: string;
  user_id: string;
  topic: string;
  created_at: string;
  status: 'active' | 'completed';
  pro_argument?: string;
  con_argument?: string;
  selected_rounds: number;
  selected_time: number;
}

export interface DebateTurn {
  id: string;
  debate_id: string;
  turn_number: number;
  speaker: 'user_pro' | 'ai_con';
  transcript?: string;
  audio_url?: string;
  timestamp: string;
  duration?: number;
  state?: 'waiting' | 'speaking' | 'complete' | 'skipped';
  ends_at?: string;
  started_at?: string;
}

export interface DebateAudio {
  id: string;
  debate_id: string;
  audio_url: string;
  created_at: string;
  duration?: number;
  file_size?: number;
}

// Debate management functions
export const debateService = {
  // Create a new debate
  async createDebate(topic: string, selectedRounds: number = 1, selectedTime: number = 60): Promise<Debate | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('debates')
      .insert({
        user_id: user.id,
        topic,
        selected_rounds: selectedRounds,
        selected_time: selectedTime,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating debate:', error);
      return null;
    }

    return data;
  },

  // Get user's debates
  async getUserDebates(): Promise<Debate[]> {
    const { data, error } = await supabase
      .from('debates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching debates:', error);
      return [];
    }

    return data || [];
  },

  // Get debate by ID
  async getDebate(debateId: string): Promise<Debate | null> {
    const { data, error } = await supabase
      .from('debates')
      .select('*')
      .eq('id', debateId)
      .single();

    if (error) {
      console.error('Error fetching debate:', error);
      return null;
    }

    return data;
  },

  // Update debate arguments
  async updateDebateArguments(debateId: string, proArgument: string, conArgument: string): Promise<boolean> {
    const { error } = await supabase
      .from('debates')
      .update({
        pro_argument: proArgument,
        con_argument: conArgument
      })
      .eq('id', debateId);

    if (error) {
      console.error('Error updating debate arguments:', error);
      return false;
    }

    return true;
  },

  // Complete a debate
  async completeDebate(debateId: string): Promise<boolean> {
    const { error } = await supabase
      .from('debates')
      .update({ status: 'completed' })
      .eq('id', debateId);

    if (error) {
      console.error('Error completing debate:', error);
      return false;
    }

    return true;
  },

  // Get debate turns
  async getDebateTurns(debateId: string): Promise<DebateTurn[]> {
    const { data, error } = await supabase
      .from('debate_turns')
      .select('*')
      .eq('debate_id', debateId)
      .order('turn_number', { ascending: true });

    if (error) {
      console.error('Error fetching debate turns:', error);
      return [];
    }

    return data || [];
  },

  // Add a debate turn
  async addDebateTurn(debateId: string, speaker: 'user_pro' | 'ai_con', transcript?: string, audioUrl?: string, duration?: number): Promise<DebateTurn | null> {
    // Get next turn number
    const { data: turnNumberData } = await supabase
      .rpc('get_next_turn_number', { debate_uuid: debateId });

    const turnNumber = turnNumberData || 1;

    const { data, error } = await supabase
      .from('debate_turns')
      .insert({
        debate_id: debateId,
        turn_number: turnNumber,
        speaker,
        transcript,
        audio_url: audioUrl,
        duration
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding debate turn:', error);
      return null;
    }

    return data;
  },

  // Update debate turn with audio URL
  async updateDebateTurnAudio(turnId: string, audioUrl: string): Promise<boolean> {
    const { error } = await supabase
      .from('debate_turns')
      .update({ audio_url: audioUrl })
      .eq('id', turnId);

    if (error) {
      console.error('Error updating debate turn audio:', error);
      return false;
    }

    return true;
  },

  // Save complete debate audio
  async saveDebateAudio(debateId: string, audioUrl: string, duration?: number, fileSize?: number): Promise<DebateAudio | null> {
    const { data, error } = await supabase
      .from('debate_audio')
      .insert({
        debate_id: debateId,
        audio_url: audioUrl,
        duration,
        file_size: fileSize
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving debate audio:', error);
      return null;
    }

    return data;
  },

  // Upload audio file to Supabase Storage
  async uploadAudioFile(debateId: string, turnNumber: number, audioBlob: Blob): Promise<string | null> {
    const fileName = `debate_${debateId}/turn_${turnNumber}_${Date.now()}.webm`;
    
    const { data, error } = await supabase.storage
      .from('debate-audio')
      .upload(fileName, audioBlob, {
        contentType: 'audio/webm',
        cacheControl: '3600'
      });

    if (error) {
      console.error('Error uploading audio:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('debate-audio')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  },

  // Subscribe to real-time debate updates
  subscribeToDebateTurns(debateId: string, callback: (turn: DebateTurn) => void) {
    return supabase
      .channel(`debate-turns-${debateId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'debate_turns',
        filter: `debate_id=eq.${debateId}`
      }, (payload) => {
        callback(payload.new as DebateTurn);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'debate_turns',
        filter: `debate_id=eq.${debateId}`
      }, (payload) => {
        callback(payload.new as DebateTurn);
      })
      .subscribe();
  },

  // Unsubscribe from real-time updates
  unsubscribeFromDebateTurns(debateId: string) {
    supabase.channel(`debate-turns-${debateId}`).unsubscribe();
  },

  // Get current active turn
  async getCurrentTurn(debateId: string): Promise<DebateTurn | null> {
    const { data, error } = await supabase
      .from('debate_turns')
      .select('*')
      .eq('debate_id', debateId)
      .in('state', ['waiting', 'speaking'])
      .order('turn_number', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching current turn:', error);
      return null;
    }

    return data;
  },

  // Start speaking turn
  async startSpeakingTurn(turnId: string, duration: number = 60): Promise<boolean> {
    const startedAt = new Date().toISOString();
    const endsAt = new Date(Date.now() + duration * 1000).toISOString();

    const { error } = await supabase
      .from('debate_turns')
      .update({
        state: 'speaking',
        started_at: startedAt,
        ends_at: endsAt
      })
      .eq('id', turnId);

    if (error) {
      console.error('Error starting speaking turn:', error);
      return false;
    }

    return true;
  },

  // Complete turn
  async completeTurn(turnId: string): Promise<boolean> {
    const { error } = await supabase
      .from('debate_turns')
      .update({
        state: 'complete'
      })
      .eq('id', turnId);

    if (error) {
      console.error('Error completing turn:', error);
      return false;
    }

    return true;
  },

  // Create next turn
  async createNextTurn(debateId: string, speaker: 'user_pro' | 'ai_con'): Promise<DebateTurn | null> {
    const { data: turnNumberData } = await supabase
      .rpc('get_next_turn_number', { debate_uuid: debateId });

    const turnNumber = turnNumberData || 1;

    const { data, error } = await supabase
      .from('debate_turns')
      .insert({
        debate_id: debateId,
        turn_number: turnNumber,
        speaker,
        state: 'waiting'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating next turn:', error);
      return null;
    }

    return data;
  }
};

// Transcription service using OpenAI Whisper
export const transcriptionService = {
  async transcribeAudio(audioBlob: Blob): Promise<string | null> {
    try {
      // Convert blob to file
      const file = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
      
      // Create FormData for OpenAI API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', 'whisper-1');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const result = await response.json();
      return result.text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      // Return a fallback transcript
      return "User provided their argument in the debate.";
    }
  }
};

// AI response generation service
export const aiResponseService = {
  async generateAIResponse(topic: string, userTranscript: string, previousTurns: DebateTurn[]): Promise<string | null> {
    try {
      // Build context from previous turns
      const context = previousTurns
        .map(turn => `${turn.speaker === 'user_pro' ? 'Pro' : 'Con'}: ${turn.transcript}`)
        .join('\n');

      const systemPrompt = `You are CON on the topic: "${topic}".
Goal: Refute the proposition clearly. Stay within 150 words.
Debate constraints:
- Do not speak unless it's your turn.
- Be concise and targeted at the opponent's last point.
- End with one probing question or caveat.`;

      const userPrompt = `Previous turns:
${context}

The pro side just said: "${userTranscript}"

Respond as CON:`;

      const response = await fetch('/api/generate-ai-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          topic,
          userTranscript
        })
      });

      if (!response.ok) {
        throw new Error('AI response generation failed');
      }

      const result = await response.json();
      return result.response;
    } catch (error) {
      console.error('Error generating AI response:', error);
      // Return a fallback response if API fails
      return generateFallbackResponse(topic, userTranscript);
    }
  }
};

// Fallback AI response generator
function generateFallbackResponse(topic: string, userTranscript: string): string {
  const responses = [
    `I understand your position on ${topic}, but I must respectfully disagree. There are several important considerations that suggest a different approach. What evidence supports your claim that this is the best solution?`,
    `While your argument about ${userTranscript} has merit, I believe there are compelling counterarguments that deserve consideration. Have you considered the long-term implications of this approach?`,
    `Thank you for sharing your perspective. However, I think we need to examine the broader implications of this issue. What about the potential risks you haven't addressed?`,
    `Your point about ${userTranscript} is interesting, but I'd like to present an alternative viewpoint that challenges this position. How do you respond to the criticism that this approach is too simplistic?`,
    `I appreciate your argument, but I believe there are fundamental flaws in this approach that we should address. What would you say to those who argue this creates more problems than it solves?`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Text-to-Speech service
export const ttsService = {
  async generateSpeech(text: string): Promise<Blob | null> {
    try {
      console.log('TTS Service: Attempting to generate speech for text length:', text.length);
      
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          voice: '21m00Tcm4TlvDq8ikWAM' // Default ElevenLabs voice ID
        })
      });

      console.log('TTS Service: Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('TTS Service: API error:', errorText);
        throw new Error(`TTS generation failed: ${response.status} ${errorText}`);
      }

      const blob = await response.blob();
      console.log('TTS Service: Generated audio blob size:', blob.size);
      return blob;
    } catch (error) {
      console.error('TTS Service: Error generating speech:', error);
      return null;
    }
  }
};

// Authentication functions
>>>>>>> origin/main
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
<<<<<<< HEAD
  
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  return { data, error };
};

export const getCurrentUser = () => {
  return supabase.auth.getUser();
};

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

// Fetch spelling quiz words from Supabase
export const fetchSpellingWords = async () => {
  const { data, error } = await supabase
    .from('spelling_words')
    .select('word, syllables, rhyme, image')
    .order('id', { ascending: true });
  if (error) throw error;
  return data || [];
};

// Speaking Seeds fetcher by topic/title (optionally filter by level and format)
export const fetchSpeakingSeedByTopic = async (
  topic: string,
  options?: { level?: 'A1'|'A2'|'B1'|'B2'|'C1'|'C2'; format?: 'monologue'|'dialogue'|'debate_prompt'|'roleplay' }
) => {
  const { level, format } = options || {};
  let query = supabase
    .from('speaking_seeds')
    .select('id, level, topic, format, text_seed, target_words, grammar_points, tags, created_at')
    .ilike('topic', topic);

  if (level) query = query.eq('level', level);
  if (format) query = query.eq('format', format);

  const { data, error } = await query.order('created_at', { ascending: false }).limit(1);
  if (error) throw error;
  return (data && data.length > 0) ? data[0] : null;
};

export { supabase };

// Generic content search API for JAM content based on title and filters
// Expects a 'speaking_seeds' table with columns: topic, level, format, curriculum, age_group(optional), text_seed
export type ContentSearchFilters = {
  query: string; // title or partial title
  level?: 'A1'|'A2'|'B1'|'B2'|'C1'|'C2';
  format?: 'monologue'|'dialogue'|'debate_prompt'|'roleplay';
  curriculum?: string;
  ageGroup?: string;
  limit?: number;
};

export const searchContent = async (filters: ContentSearchFilters) => {
  const { query, level, format, curriculum, ageGroup, limit = 10 } = filters;
  try {
    let q = supabase
      .from('speaking_seeds')
      .select('id, topic, level, format, curriculum, age_group, text_seed, tags, created_at')
      .ilike('topic', `%${query}%`);

    if (level) q = q.eq('level', level);
    if (format) q = q.eq('format', format);
    if (curriculum) q = q.eq('curriculum', curriculum);
    if (ageGroup) q = q.eq('age_group', ageGroup);

    const { data, error } = await q.order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return data || [];
  } catch (e) {
    // Fallback to topic-only search in case some columns do not exist
    try {
      const { data } = await supabase
        .from('speaking_seeds')
        .select('id, topic, text_seed, created_at')
        .ilike('topic', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);
      return data || [];
    } catch {
      return [];
    }
  }
};

// Optional: semantic search using pgvector (requires a 'embedding vector' column and a RPC function)
// SQL you need on your DB (example):
// 1) Add pgvector and an embedding column
//    create extension if not exists vector;
//    alter table speaking_seeds add column if not exists embedding vector(1536);
// 2) Create RPC to query by embedding
//    create or replace function match_speaking_seeds(query_embedding vector(1536), match_count int)
//    returns table(id bigint, topic text, text_seed text, similarity float)
//    language sql stable as $$
//      select id, topic, text_seed, 1 - (embedding <=> query_embedding) as similarity
//      from speaking_seeds
//      order by embedding <=> query_embedding
//      limit match_count
//    $$;
// Then call update embeddings with your pipeline and use the function below.
export const semanticSearchContent = async (embedding: number[], limit = 5) => {
  const { data, error } = await supabase.rpc('match_speaking_seeds', {
    query_embedding: embedding,
    match_count: limit,
  });
  if (error) throw error;
  return data || [];
=======
  return { data, error };
};

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { data, error };
>>>>>>> origin/main
};