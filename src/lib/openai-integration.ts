import axios from 'axios';

// Direct OpenAI integration for debate responses
export async function generateDebateResponse(userMessage: string, topic: string): Promise<string> {
  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an intelligent debate partner. Engage in thoughtful discussions about various topics. 
            Be respectful, provide well-reasoned arguments, and encourage critical thinking. 
            Keep responses concise but insightful (2-3 sentences).`
          },
          {
            role: 'user',
            content: `Topic: ${topic}\nUser message: ${userMessage}\n\nPlease provide a thoughtful response to continue this debate.`
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate AI response');
  }
}

// Fallback response generator
export function generateFallbackResponse(userMessage: string, topic: string): string {
  const responses = [
    `That's an interesting point about ${topic}! I'd love to explore this further. What specific aspects of ${topic} are you most passionate about?`,
    `Great question regarding ${topic}! I think we should consider both the benefits and challenges. What's your perspective on the practical implications?`,
    `I appreciate your thoughts on ${topic}. This is definitely a complex issue that deserves careful consideration. What factors do you think are most important?`,
    `Excellent point about ${topic}! I believe this discussion could benefit from looking at it from multiple angles. What other viewpoints should we consider?`,
    `That's a compelling argument about ${topic}! I'm curious to hear more about your reasoning. What evidence or experiences led you to this conclusion?`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}
