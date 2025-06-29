import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a mock client if environment variables are not set
const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Auth helper functions with null checks
export const signUp = async (email: string, password: string, name: string) => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please set up your environment variables.');
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  });
  
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please set up your environment variables.');
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
};

export const signOut = async () => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please set up your environment variables.');
  }
  
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const resetPassword = async (email: string) => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please set up your environment variables.');
  }
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  return { data, error };
};

export const getCurrentUser = () => {
  if (!supabase) {
    return null;
  }
  
  return supabase.auth.getUser();
};

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  if (!supabase) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  
  return supabase.auth.onAuthStateChange(callback);
};

export { supabase };