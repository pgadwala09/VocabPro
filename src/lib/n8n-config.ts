// N8n Integration Configuration
export interface N8nConfig {
  baseURL: string;
  apiKey?: string;
  webhookSecret?: string;
  workflows: {
    createDebateSession: string;
    processDebateMessage: string;
    generateAIResponse: string;
    [key: string]: string;
  };
}

// Default configuration
export const defaultN8nConfig: N8nConfig = {
  baseURL: process.env.REACT_APP_N8N_BASE_URL || 'http://localhost:5678',
  apiKey: process.env.REACT_APP_N8N_API_KEY,
  webhookSecret: process.env.REACT_APP_N8N_WEBHOOK_SECRET,
  workflows: {
    createDebateSession: 'create-debate-session',
    processDebateMessage: 'process-debate-message',
    generateAIResponse: 'generate-ai-response',
  }
};

// Environment validation
export const validateN8nConfig = (config: N8nConfig): string[] => {
  const errors: string[] = [];
  
  if (!config.baseURL) {
    errors.push('N8N base URL is required');
  }
  
  if (!config.apiKey) {
    console.warn('N8N API key not provided - some features may be limited');
  }
  
  return errors;
};

// Get configuration with validation
export const getN8nConfig = (): N8nConfig => {
  const config = { ...defaultN8nConfig };
  const errors = validateN8nConfig(config);
  
  if (errors.length > 0) {
    console.error('N8N configuration errors:', errors);
  }
  
  return config;
};
