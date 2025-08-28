// Grok AI integration for content generation
// Updated with correct Grok API endpoints and configuration

export interface GrokResponse {
  content: string;
  title?: string;
  error?: string;
}

// Grok AI content generation function
export async function generateGrokContent(
  topic: string,
  ageGroup: string,
  proficiencyLevel: string,
  baseContent?: string
): Promise<GrokResponse | null> {
  const apiKey = import.meta.env.VITE_GROK_API_KEY as string | undefined;
  const proxy = import.meta.env.VITE_GROK_PROXY as string | undefined;
  
  if (!apiKey && !proxy) {
    console.warn('Grok API key not configured');
    return null;
  }

  try {
    // Use proxy if available, otherwise use the correct Grok API endpoint
    const url = proxy || 'https://api.x.ai/v1/chat/completions';
    
    const systemPrompt = `You are an expert ESL content creator specializing in creating engaging, age-appropriate educational content. 
    
Your task is to create comprehensive, structured content that includes:
1. An engaging introduction that hooks the reader
2. Clear explanations suitable for the specified age group and proficiency level
3. Interactive elements and activities
4. Key takeaways and summary points

Write in a warm, encouraging tone that motivates learning. Use analogies, examples, and creative elements that make complex topics accessible.`;

    const userPrompt = `Create educational content about: ${topic}

Target Audience:
- Age Group: ${ageGroup}
- Proficiency Level: ${proficiencyLevel}
${baseContent ? `\nBase Information: ${baseContent.slice(0, 2000)}` : ''}

Please create comprehensive content that includes:
- An engaging introduction
- Main content sections with clear explanations
- Interactive elements or activities
- Key takeaways
- A conclusion that reinforces learning

Make the content engaging, educational, and appropriate for the specified age group and proficiency level.`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey || '',
        ...(proxy ? {} : { 'Authorization': `Bearer ${apiKey}` }),
      },
      body: JSON.stringify({
        model: 'grok-2',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: false,
      }),
    });

    if (!response.ok) {
      console.error('Grok API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Grok API error details:', errorText);
      return null;
    }

    const data = await response.json();
    console.log('Grok API response:', data);
    
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in Grok API response');
      return null;
    }

    return {
      content,
      title: topic,
    };

  } catch (error) {
    console.error('Grok API request failed:', error);
    return null;
  }
}

// Grok AI for creative content generation (more creative/fun approach)
export async function generateGrokCreativeContent(
  topic: string,
  ageGroup: string,
  proficiencyLevel: string
): Promise<GrokResponse | null> {
  const apiKey = import.meta.env.VITE_GROK_API_KEY as string | undefined;
  const proxy = import.meta.env.VITE_GROK_PROXY as string | undefined;
  
  if (!apiKey && !proxy) {
    return null;
  }

  try {
    const url = proxy || 'https://api.x.ai/v1/chat/completions';
    
    const systemPrompt = `You are a creative storyteller and educator who makes learning fun and engaging. 
    
Create content that:
- Uses storytelling and narrative elements
- Includes humor and fun facts
- Makes complex topics accessible through analogies
- Encourages curiosity and exploration
- Uses interactive elements and thought-provoking questions`;

    const userPrompt = `Create a fun, creative educational piece about: ${topic}

For: ${ageGroup} students at ${proficiencyLevel} level

Make it:
- Engaging and entertaining
- Educational and informative
- Interactive with questions or activities
- Memorable with creative analogies or stories
- Age-appropriate and accessible

Include:
- A catchy introduction
- Main content with creative explanations
- Fun facts or interesting details
- Interactive elements
- A memorable conclusion`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey || '',
        ...(proxy ? {} : { 'Authorization': `Bearer ${apiKey}` }),
      },
      body: JSON.stringify({
        model: 'grok-2',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 1800,
        stream: false,
      }),
    });

    if (!response.ok) {
      console.error('Grok Creative API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Grok Creative API error details:', errorText);
      return null;
    }

    const data = await response.json();
    console.log('Grok Creative API response:', data);
    
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in Grok Creative API response');
      return null;
    }

    return {
      content,
      title: `Creative Guide: ${topic}`,
    };

  } catch (error) {
    console.error('Grok creative content generation failed:', error);
    return null;
  }
}

// Test Grok API connection
export async function testGrokConnection(): Promise<boolean> {
  const apiKey = import.meta.env.VITE_GROK_API_KEY as string | undefined;
  const proxy = import.meta.env.VITE_GROK_PROXY as string | undefined;
  
  if (!apiKey && !proxy) {
    console.warn('Grok API key not configured');
    return false;
  }

  try {
    const url = proxy || 'https://api.x.ai/v1/chat/completions';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey || '',
        ...(proxy ? {} : { 'Authorization': `Bearer ${apiKey}` }),
      },
      body: JSON.stringify({
        model: 'grok-2',
        messages: [
          { role: 'user', content: 'Hello, this is a test message.' }
        ],
        max_tokens: 10,
        stream: false,
      }),
    });

    if (response.ok) {
      console.log('✅ Grok API connection successful');
      return true;
    } else {
      console.error('❌ Grok API connection failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Grok API connection error:', error);
    return false;
  }
}

// Fallback function when Grok is not available
export function isGrokAvailable(): boolean {
  return !!(import.meta.env.VITE_GROK_API_KEY || import.meta.env.VITE_GROK_PROXY);
}
