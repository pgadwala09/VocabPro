// Turn Engine Client Service
// Handles communication with the server-side turn engine

export interface TurnEngineConfig {
  maxTurns?: number;
  timePerTurn?: number; // in seconds
}

export interface TurnData {
  transcript?: string;
  audioUrl?: string;
  duration?: number;
  [key: string]: any;
}

export interface DebateState {
  id: string;
  currentTurn: number;
  maxTurns: number;
  timePerTurn: number;
  currentSpeaker: 'user_pro' | 'ai_con';
  turnState: 'waiting' | 'speaking' | 'complete' | 'skipped';
  startTime: number;
  turnStartTime: number | null;
  isActive: boolean;
  turns: any[];
  config: TurnEngineConfig;
}

export interface DebateStats {
  debateId: string;
  currentTurn: number;
  maxTurns: number;
  isActive: boolean;
  currentSpeaker: 'user_pro' | 'ai_con';
  turnState: 'waiting' | 'speaking' | 'complete' | 'skipped';
  timeRemaining: number;
  completedTurns: number;
  skippedTurns: number;
  totalDuration: number;
  averageTurnDuration: number;
}

class TurnEngineClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3003') {
    this.baseUrl = baseUrl;
  }

  // Initialize a new debate
  async initializeDebate(debateId: string, config: TurnEngineConfig = {}): Promise<{ message: string; debate: DebateState }> {
    const response = await fetch(`${this.baseUrl}/api/debate/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ debateId, config }),
    });

    if (!response.ok) {
      throw new Error(`Failed to initialize debate: ${response.statusText}`);
    }

    return response.json();
  }

  // Get current debate state
  async getDebateState(debateId: string): Promise<{ debate: DebateState }> {
    const response = await fetch(`${this.baseUrl}/api/debate/${debateId}/state`);

    if (!response.ok) {
      throw new Error(`Failed to get debate state: ${response.statusText}`);
    }

    return response.json();
  }

  // Get debate statistics
  async getDebateStats(debateId: string): Promise<{ stats: DebateStats }> {
    const response = await fetch(`${this.baseUrl}/api/debate/${debateId}/stats`);

    if (!response.ok) {
      throw new Error(`Failed to get debate stats: ${response.statusText}`);
    }

    return response.json();
  }

  // Start speaking
  async startSpeaking(debateId: string): Promise<{ message: string; debate: DebateState }> {
    const response = await fetch(`${this.baseUrl}/api/debate/${debateId}/start-speaking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`Failed to start speaking: ${response.statusText}`);
    }

    return response.json();
  }

  // Complete turn
  async completeTurn(debateId: string, turnData: TurnData = {}): Promise<{ message: string; debate: DebateState }> {
    const response = await fetch(`${this.baseUrl}/api/debate/${debateId}/complete-turn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(turnData),
    });

    if (!response.ok) {
      throw new Error(`Failed to complete turn: ${response.statusText}`);
    }

    return response.json();
  }

  // Check if user can speak
  async canUserSpeak(debateId: string, userId: string): Promise<{ canSpeak: boolean; timeRemaining: number; debate: DebateState }> {
    const response = await fetch(`${this.baseUrl}/api/debate/${debateId}/can-speak/${userId}`);

    if (!response.ok) {
      throw new Error(`Failed to check user speaking permission: ${response.statusText}`);
    }

    return response.json();
  }

  // Check if AI can speak
  async canAISpeak(debateId: string): Promise<{ canSpeak: boolean; timeRemaining: number; debate: DebateState }> {
    const response = await fetch(`${this.baseUrl}/api/debate/${debateId}/ai-can-speak`);

    if (!response.ok) {
      throw new Error(`Failed to check AI speaking permission: ${response.statusText}`);
    }

    return response.json();
  }

  // Pause debate
  async pauseDebate(debateId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/api/debate/${debateId}/pause`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to pause debate: ${response.statusText}`);
    }

    return response.json();
  }

  // Resume debate
  async resumeDebate(debateId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/api/debate/${debateId}/resume`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to resume debate: ${response.statusText}`);
    }

    return response.json();
  }

  // Force end debate
  async endDebate(debateId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/api/debate/${debateId}/end`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to end debate: ${response.statusText}`);
    }

    return response.json();
  }

  // Get all active debates
  async getActiveDebates(): Promise<{ debates: DebateState[] }> {
    const response = await fetch(`${this.baseUrl}/api/debates/active`);

    if (!response.ok) {
      throw new Error(`Failed to get active debates: ${response.statusText}`);
    }

    return response.json();
  }

  // Poll debate state (for real-time updates)
  async pollDebateState(debateId: string, interval: number = 1000): Promise<DebateState> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const { debate } = await this.getDebateState(debateId);
          resolve(debate);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  // Watch debate state changes
  watchDebateState(debateId: string, callback: (debate: DebateState) => void, interval: number = 1000): () => void {
    let lastState: string | null = null;
    let isWatching = true;

    const watch = async () => {
      if (!isWatching) return;

      try {
        const { debate } = await this.getDebateState(debateId);
        const currentState = JSON.stringify(debate);

        if (currentState !== lastState) {
          lastState = currentState;
          callback(debate);
        }
      } catch (error) {
        console.error('Error watching debate state:', error);
      }

      if (isWatching) {
        setTimeout(watch, interval);
      }
    };

    watch();

    // Return cleanup function
    return () => {
      isWatching = false;
    };
  }

  // Format time remaining
  formatTimeRemaining(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Get speaker display name
  getSpeakerDisplayName(speaker: 'user_pro' | 'ai_con'): string {
    return speaker === 'user_pro' ? 'PRO (You)' : 'CON (AI)';
  }

  // Get turn state display name
  getTurnStateDisplayName(state: 'waiting' | 'speaking' | 'complete' | 'skipped'): string {
    switch (state) {
      case 'waiting': return 'Waiting to speak';
      case 'speaking': return 'Speaking';
      case 'complete': return 'Completed';
      case 'skipped': return 'Skipped';
      default: return 'Unknown';
    }
  }
}

// Create singleton instance
const turnEngineClient = new TurnEngineClient();

export default turnEngineClient;

