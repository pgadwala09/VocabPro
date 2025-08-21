// Turn Engine - Orchestration and Auto-Advancement System
import { supabase } from './supabase-config.js';

class TurnEngine {
  constructor() {
    this.activeDebates = new Map(); // debateId -> { timer, state }
    this.sweepInterval = null;
    this.initSweepJob();
  }

  // Initialize the sweep job for auto-advancing overdue turns
  initSweepJob() {
    // Run sweep every 10 seconds
    this.sweepInterval = setInterval(() => {
      this.sweepOverdueTurns();
    }, 10000);
    
    console.log('[TurnEngine] Sweep job initialized - checking every 10 seconds');
  }

  // Auto-advance overdue turns
  async sweepOverdueTurns() {
    try {
      const now = new Date().toISOString();
      
      // Find all speaking turns that have expired
      const { data: overdueTurns, error } = await supabase
        .from('debate_turns')
        .select('*')
        .eq('state', 'speaking')
        .lt('ends_at', now);

      if (error) {
        console.error('[TurnEngine] Error fetching overdue turns:', error);
        return;
      }

      if (overdueTurns && overdueTurns.length > 0) {
        console.log(`[TurnEngine] Found ${overdueTurns.length} overdue turns`);
        
        for (const turn of overdueTurns) {
          await this.autoAdvanceTurn(turn);
        }
      }
    } catch (error) {
      console.error('[TurnEngine] Sweep job error:', error);
    }
  }

  // Auto-advance a specific turn
  async autoAdvanceTurn(turn) {
    try {
      console.log(`[TurnEngine] Auto-advancing turn ${turn.id} for debate ${turn.debate_id}`);
      
      // Mark turn as skipped
      await supabase
        .from('debate_turns')
        .update({ 
          state: 'skipped',
          transcript: turn.speaker === 'user_pro' ? 'Turn skipped - no input provided' : 'AI turn skipped'
        })
        .eq('id', turn.id);

      // Create next turn
      await this.createNextTurn(turn.debate_id, turn.speaker === 'user_pro' ? 'ai_con' : 'user_pro');
      
      console.log(`[TurnEngine] Turn ${turn.id} auto-advanced successfully`);
    } catch (error) {
      console.error(`[TurnEngine] Error auto-advancing turn ${turn.id}:`, error);
    }
  }

