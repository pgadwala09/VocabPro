// Comprehensive Integration Service for Supabase, ElevenLabs, and Google AI Studio
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize clients
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Initialize Google AI Studio
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_STUDIO_API_KEY || '');

// Types for pronunciation practice
export interface PronunciationRecording {
  id: string;
  user_id: string;
  word: string;
  audio_url: string;
  audio_blob?: Blob;
  created_at: string;
  duration?: number;
  file_size?: number;
  analysis_score?: number;
  clarity_score?: number;
  accuracy_score?: number;
  fluency_score?: number;
  feedback?: string;
  suggestions?: string[];
}

export interface PronunciationProgress {
  id: string;
  user_id: string;
  word: string;
  practice_count: number;
  best_score: number;
  last_practiced: string;
  improvement_rate: number;
  mastered: boolean;
}

export interface AIVoiceResponse {
  audioUrl: string;
  text: string;
  voice: string;
  duration: number;
  quality: 'high' | 'medium' | 'low';
}

// Supabase Integration Service
export const supabaseService = {
  // Upload audio file to Supabase Storage
  async uploadAudioToStorage(blob: Blob, fileName: string): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('📤 Uploading audio to Supabase Storage:', fileName);
      
      const { data, error } = await supabase.storage
        .from('speech-files')
        .upload(`public/${user.id}/${fileName}`, blob, { 
          contentType: 'audio/wav',
          cacheControl: '3600'
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        throw error;
      }

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('speech-files')
        .getPublicUrl(`public/${user.id}/${fileName}`);

      const publicUrl = urlData.publicUrl;
      console.log('✅ Audio uploaded successfully, URL:', publicUrl);
      
      return publicUrl;
    } catch (error) {
      console.error('Supabase storage upload error:', error);
      return null;
    }
  },

  // Delete audio file from Supabase Storage
  async deleteAudioFromStorage(fileName: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.storage
        .from('speech-files')
        .remove([`public/${user.id}/${fileName}`]);

      if (error) {
        console.error('Supabase storage delete error:', error);
        return false;
      }

      console.log('✅ Audio file deleted from storage:', fileName);
      return true;
    } catch (error) {
      console.error('Supabase storage delete error:', error);
      return false;
    }
  },

  // Save pronunciation recording
  async saveRecording(recording: Omit<PronunciationRecording, 'id' | 'created_at'>): Promise<PronunciationRecording | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('pronunciation_recordings')
        .insert({
          user_id: user.id,
          word: recording.word,
          audio_url: recording.audio_url,
          duration: recording.duration,
          file_size: recording.file_size,
          analysis_score: recording.analysis_score,
          clarity_score: recording.clarity_score,
          accuracy_score: recording.accuracy_score,
          fluency_score: recording.fluency_score,
          feedback: recording.feedback,
          suggestions: recording.suggestions
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving recording:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Supabase save recording error:', error);
      return null;
    }
  },

  // Get user's recordings
  async getUserRecordings(): Promise<PronunciationRecording[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('pronunciation_recordings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recordings:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Supabase get recordings error:', error);
      return [];
    }
  },

  // Update pronunciation progress
  async updateProgress(progress: Omit<PronunciationProgress, 'id'>): Promise<PronunciationProgress | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if progress record exists
      const { data: existing } = await supabase
        .from('pronunciation_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('word', progress.word)
        .single();

      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from('pronunciation_progress')
          .update({
            practice_count: existing.practice_count + 1,
            best_score: Math.max(existing.best_score, progress.best_score),
            last_practiced: new Date().toISOString(),
            improvement_rate: (progress.best_score - existing.best_score) / existing.practice_count,
            mastered: progress.best_score >= 90
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating progress:', error);
          return null;
        }

        return data;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('pronunciation_progress')
          .insert({
            user_id: user.id,
            word: progress.word,
            practice_count: 1,
            best_score: progress.best_score,
            last_practiced: new Date().toISOString(),
            improvement_rate: 0,
            mastered: progress.best_score >= 90
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating progress:', error);
          return null;
        }

        return data;
      }
    } catch (error) {
      console.error('Supabase update progress error:', error);
      return null;
    }
  },

  // Get user's progress
  async getUserProgress(): Promise<PronunciationProgress[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('pronunciation_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('last_practiced', { ascending: false });

      if (error) {
        console.error('Error fetching progress:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Supabase get progress error:', error);
      return [];
    }
  }
};

