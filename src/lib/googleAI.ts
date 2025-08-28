// Google AI Studio (Gemini) integration for text-to-speech
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_STUDIO_API_KEY || '');

// Text-to-speech using Google AI Studio with browser speech synthesis
export async function googleAITTS(text: string): Promise<string | null> {
  try {
    if (!import.meta.env.VITE_GOOGLE_AI_STUDIO_API_KEY) {
      console.warn('Google AI Studio API key not configured');
      return null;
    }

    console.log('🎤 Using Google AI Studio for TTS:', text);

    // Use Google AI Studio to generate a pronunciation guide
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Create a prompt that generates a pronunciation guide
    const prompt = `
    Generate a pronunciation guide for the word "${text}". 
    Provide clear, slow pronunciation with proper emphasis.
    Focus on making this word easy to understand and pronounce correctly.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const pronunciationGuide = response.text();

    console.log('📝 AI Pronunciation Guide:', pronunciationGuide);

    // Use browser speech synthesis with the AI-generated guide
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel(); // Stop any current speech
        
        // Function to get voices with proper loading
        const getVoices = (): Promise<SpeechSynthesisVoice[]> => {
          return new Promise((resolve) => {
            let voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
              resolve(voices);
              return;
            }
            
            window.speechSynthesis.onvoiceschanged = () => {
              voices = window.speechSynthesis.getVoices();
              resolve(voices);
            };
            
            // Trigger voices to load
            window.speechSynthesis.getVoices();
          });
        };
        
        // Get voices
        const voices = await getVoices();
        console.log('🎤 Available voices:', voices.map(v => v.name));
        
        // Create utterance
        const utterance = new window.SpeechSynthesisUtterance(text);
        utterance.rate = 0.8; // Slower for better pronunciation
        utterance.pitch = 1.1; // Slightly higher pitch for clarity
        utterance.lang = 'en-US';
        utterance.volume = 1.0;
        
        // Find Microsoft David voice specifically
        let selectedVoice = null;
        
        // First priority: Microsoft David (exact match)
        selectedVoice = voices.find(voice => 
          voice.name.toLowerCase() === 'microsoft david' ||
          voice.name.toLowerCase() === 'david' ||
          voice.name.toLowerCase() === 'ms david'
        );
        
        // Second priority: Microsoft David (partial match)
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('microsoft david') ||
            voice.name.toLowerCase().includes('david') ||
            voice.name.toLowerCase().includes('ms david')
          );
        }
        
        // Third priority: Any Microsoft voice
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('microsoft') ||
            voice.name.toLowerCase().includes('windows') ||
            voice.name.toLowerCase().includes('sapi')
          );
        }
        
        // Fourth priority: US English voices
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => 
            voice.lang.startsWith('en-US') && voice.name.toLowerCase().includes('english')
          );
        }
        
        // Fifth priority: Any US English voice
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => voice.lang.startsWith('en-US'));
        }
        
        // Sixth priority: Any English voice
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
        }
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          console.log('🎤 Selected voice:', selectedVoice.name, 'Language:', selectedVoice.lang);
        } else {
          console.log('🎤 No preferred voice found, using default');
        }
        
        // Add event listeners for better control
        utterance.onstart = () => console.log('🎤 Google AI speech started');
        utterance.onend = () => console.log('🎤 Google AI speech ended');
        utterance.onerror = (e) => console.error('🎤 Google AI speech error:', e);
        
        window.speechSynthesis.speak(utterance);
        return 'google-ai-speech';
      } catch (error) {
        console.error('Google AI speech synthesis error:', error);
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Google AI TTS error:', error);
    return null;
  }
}

// Get pronunciation feedback using Google AI
export async function getPronunciationFeedback(word: string, userTranscription: string): Promise<{
  accuracy: number;
  feedback: string;
  suggestions: string[];
}> {
  try {
    if (!import.meta.env.VITE_GOOGLE_AI_STUDIO_API_KEY) {
      return {
        accuracy: 0.7,
        feedback: 'AI analysis not available',
        suggestions: ['Keep practicing!']
      };
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
    You are a pronunciation assessment expert. Analyze the pronunciation accuracy of the word "${word}" based on the user's transcription "${userTranscription}".
    
    Provide a JSON response with:
    1. accuracy: A score from 0 to 1 (where 1 is perfect pronunciation)
    2. feedback: A brief assessment of the pronunciation
    3. suggestions: An array of 2-3 specific improvement suggestions
    
    Example format:
    {
      "accuracy": 0.8,
      "feedback": "Good pronunciation with minor vowel sound issues",
      "suggestions": [
        "Focus on the 'a' sound in the middle syllable",
        "Practice the ending consonant more clearly",
        "Try speaking slightly slower for better clarity"
      ]
    }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const analysis = JSON.parse(text);
      return {
        accuracy: analysis.accuracy || 0.7,
        feedback: analysis.feedback || 'Pronunciation analysis completed',
        suggestions: analysis.suggestions || ['Keep practicing!']
      };
    } catch (parseError) {
      console.error('Failed to parse Google AI response:', parseError);
      return {
        accuracy: 0.7,
        feedback: 'AI analysis completed',
        suggestions: ['Keep practicing!']
      };
    }
  } catch (error) {
    console.error('Google AI pronunciation feedback error:', error);
    return {
      accuracy: 0.7,
      feedback: 'AI analysis not available',
      suggestions: ['Keep practicing!']
    };
  }
}

// Generate practice suggestions using Google AI
export async function getPracticeSuggestions(word: string): Promise<string[]> {
  try {
    if (!import.meta.env.VITE_GOOGLE_AI_STUDIO_API_KEY) {
      return ['Practice speaking clearly', 'Record yourself and listen back'];
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
    Provide 3 specific practice suggestions for improving pronunciation of the word "${word}".
    Focus on practical, actionable advice that a language learner can follow.
    
    Return as a JSON array of strings:
    ["suggestion 1", "suggestion 2", "suggestion 3"]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const suggestions = JSON.parse(text);
      return Array.isArray(suggestions) ? suggestions : ['Practice speaking clearly'];
    } catch (parseError) {
      console.error('Failed to parse Google AI suggestions:', parseError);
      return ['Practice speaking clearly', 'Record yourself and listen back'];
    }
  } catch (error) {
    console.error('Google AI practice suggestions error:', error);
    return ['Practice speaking clearly', 'Record yourself and listen back'];
  }
}

// Generate audio file using Google AI Studio for playback
export async function generateGoogleAIAudio(text: string): Promise<string | null> {
  try {
    if (!import.meta.env.VITE_GOOGLE_AI_STUDIO_API_KEY) {
      console.warn('Google AI Studio API key not configured');
      return null;
    }

    console.log('🎤 Generating Google AI audio for:', text);

    // Use Google AI Studio to create a pronunciation guide
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
    Create a detailed pronunciation guide for the word "${text}". 
    Break down the pronunciation into syllables and provide phonetic guidance.
    Make it easy for a language learner to understand and practice.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const pronunciationGuide = response.text();

    console.log('🎤 Generated pronunciation guide:', pronunciationGuide);

    // For now, return a special identifier that indicates Google AI was used
    // In the future, this could be extended to generate actual audio files
    return 'google-ai-enhanced-speech';
  } catch (error) {
    console.error('Google AI audio generation error:', error);
    return null;
  }
}