  // Initialize a new debate
  async initializeDebate(debateId, config) {
    try {
      console.log(`[TurnEngine] Initializing debate ${debateId}`);
      
      // Create initial turn for user_pro
      const initialTurn = await this.createNextTurn(debateId, 'user_pro');
      
      // Start the first turn
      await this.startSpeakingTurn(initialTurn.id, config.duration || 60);
      
      console.log(`[TurnEngine] Debate ${debateId} initialized with turn ${initialTurn.id}`);
      return { success: true, turn: initialTurn };
    } catch (error) {
      console.error(`[TurnEngine] Error initializing debate ${debateId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Create next turn
  async createNextTurn(debateId, speaker) {
    try {
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
          state: 'waiting'
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`[TurnEngine] Created turn ${data.id} for ${speaker} in debate ${debateId}`);
      return data;
    } catch (error) {
      console.error(`[TurnEngine] Error creating next turn:`, error);
      throw error;
    }
  }

  // Start speaking turn
  async startSpeakingTurn(turnId, duration = 60) {
    try {
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

      if (error) throw error;

      console.log(`[TurnEngine] Turn ${turnId} started speaking, ends at ${endsAt}`);
      return { success: true, endsAt };
    } catch (error) {
      console.error(`[TurnEngine] Error starting speaking turn ${turnId}:`, error);
      throw error;
    }
  }

  // Complete turn with data
  async completeTurn(turnId, turnData = {}) {
    try {
      const { error } = await supabase
        .from('debate_turns')
        .update({
          state: 'complete',
          transcript: turnData.transcript,
          audio_url: turnData.audioUrl,
          duration: turnData.duration
        })
        .eq('id', turnId);

      if (error) throw error;

      console.log(`[TurnEngine] Turn ${turnId} completed`);
      return { success: true };
    } catch (error) {
      console.error(`[TurnEngine] Error completing turn ${turnId}:`, error);
      throw error;
    }
  }

  // Advance to next turn
  async advanceTurn(debateId, currentTurnId) {
    try {
      // Get current turn to determine next speaker
      const { data: currentTurn, error: currentError } = await supabase
        .from('debate_turns')
        .select('speaker')
        .eq('id', currentTurnId)
        .single();

      if (currentError) throw currentError;

      // Determine next speaker
      const nextSpeaker = currentTurn.speaker === 'user_pro' ? 'ai_con' : 'user_pro';

      // Create next turn
      const nextTurn = await this.createNextTurn(debateId, nextSpeaker);

      // Start the next turn if it's AI's turn
      if (nextSpeaker === 'ai_con') {
        await this.startSpeakingTurn(nextTurn.id, 60); // Default 60 seconds for AI
      }

      console.log(`[TurnEngine] Advanced to turn ${nextTurn.id} for ${nextSpeaker}`);
      return { success: true, nextTurn };
    } catch (error) {
      console.error(`[TurnEngine] Error advancing turn:`, error);
      throw error;
    }
  }

  // Get current turn for a debate
  async getCurrentTurn(debateId) {
    try {
      const { data, error } = await supabase
        .from('debate_turns')
        .select('*')
        .eq('debate_id', debateId)
        .in('state', ['waiting', 'speaking'])
        .order('turn_number', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`[TurnEngine] Error getting current turn for debate ${debateId}:`, error);
      return null;
    }
  }

  // Check if user can speak
  async canUserSpeak(debateId, userId) {
    try {
      const currentTurn = await this.getCurrentTurn(debateId);
      if (!currentTurn) return false;

      return currentTurn.speaker === 'user_pro' && currentTurn.state === 'speaking';
    } catch (error) {
      console.error(`[TurnEngine] Error checking user speaking permission:`, error);
      return false;
    }
  }

  // Check if AI can speak
  async canAISpeak(debateId) {
    try {
      const currentTurn = await this.getCurrentTurn(debateId);
      if (!currentTurn) return false;

      return currentTurn.speaker === 'ai_con' && currentTurn.state === 'speaking';
    } catch (error) {
      console.error(`[TurnEngine] Error checking AI speaking permission:`, error);
      return false;
    }
  }

  // Trigger AI to speak
  async triggerAISpeak(debateId) {
    try {
      const currentTurn = await this.getCurrentTurn(debateId);
      if (!currentTurn || currentTurn.speaker !== 'ai_con') {
        throw new Error('Not AI turn');
      }

      // Start AI speaking turn if not already started
      if (currentTurn.state === 'waiting') {
        await this.startSpeakingTurn(currentTurn.id, 60);
      }

      console.log(`[TurnEngine] AI speaking triggered for debate ${debateId}`);
      return { success: true, turn: currentTurn };
    } catch (error) {
      console.error(`[TurnEngine] Error triggering AI speak:`, error);
      throw error;
    }
  }

  // Get debate statistics
  async getDebateStats(debateId) {
    try {
      const { data: turns, error } = await supabase
        .from('debate_turns')
        .select('*')
        .eq('debate_id', debateId)
        .order('turn_number', { ascending: true });

      if (error) throw error;

      const stats = {
        totalTurns: turns.length,
        completedTurns: turns.filter(t => t.state === 'complete').length,
        skippedTurns: turns.filter(t => t.state === 'skipped').length,
        userTurns: turns.filter(t => t.speaker === 'user_pro').length,
        aiTurns: turns.filter(t => t.speaker === 'ai_con').length,
        currentTurn: turns.find(t => ['waiting', 'speaking'].includes(t.state))
      };

      return stats;
    } catch (error) {
      console.error(`[TurnEngine] Error getting debate stats:`, error);
      throw error;
    }
  }

  // Cleanup when debate ends
  async cleanupDebate(debateId) {
    try {
      // Clear any active timers
      if (this.activeDebates.has(debateId)) {
        const debateData = this.activeDebates.get(debateId);
        if (debateData.timer) {
          clearTimeout(debateData.timer);
        }
        this.activeDebates.delete(debateId);
      }

      console.log(`[TurnEngine] Cleaned up debate ${debateId}`);
    } catch (error) {
      console.error(`[TurnEngine] Error cleaning up debate ${debateId}:`, error);
    }
  }

  // Stop the engine
  stop() {
    if (this.sweepInterval) {
      clearInterval(this.sweepInterval);
      this.sweepInterval = null;
    }
    console.log('[TurnEngine] Engine stopped');
  }
}

// Create singleton instance
const turnEngine = new TurnEngine();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('[TurnEngine] Shutting down gracefully...');
  turnEngine.stop();
  process.exit(0);
});

export default turnEngine;
