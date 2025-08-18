import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

// Create a mock client if environment variables are not set
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
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
};