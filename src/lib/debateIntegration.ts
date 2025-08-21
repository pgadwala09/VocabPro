import axios, { AxiosResponse } from 'axios';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types for n8n workflow integration
export interface N8nWorkflowExecution {
  id: string;
  status: 'running' | 'completed' | 'failed';
  data?: any;
  error?: string;
}

export interface DebateSession {
  id: string;
  title: string;
  participants: string[];
  status: 'pending' | 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface DebateMessage {
  id: string;
  session_id: string;
  user_id: string;
  content: string;
  timestamp: string;
  role: 'user' | 'ai' | 'moderator';
}

// Configuration
const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL || 'http://localhost:5678';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize Supabase client
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// N8n API client
class N8nAPI {
  private baseURL: string;
  private apiKey?: string;

  constructor(baseURL: string, apiKey?: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.apiKey) {
      headers['X-N8N-API-KEY'] = this.apiKey;
    }
    
    return headers;
  }

  // Trigger a workflow execution
  async triggerWorkflow(workflowId: string, data: any): Promise<N8nWorkflowExecution> {
    try {
      const response: AxiosResponse = await axios.post(
        `${this.baseURL}/webhook/${workflowId}`,
        data,
        { headers: this.getHeaders() }
      );
      
      return {
        id: response.data.executionId || Date.now().toString(),
        status: 'completed',
        data: response.data
      };
    } catch (error) {
      console.error('Error triggering n8n workflow:', error);
      return {
        id: Date.now().toString(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get workflow execution status
  async getExecutionStatus(executionId: string): Promise<N8nWorkflowExecution> {
    try {
      const response: AxiosResponse = await axios.get(
        `${this.baseURL}/api/v1/executions/${executionId}`,
        { headers: this.getHeaders() }
      );
      
      return {
        id: executionId,
        status: response.data.status,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error getting execution status:', error);
      return {
        id: executionId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // List available workflows
  async listWorkflows(): Promise<any[]> {
    try {
      const response: AxiosResponse = await axios.get(
        `${this.baseURL}/api/v1/workflows`,
        { headers: this.getHeaders() }
      );
      
      return response.data.data || [];
    } catch (error) {
      console.error('Error listing workflows:', error);
      return [];
    }
  }
}

// Debate integration service
export class DebateIntegrationService {
  private n8nAPI: N8nAPI;

  constructor(n8nBaseURL?: string, n8nApiKey?: string) {
    this.n8nAPI = new N8nAPI(n8nBaseURL || N8N_BASE_URL, n8nApiKey);
  }

  // Create a new debate session
  async createDebateSession(title: string, participants: string[]): Promise<DebateSession> {
    try {
      // Trigger n8n workflow to create debate session
      const workflowData = {
        title,
        participants,
        timestamp: new Date().toISOString()
      };

      const execution = await this.n8nAPI.triggerWorkflow('create-debate-session', workflowData);
      
      if (execution.status === 'failed') {
        throw new Error(execution.error || 'Failed to create debate session');
      }

      // Store in Supabase
      const { data, error } = await supabase
        .from('debate_sessions')
        .insert({
          title,
          participants,
          status: 'pending',
          n8n_execution_id: execution.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating debate session:', error);
      throw error;
    }
  }

  // Send a message to the debate
  async sendDebateMessage(sessionId: string, userId: string, content: string): Promise<DebateMessage> {
    try {
      // Trigger n8n workflow for message processing
      const workflowData = {
        sessionId,
        userId,
        content,
        timestamp: new Date().toISOString()
      };

      const execution = await this.n8nAPI.triggerWorkflow('process-debate-message', workflowData);
      
      if (execution.status === 'failed') {
        throw new Error(execution.error || 'Failed to process message');
      }

      // Store message in Supabase
      const { data, error } = await supabase
        .from('debate_messages')
        .insert({
          session_id: sessionId,
          user_id: userId,
          content,
          role: 'user',
          n8n_execution_id: execution.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending debate message:', error);
      throw error;
    }
  }

  // Get debate session messages
  async getDebateMessages(sessionId: string): Promise<DebateMessage[]> {
    try {
      const { data, error } = await supabase
        .from('debate_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting debate messages:', error);
      throw error;
    }
  }

  // Get active debate sessions
  async getActiveDebateSessions(): Promise<DebateSession[]> {
    try {
      const { data, error } = await supabase
        .from('debate_sessions')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting active debate sessions:', error);
      throw error;
    }
  }

  // Update debate session status
  async updateDebateSessionStatus(sessionId: string, status: DebateSession['status']): Promise<void> {
    try {
      const { error } = await supabase
        .from('debate_sessions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating debate session status:', error);
      throw error;
    }
  }

  // Get AI response for debate
  async getAIResponse(sessionId: string, context: string): Promise<string> {
    try {
      const workflowData = {
        sessionId,
        context,
        timestamp: new Date().toISOString()
      };

      const execution = await this.n8nAPI.triggerWorkflow('generate-ai-response', workflowData);
      
      if (execution.status === 'failed') {
        throw new Error(execution.error || 'Failed to generate AI response');
      }

      // Store AI response in Supabase
      const { error } = await supabase
        .from('debate_messages')
        .insert({
          session_id: sessionId,
          user_id: 'ai-moderator',
          content: execution.data?.response || 'AI response generated',
          role: 'ai',
          n8n_execution_id: execution.id
        });

      if (error) throw error;
      
      return execution.data?.response || 'AI response generated';
    } catch (error) {
      console.error('Error getting AI response:', error);
      throw error;
    }
  }

  // Real-time subscription to debate messages
  subscribeToDebateMessages(sessionId: string, callback: (message: DebateMessage) => void) {
    return supabase
      .channel(`debate-messages-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'debate_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          callback(payload.new as DebateMessage);
        }
      )
      .subscribe();
  }

  // Cleanup subscription
  unsubscribeFromDebateMessages(subscription: any) {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  }
}

// Export singleton instance
export const debateIntegration = new DebateIntegrationService();

// Utility functions for environment setup
export const setupEnvironment = () => {
  // Validate environment variables
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase environment variables not configured');
  }
  
  if (!N8N_BASE_URL) {
    console.warn('N8N base URL not configured, using default localhost');
  }
  
  console.log('Debate integration environment setup complete');
};

import { generateDebateResponse, generateFallbackResponse } from './openai-integration';

// Initialize environment on module load
setupEnvironment();

// Enhanced debate request function with direct OpenAI integration
export async function sendDebateRequest(userId: string, debateTopic: string, userMessage: string) {
  console.log('Sending debate request:', { userId, debateTopic, userMessage });
  
  try {
    // Try to use OpenAI directly first
    if (import.meta.env.VITE_OPENAI_API_KEY) {
      console.log('Using OpenAI API for response generation');
      const aiResponse = await generateDebateResponse(userMessage, debateTopic);
      
      const response = {
        agent_text: aiResponse,
        audio_url: undefined,
        history_updated: true
      };
      
      // Store the debate exchange in Supabase
      await storeDebateExchange(userId, debateTopic, userMessage, response);
      
      return response;
    }
    
    // Fallback to n8n if OpenAI is not available
    if (import.meta.env.VITE_N8N_BASE_URL) {
      console.log('Using N8n webhook for response generation');
      const webhookUrl = `${N8N_BASE_URL}/webhook/debate`;
      const auth = { 
        username: import.meta.env.VITE_N8N_USERNAME || 'debate_user', 
        password: import.meta.env.VITE_N8N_PASSWORD || 'debate_pass' 
      };

      const response = await axios.post(webhookUrl, {
        user_id: userId,
        debate_topic: debateTopic,
        user_message: userMessage,
        timestamp: new Date().toISOString()
      }, { auth });

      console.log('N8n debate response:', response.data);
      
      // Store the debate exchange in Supabase
      await storeDebateExchange(userId, debateTopic, userMessage, response.data);
      
      return response.data;
    }
    
    // Final fallback - generate a response without external services
    console.log('Using fallback response generator');
    const fallbackResponse = generateFallbackResponse(userMessage, debateTopic);
    
    const response = {
      agent_text: fallbackResponse,
      audio_url: undefined,
      history_updated: false
    };
    
    // Store the debate exchange in Supabase
    await storeDebateExchange(userId, debateTopic, userMessage, response);
    
    return response;
    
  } catch (error) {
    console.error('Debate request error:', error);
    
    // Emergency fallback response
    const emergencyResponse = generateFallbackResponse(userMessage, debateTopic);
    
    return {
      agent_text: emergencyResponse,
      audio_url: undefined,
      history_updated: false
    };
  }
}

// Fetch debate history from Supabase
export async function fetchDebateHistory(userId: string, debateTopic?: string) {
  try {
    let query = supabase
      .from('debate_history')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (debateTopic) {
      query = query.eq('topic', debateTopic);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error('Error fetching debate history:', error);
      throw error;
    }

    console.log('Debate history fetched:', data);
    return data || [];
  } catch (error) {
    console.error('Failed to fetch debate history:', error);
    throw error;
  }
}

// Store debate exchange in Supabase
async function storeDebateExchange(userId: string, topic: string, userMessage: string, response: any) {
  try {
    const { error } = await supabase
      .from('debate_history')
      .insert({
        user_id: userId,
        topic: topic,
        user_message: userMessage,
        agent_response: response.agent_text,
        audio_url: response.audio_url,
        history_updated: response.history_updated,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('Error storing debate exchange:', error);
      throw error;
    }

    console.log('Debate exchange stored successfully');
  } catch (error) {
    console.error('Failed to store debate exchange:', error);
    // Don't throw here to avoid breaking the main flow
  }
}

// Get debate statistics for a user
export async function getDebateStats(userId: string) {
  try {
    const { data, error } = await supabase
      .from('debate_history')
      .select('topic, timestamp')
      .eq('user_id', userId);

    if (error) throw error;

    const stats = {
      totalExchanges: data?.length || 0,
      uniqueTopics: new Set(data?.map(item => item.topic)).size,
      lastActivity: data?.[0]?.timestamp || null,
      topics: [...new Set(data?.map(item => item.topic) || [])]
    };

    return stats;
  } catch (error) {
    console.error('Error fetching debate stats:', error);
    throw error;
  }
}

// Search debate history
export async function searchDebateHistory(userId: string, searchTerm: string) {
  try {
    const { data, error } = await supabase
      .from('debate_history')
      .select('*')
      .eq('user_id', userId)
      .or(`user_message.ilike.%${searchTerm}%,agent_response.ilike.%${searchTerm}%,topic.ilike.%${searchTerm}%`)
      .order('timestamp', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching debate history:', error);
    throw error;
  }
}

// Example usage (commented out to avoid auto-execution)
// sendDebateRequest('cursor_user', 'AI benefits society', 'AI improves productivity')
//   .then(data => console.log(data))
//   .catch(err => console.error(err));
