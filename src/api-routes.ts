// API Routes for Debate System
import { supabase } from './lib/supabase';

export const initializeDebate = async (topic, selectedRounds = 1, selectedTime = 60) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('debates')
      .insert({
        user_id: user.id,
        topic: topic,
        selected_rounds: selectedRounds,
        selected_time: selectedTime,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating debate:', error);
      throw error;
    }

    return { success: true, debate: data };
  } catch (error) {
    console.error('initializeDebate error:', error);
    return { success: false, error: error.message };
  }
};

export const getCurrentTurn = async (debateId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('debate_turns')
      .select('*')
      .eq('debate_id', debateId)
      .order('turn_number', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error getting current turn:', error);
      throw error;
    }

    return { success: true, turn: data };
  } catch (error) {
    console.error('getCurrentTurn error:', error);
    return { success: false, error: error.message };
  }
};

export const saveTurn = async (debateId, turnNumber, speaker, transcript, audioUrl = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('debate_turns')
      .insert({
        debate_id: debateId,
        turn_number: turnNumber,
        speaker: speaker,
        transcript: transcript,
        audio_url: audioUrl,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving turn:', error);
      throw error;
    }

    return { success: true, turn: data };
  } catch (error) {
    console.error('saveTurn error:', error);
    return { success: false, error: error.message };
  }
};