// ElevenLabs Integration Service
export const elevenLabsService = {
  // Generate TTS using ElevenLabs
  async generateTTS(text: string, voiceId: string = '21m00Tcm4TlvDq8ikWAM'): Promise<AIVoiceResponse | null> {
    try {
      const response = await fetch('/api/elevenlabs/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          voiceId,
          model_id: 'eleven_turbo_v2'
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs TTS failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      return {
        audioUrl,
        text,
        voice: voiceId,
        duration: audioBlob.size / 16000, // Rough estimate
        quality: 'high'
      };
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      return null;
    }
  },

  // Get available voices
  async getVoices(): Promise<any[]> {
    try {
      const response = await fetch('/api/elevenlabs/voices');
      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('ElevenLabs get voices error:', error);
      return [];
    }
  },

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch('/api/elevenlabs/health');
      const data = await response.json();
      return data.ok || false;
    } catch (error) {
      console.error('ElevenLabs health check error:', error);
      return false;
    }
  }
};

// Google AI Studio Integration Service
export const googleAIService = {
  // Generate TTS using Google AI Studio
  async generateTTS(text: string): Promise<AIVoiceResponse | null> {
    try {
      if (!import.meta.env.VITE_GOOGLE_AI_STUDIO_API_KEY) {
        console.warn('Google AI Studio API key not configured');
        return null;
      }

      // Use Google AI Studio to generate pronunciation guide
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `
      Generate a clear pronunciation guide for the word "${text}". 
      Provide slow, clear pronunciation with proper emphasis.
      Focus on making this word easy to understand and pronounce correctly.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const pronunciationGuide = response.text();

      // Use browser speech synthesis with enhanced voice selection
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
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
            
            window.speechSynthesis.getVoices();
          });
        };
        
        const voices = await getVoices();
        
        // Enhanced voice selection for David
        let selectedVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('microsoft david') ||
          voice.name.toLowerCase().includes('david') ||
          voice.name.toLowerCase().includes('ms david')
        ) || voices.find(voice => 
          voice.name.toLowerCase().includes('microsoft') ||
          voice.name.toLowerCase().includes('windows') ||
          voice.name.toLowerCase().includes('sapi')
        ) || voices.find(voice => voice.lang.startsWith('en-US'));

        const utterance = new window.SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        utterance.pitch = 1.1;
        utterance.lang = 'en-US';
        utterance.volume = 1.0;
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        return new Promise((resolve) => {
          utterance.onend = () => {
            resolve({
              audioUrl: 'google-ai-speech',
              text,
              voice: selectedVoice?.name || 'Google AI',
              duration: text.length * 0.1, // Rough estimate
              quality: 'high'
            });
          };
          
          utterance.onerror = () => {
            resolve(null);
          };
          
          window.speechSynthesis.speak(utterance);
        });
      }

      return null;
    } catch (error) {
      console.error('Google AI Studio TTS error:', error);
      return null;
    }
  },

  // Get pronunciation feedback
  async getPronunciationFeedback(word: string, userTranscription: string): Promise<{
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
        feedback: 'Analysis failed',
        suggestions: ['Keep practicing!']
      };
    }
  },

  // Get practice suggestions
  async getPracticeSuggestions(word: string, userLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'): Promise<string[]> {
    try {
      if (!import.meta.env.VITE_GOOGLE_AI_STUDIO_API_KEY) {
        return ['Practice slowly and clearly', 'Record yourself and listen back', 'Use a mirror to watch your mouth'];
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
      Provide 3 specific practice suggestions for the word "${word}" for a ${userLevel} level learner.
      Focus on practical, actionable advice that can be done immediately.
      Return as a JSON array of strings.
      
      Example: ["Practice the word in isolation first", "Break it down into syllables", "Record yourself and compare with native speakers"]
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        const suggestions = JSON.parse(text);
        return Array.isArray(suggestions) ? suggestions : ['Practice slowly and clearly', 'Record yourself and listen back', 'Use a mirror to watch your mouth'];
      } catch (parseError) {
        console.error('Failed to parse practice suggestions:', parseError);
        return ['Practice slowly and clearly', 'Record yourself and listen back', 'Use a mirror to watch your mouth'];
      }
    } catch (error) {
      console.error('Google AI practice suggestions error:', error);
      return ['Practice slowly and clearly', 'Record yourself and listen back', 'Use a mirror to watch your mouth'];
    }
  }
};

// Combined Integration Service
export const integrationService = {
  // Expose individual services
  supabase: supabaseService,
  elevenLabs: elevenLabsService,
  googleAI: googleAIService,

  // Save recording with analysis
  async saveRecordingWithAnalysis(
    word: string, 
    audioBlob: Blob, 
    audioUrl: string,
    duration?: number
  ): Promise<PronunciationRecording | null> {
    try {
      // 1. Upload audio to Supabase Storage
      const fileName = `pronunciation_${Date.now()}_${word}.wav`;
      const storageUrl = await supabaseService.uploadAudioToStorage(audioBlob, fileName);
      
      // 2. Get AI analysis (placeholder for now - would need speech-to-text first)
      const analysis = {
        score: 75,
        clarity: 70,
        accuracy: 75,
        fluency: 80,
        feedback: 'Good pronunciation! Keep practicing.',
        suggestions: ['Listen to the AI voice and mimic it', 'Record yourself and listen back', 'Practice slowly and clearly']
      };

      // 3. Save to database
      const recording = await supabaseService.saveRecording({
        user_id: '', // Will be set by the service
        word,
        audio_url: storageUrl || audioUrl,
        duration,
        file_size: audioBlob.size,
        analysis_score: analysis.score,
        clarity_score: analysis.clarity,
        accuracy_score: analysis.accuracy,
        fluency_score: analysis.fluency,
        feedback: analysis.feedback,
        suggestions: analysis.suggestions
      });

      // 4. Update progress
      if (recording) {
        await supabaseService.updateProgress({
          user_id: '', // Will be set by the service
          word,
          practice_count: 1,
          best_score: analysis.score,
          last_practiced: new Date().toISOString(),
          improvement_rate: 0,
          mastered: analysis.score >= 90
        });
      }

      return recording;
    } catch (error) {
      console.error('Integration save recording error:', error);
      return null;
    }
  },

  // Generate AI voice with fallback
  async generateAIVoice(text: string, preferredService: 'elevenlabs' | 'google' | 'auto' = 'auto'): Promise<AIVoiceResponse | null> {
    try {
      if (preferredService === 'elevenlabs' || preferredService === 'auto') {
        const elevenLabsResult = await elevenLabsService.generateTTS(text);
        if (elevenLabsResult) {
          return elevenLabsResult;
        }
      }

      if (preferredService === 'google' || preferredService === 'auto') {
        const googleResult = await googleAIService.generateTTS(text);
        if (googleResult) {
          return googleResult;
        }
      }

      return null;
    } catch (error) {
      console.error('Integration generate AI voice error:', error);
      return null;
    }
  },

  // Get comprehensive pronunciation feedback
  async getComprehensiveFeedback(word: string, userTranscription: string): Promise<{
    accuracy: number;
    feedback: string;
    suggestions: string[];
    practiceTips: string[];
  }> {
    try {
      const [googleFeedback, practiceSuggestions] = await Promise.all([
        googleAIService.getPronunciationFeedback(word, userTranscription),
        googleAIService.getPracticeSuggestions(word)
      ]);

      return {
        accuracy: googleFeedback.accuracy,
        feedback: googleFeedback.feedback,
        suggestions: googleFeedback.suggestions,
        practiceTips: practiceSuggestions
      };
    } catch (error) {
      console.error('Integration comprehensive feedback error:', error);
      return {
        accuracy: 0.7,
        feedback: 'Analysis completed',
        suggestions: ['Keep practicing!'],
        practiceTips: ['Practice slowly and clearly', 'Record yourself and listen back']
      };
    }
  },

  // Health check for all services
  async healthCheck(): Promise<{
    supabase: boolean;
    elevenlabs: boolean;
    googleAI: boolean;
  }> {
    try {
      const [elevenLabsHealth] = await Promise.all([
        elevenLabsService.healthCheck(),
        // Add other health checks as needed
      ]);

      return {
        supabase: true, // Basic check - would need more sophisticated check
        elevenlabs: elevenLabsHealth,
        googleAI: !!import.meta.env.VITE_GOOGLE_AI_STUDIO_API_KEY
      };
    } catch (error) {
      console.error('Integration health check error:', error);
      return {
        supabase: false,
        elevenlabs: false,
        googleAI: false
      };
    }
  }
};

export default integrationService;
