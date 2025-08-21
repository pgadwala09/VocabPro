# N8n and Supabase Integration Setup Guide

This guide will help you set up the integration between your VocabPro application and n8n workflows with Supabase as the database backend.

## Prerequisites

- Node.js and npm installed
- n8n instance running (local or cloud)
- Supabase project created
- Google OAuth credentials (for n8n workflows)

## 1. Environment Variables Setup

Create a `.env` file in your project root with the following variables:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# N8n Configuration
REACT_APP_N8N_BASE_URL=http://localhost:5678
REACT_APP_N8N_API_KEY=your_n8n_api_key
REACT_APP_N8N_WEBHOOK_SECRET=your_webhook_secret
```

## 2. Supabase Database Setup

Run the following SQL in your Supabase SQL editor to create the required tables:

```sql
-- Create debate_sessions table
CREATE TABLE debate_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  participants TEXT[] NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  n8n_execution_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create debate_messages table
CREATE TABLE debate_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES debate_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'ai', 'moderator')),
  n8n_execution_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create debate_history table for storing individual debate exchanges
CREATE TABLE debate_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  user_message TEXT NOT NULL,
  agent_response TEXT NOT NULL,
  audio_url TEXT,
  history_updated BOOLEAN DEFAULT false,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE debate_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_messages ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication needs)
CREATE POLICY "Allow public read access to debate_sessions" ON debate_sessions
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to debate_sessions" ON debate_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to debate_messages" ON debate_messages
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to debate_messages" ON debate_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to debate_history" ON debate_history
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to debate_history" ON debate_history
  FOR INSERT WITH CHECK (true);
```

## 3. N8n Workflow Setup

### 3.1 Create Debate Session Workflow

1. Create a new workflow in n8n
2. Add a **Webhook** trigger node
3. Configure the webhook URL: `/webhook/create-debate-session`
4. Add a **Supabase** node to insert the session data
5. Add an **HTTP Request** node to call your application's callback

### 3.2 Process Debate Message Workflow

1. Create a new workflow in n8n
2. Add a **Webhook** trigger node
3. Configure the webhook URL: `/webhook/process-debate-message`
4. Add an **OpenAI** node for AI processing
5. Add a **Supabase** node to store the processed message

### 3.3 Generate AI Response Workflow

1. Create a new workflow in n8n
2. Add a **Webhook** trigger node
3. Configure the webhook URL: `/webhook/generate-ai-response`
4. Add an **OpenAI** node for response generation
5. Add a **Supabase** node to store the AI response

## 4. Google OAuth Setup for N8n

1. Upload the `google-oauth-credentials.json` file to your n8n instance
2. Configure Google service nodes in your workflows using these credentials
3. Set up authentication for Google services (Gmail, Google Drive, etc.)

## 5. Usage Examples

### Basic Integration Usage

```typescript
import { debateIntegration } from './lib/debateIntegration';

// Create a new debate session
const session = await debateIntegration.createDebateSession(
  'Should AI be regulated?',
  ['user1', 'user2', 'user3']
);

// Send a message
const message = await debateIntegration.sendDebateMessage(
  session.id,
  'user1',
  'I believe AI regulation is necessary for safety.'
);

// Get AI response
const aiResponse = await debateIntegration.getAIResponse(
  session.id,
  'Context about the current debate topic'
);

// Subscribe to real-time messages
const subscription = debateIntegration.subscribeToDebateMessages(
  session.id,
  (message) => {
    console.log('New message:', message);
  }
);

// Cleanup subscription
debateIntegration.unsubscribeFromDebateMessages(subscription);
```

### React Component Integration

```typescript
import React, { useEffect, useState } from 'react';
import { debateIntegration, DebateSession, DebateMessage } from './lib/debateIntegration';

const DebateComponent: React.FC = () => {
  const [sessions, setSessions] = useState<DebateSession[]>([]);
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [currentSession, setCurrentSession] = useState<string>('');

  useEffect(() => {
    // Load active sessions
    debateIntegration.getActiveDebateSessions()
      .then(setSessions)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!currentSession) return;

    // Load messages for current session
    debateIntegration.getDebateMessages(currentSession)
      .then(setMessages)
      .catch(console.error);

    // Subscribe to real-time updates
    const subscription = debateIntegration.subscribeToDebateMessages(
      currentSession,
      (message) => {
        setMessages(prev => [...prev, message]);
      }
    );

    return () => {
      debateIntegration.unsubscribeFromDebateMessages(subscription);
    };
  }, [currentSession]);

  const handleSendMessage = async (content: string) => {
    if (!currentSession) return;
    
    try {
      await debateIntegration.sendDebateMessage(currentSession, 'current-user', content);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div>
      {/* Your debate UI components */}
    </div>
  );
};
```

## 6. Testing the Integration

### 6.1 Test N8n Connection

```typescript
import { debateIntegration } from './lib/debateIntegration';

// Test workflow listing
const workflows = await debateIntegration.n8nAPI.listWorkflows();
console.log('Available workflows:', workflows);
```

### 6.2 Test Supabase Connection

```typescript
import { supabase } from './lib/debateIntegration';

// Test connection
const { data, error } = await supabase
  .from('debate_sessions')
  .select('*')
  .limit(1);

if (error) {
  console.error('Supabase connection error:', error);
} else {
  console.log('Supabase connection successful');
}
```

## 7. Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your n8n instance allows requests from your React app
2. **Authentication Errors**: Check your Supabase and n8n API keys
3. **Webhook Failures**: Verify webhook URLs and payload formats
4. **Real-time Issues**: Check Supabase real-time configuration

### Debug Mode

Enable debug logging by setting:

```typescript
localStorage.setItem('debug', 'debate-integration:*');
```

## 8. Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **Webhook Security**: Use webhook secrets for n8n webhooks
3. **RLS Policies**: Configure appropriate Row Level Security in Supabase
4. **Input Validation**: Validate all user inputs before processing

## 9. Performance Optimization

1. **Connection Pooling**: Reuse Supabase connections
2. **Caching**: Cache frequently accessed data
3. **Batch Operations**: Use batch operations for multiple records
4. **Real-time Optimization**: Limit real-time subscriptions to active sessions

## 10. Next Steps

1. Set up your n8n workflows using the provided templates
2. Configure your Supabase database with the provided schema
3. Test the integration with the provided examples
4. Customize the integration based on your specific requirements
5. Deploy and monitor the integration in production

For additional support, refer to:
- [N8n Documentation](https://docs.n8n.io/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://reactjs.org/docs/)
