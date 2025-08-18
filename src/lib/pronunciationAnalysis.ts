import { supabase } from './supabase';

export interface PronunciationAnalysis {
  // Basic Info
  word: string;
  transcription: string;
  confidenceScore: number;
  
  // Audio Metrics
  duration: number;
  wordCount: number;
  wordsPerMinute: number;
  
  // Voice Characteristics
  averagePitch: number;
  pitchRange: number;
  volume: number;
  
  // Pronunciation Assessment
  phonemeAccuracy: Record<string, number>;
  pronunciationErrors: string[];
  
  // Communication Style
  speakingRate: 'slow' | 'normal' | 'fast';
  clarityScore: number;
  fluencyScore: number;
  intonationScore: number;
  
  // Overall Assessment
  overallScore: number;
  improvementSuggestions: string[];
  difficultyLevel: 'easy' | 'medium' | 'hard';
  masteryStatus: 'learning' | 'practicing' | 'mastered';
}

export interface PronunciationProgress {
  word: string;
  attemptsCount: number;
  bestScore: number;
  latestScore: number;
  averageScore: number;
  improvementRate: number;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  masteryStatus: 'learning' | 'practicing' | 'mastered';
}

export interface SessionInsights {
  totalWords: number;
  totalRecordings: number;
  averageScore: number;
  focusAreas: string[];
  achievements: string[];
  sessionSummary: string;
  timeSpent: number;
}

class PronunciationAnalysisService {
  private apiKey: string;
  
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  }

  // Analyze audio using Whisper and custom analysis
  async analyzeAudio(audioBlob: Blob, targetWord: string): Promise<PronunciationAnalysis> {
    try {
      // Step 1: Transcribe with Whisper
      const transcription = await this.transcribeWithWhisper(audioBlob);
      
      // Step 2: Analyze audio characteristics
      const audioMetrics = await this.analyzeAudioCharacteristics(audioBlob);
      
      // Step 3: Compare pronunciation with target word
      const pronunciationAssessment = await this.assessPronunciation(transcription, targetWord);
      
      // Step 4: Analyze speaking style and fluency
      const communicationStyle = await this.analyzeCommunicationStyle(audioBlob, transcription);
      
      // Step 5: Generate overall assessment and suggestions
      const overallAssessment = await this.generateOverallAssessment(
        transcription, 
        targetWord, 
        audioMetrics, 
        pronunciationAssessment,
        communicationStyle
      );

      const analysis: PronunciationAnalysis = {
        word: targetWord,
        transcription: transcription.text,
        confidenceScore: transcription.confidence,
        
        duration: audioMetrics.duration,
        wordCount: audioMetrics.wordCount,
        wordsPerMinute: audioMetrics.wordsPerMinute,
        
        averagePitch: audioMetrics.averagePitch,
        pitchRange: audioMetrics.pitchRange,
        volume: audioMetrics.volume,
        
        phonemeAccuracy: pronunciationAssessment.phonemeAccuracy,
        pronunciationErrors: pronunciationAssessment.errors,
        
        speakingRate: communicationStyle.speakingRate,
        clarityScore: communicationStyle.clarityScore,
        fluencyScore: communicationStyle.fluencyScore,
        intonationScore: communicationStyle.intonationScore,
        
        overallScore: overallAssessment.score,
        improvementSuggestions: overallAssessment.suggestions,
        difficultyLevel: overallAssessment.difficultyLevel,
        masteryStatus: overallAssessment.masteryStatus
      };

      // Store in Supabase
      await this.storeAnalysis(analysis, audioBlob);
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing pronunciation:', error);
      return this.getFallbackAnalysis(targetWord);
    }
  }

  // Transcribe audio using Whisper API
  private async transcribeWithWhisper(audioBlob: Blob): Promise<{text: string, confidence: number}> {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'verbose_json');

      const response = await fetch('/api/openai/transcriptions', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Whisper transcription failed');
      }

      const result = await response.json();
      
      // Calculate average confidence from segments
      const avgConfidence = result.segments?.reduce((acc: number, seg: any) => 
        acc + (seg.avg_logprob || 0), 0) / (result.segments?.length || 1);
      
      return {
        text: result.text.trim(),
        confidence: Math.max(0, Math.min(1, (avgConfidence + 5) / 5)) // Normalize to 0-1
      };
    } catch (error) {
      console.error('Whisper transcription error:', error);
      return { text: 'transcription_failed', confidence: 0 };
    }
  }

  // Analyze audio characteristics using Web Audio API
  private async analyzeAudioCharacteristics(audioBlob: Blob): Promise<{
    duration: number;
    wordCount: number;
    wordsPerMinute: number;
    averagePitch: number;
    pitchRange: number;
    volume: number;
  }> {
    try {
      const audioBuffer = await this.blobToAudioBuffer(audioBlob);
      const duration = audioBuffer.duration * 1000; // Convert to ms
      
      // Estimate word count (rough approximation)
      const wordCount = Math.max(1, Math.round(duration / 600)); // ~600ms per word average
      const wordsPerMinute = (wordCount / duration) * 60000;

      // Analyze pitch and volume
      const analysisResults = this.analyzePitchAndVolume(audioBuffer);
      
      return {
        duration,
        wordCount,
        wordsPerMinute,
        averagePitch: analysisResults.averagePitch,
        pitchRange: analysisResults.pitchRange,
        volume: analysisResults.volume
      };
    } catch (error) {
      console.error('Audio analysis error:', error);
      return {
        duration: 1000,
        wordCount: 1,
        wordsPerMinute: 60,
        averagePitch: 150,
        pitchRange: 50,
        volume: -20
      };
    }
  }

  // Convert blob to AudioBuffer for analysis
  private async blobToAudioBuffer(blob: Blob): Promise<AudioBuffer> {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    return await audioContext.decodeAudioData(arrayBuffer);
  }

  // Analyze pitch and volume characteristics
  private analyzePitchAndVolume(audioBuffer: AudioBuffer): {
    averagePitch: number;
    pitchRange: number;
    volume: number;
  } {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Simple pitch estimation using autocorrelation
    const windowSize = Math.floor(sampleRate * 0.025); // 25ms windows
    const pitches: number[] = [];
    let totalVolume = 0;

    for (let i = 0; i < channelData.length - windowSize; i += windowSize) {
      const window = channelData.slice(i, i + windowSize);
      
      // Calculate RMS for volume
      const rms = Math.sqrt(window.reduce((sum, sample) => sum + sample * sample, 0) / window.length);
      totalVolume += rms;
      
      // Simple pitch detection using autocorrelation
      const pitch = this.estimatePitch(window, sampleRate);
      if (pitch > 0) pitches.push(pitch);
    }

    const averagePitch = pitches.length > 0 ? pitches.reduce((a, b) => a + b, 0) / pitches.length : 150;
    const pitchRange = pitches.length > 0 ? Math.max(...pitches) - Math.min(...pitches) : 50;
    const volume = 20 * Math.log10(totalVolume / (channelData.length / windowSize));

    return {
      averagePitch: Math.round(averagePitch),
      pitchRange: Math.round(pitchRange),
      volume: Math.round(volume)
    };
  }

  // Simple pitch estimation using autocorrelation
  private estimatePitch(buffer: Float32Array, sampleRate: number): number {
    const minPeriod = Math.floor(sampleRate / 800); // 800 Hz max
    const maxPeriod = Math.floor(sampleRate / 80);  // 80 Hz min
    
    let bestCorrelation = 0;
    let bestPeriod = 0;

    for (let period = minPeriod; period < maxPeriod && period < buffer.length / 2; period++) {
      let correlation = 0;
      for (let i = 0; i < buffer.length - period; i++) {
        correlation += buffer[i] * buffer[i + period];
      }
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }

    return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
  }

  // Assess pronunciation accuracy using AI
  private async assessPronunciation(transcription: string, targetWord: string): Promise<{
    phonemeAccuracy: Record<string, number>;
    errors: string[];
  }> {
    try {
      const prompt = `
        Analyze the pronunciation accuracy of the word "${targetWord}" based on the transcription "${transcription}".
        
        Provide a JSON response with:
        1. phonemeAccuracy: Object with phoneme-level accuracy scores (0-1)
        2. errors: Array of specific pronunciation errors detected
        
        Example format:
        {
          "phonemeAccuracy": {"k": 0.9, "æ": 0.7, "n": 0.95, "z": 0.8},
          "errors": ["vowel sound 'æ' needs improvement", "final 's' sound missing"]
        }
      `;

      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          model: 'gpt-4o-mini',
          temperature: 0.3
        })
      });

      if (!response.ok) throw new Error('AI analysis failed');
      
      const result = await response.json();
      const analysis = JSON.parse(result.choices[0].message.content);
      
      return {
        phonemeAccuracy: analysis.phonemeAccuracy || {},
        errors: analysis.errors || []
      };
    } catch (error) {
      console.error('Pronunciation assessment error:', error);
      return {
        phonemeAccuracy: { 'overall': 0.7 },
        errors: ['Analysis unavailable']
      };
    }
  }

  // Analyze communication style and fluency
  private async analyzeCommunicationStyle(audioBlob: Blob, transcription: string): Promise<{
    speakingRate: 'slow' | 'normal' | 'fast';
    clarityScore: number;
    fluencyScore: number;
    intonationScore: number;
  }> {
    try {
      const audioBuffer = await this.blobToAudioBuffer(audioBlob);
      const duration = audioBuffer.duration;
      const wordCount = transcription.split(' ').length;
      const wpm = (wordCount / duration) * 60;

      // Determine speaking rate
      let speakingRate: 'slow' | 'normal' | 'fast' = 'normal';
      if (wpm < 120) speakingRate = 'slow';
      else if (wpm > 180) speakingRate = 'fast';

      // Analyze clarity based on transcription quality
      const clarityScore = transcription.length > 0 ? Math.min(1, transcription.length / (wordCount * 5)) : 0.5;
      
      // Fluency score based on speaking rate and pauses
      const fluencyScore = Math.max(0, Math.min(1, (180 - Math.abs(wpm - 150)) / 180));
      
      // Intonation score (simplified based on pitch variation)
      const audioMetrics = await this.analyzeAudioCharacteristics(audioBlob);
      const intonationScore = Math.min(1, audioMetrics.pitchRange / 100);

      return {
        speakingRate,
        clarityScore: Math.round(clarityScore * 100) / 100,
        fluencyScore: Math.round(fluencyScore * 100) / 100,
        intonationScore: Math.round(intonationScore * 100) / 100
      };
    } catch (error) {
      console.error('Communication style analysis error:', error);
      return {
        speakingRate: 'normal',
        clarityScore: 0.7,
        fluencyScore: 0.7,
        intonationScore: 0.7
      };
    }
  }

  // Generate overall assessment and improvement suggestions
  private async generateOverallAssessment(
    transcription: any,
    targetWord: string,
    audioMetrics: any,
    pronunciationAssessment: any,
    communicationStyle: any
  ): Promise<{
    score: number;
    suggestions: string[];
    difficultyLevel: 'easy' | 'medium' | 'hard';
    masteryStatus: 'learning' | 'practicing' | 'mastered';
  }> {
    // Calculate weighted overall score
    const accuracyScore = Object.values(pronunciationAssessment.phonemeAccuracy).reduce((a: any, b: any) => a + b, 0) / 
                         Object.keys(pronunciationAssessment.phonemeAccuracy).length;
    
    const overallScore = (
      transcription.confidence * 0.3 +
      accuracyScore * 0.4 +
      communicationStyle.clarityScore * 0.15 +
      communicationStyle.fluencyScore * 0.15
    );

    // Generate suggestions based on weak areas
    const suggestions: string[] = [];
    if (transcription.confidence < 0.8) {
      suggestions.push("Practice speaking more clearly and distinctly");
    }
    if (communicationStyle.speakingRate === 'fast') {
      suggestions.push("Try speaking a bit slower for better clarity");
    }
    if (communicationStyle.speakingRate === 'slow') {
      suggestions.push("You can speak a bit faster while maintaining clarity");
    }
    if (communicationStyle.intonationScore < 0.6) {
      suggestions.push("Work on varying your pitch for more natural speech");
    }

    // Determine difficulty and mastery
    let difficultyLevel: 'easy' | 'medium' | 'hard' = 'medium';
    if (targetWord.length <= 4) difficultyLevel = 'easy';
    else if (targetWord.length > 8) difficultyLevel = 'hard';

    let masteryStatus: 'learning' | 'practicing' | 'mastered' = 'practicing';
    if (overallScore >= 0.9) masteryStatus = 'mastered';
    else if (overallScore < 0.6) masteryStatus = 'learning';

    return {
      score: Math.round(overallScore * 100) / 100,
      suggestions,
      difficultyLevel,
      masteryStatus
    };
  }

  // Store analysis results in Supabase
  private async storeAnalysis(analysis: PronunciationAnalysis, audioBlob: Blob): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Convert blob to base64 for storage
      const audioData = await this.blobToBase64(audioBlob);

      await supabase.from('pronunciation_recordings').insert({
        user_id: user.id,
        word: analysis.word,
        audio_blob_data: audioData,
        transcription: analysis.transcription,
        confidence_score: analysis.confidenceScore,
        duration_ms: analysis.duration,
        word_count: analysis.wordCount,
        words_per_minute: analysis.wordsPerMinute,
        average_pitch_hz: analysis.averagePitch,
        pitch_range_hz: analysis.pitchRange,
        volume_db: analysis.volume,
        phoneme_accuracy: analysis.phonemeAccuracy,
        pronunciation_errors: analysis.pronunciationErrors,
        speaking_rate: analysis.speakingRate,
        clarity_score: analysis.clarityScore,
        fluency_score: analysis.fluencyScore,
        intonation_score: analysis.intonationScore,
        overall_pronunciation_score: analysis.overallScore,
        improvement_suggestions: analysis.improvementSuggestions
      });

      // Update or insert progress tracking
      await this.updateProgress(analysis);
    } catch (error) {
      console.error('Error storing analysis:', error);
    }
  }

  // Update user progress for the word
  private async updateProgress(analysis: PronunciationAnalysis): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existing } = await supabase
        .from('pronunciation_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('word', analysis.word)
        .single();

      if (existing) {
        // Update existing progress
        const newAttemptsCount = existing.attempts_count + 1;
        const newAverageScore = (existing.average_score * existing.attempts_count + analysis.overallScore) / newAttemptsCount;
        const newBestScore = Math.max(existing.best_score, analysis.overallScore);

        await supabase
          .from('pronunciation_progress')
          .update({
            attempts_count: newAttemptsCount,
            best_score: newBestScore,
            latest_score: analysis.overallScore,
            average_score: newAverageScore,
            last_attempt_date: new Date().toISOString(),
            difficulty_level: analysis.difficultyLevel,
            mastery_status: analysis.masteryStatus
          })
          .eq('id', existing.id);
      } else {
        // Insert new progress record
        await supabase.from('pronunciation_progress').insert({
          user_id: user.id,
          word: analysis.word,
          attempts_count: 1,
          best_score: analysis.overallScore,
          latest_score: analysis.overallScore,
          average_score: analysis.overallScore,
          difficulty_level: analysis.difficultyLevel,
          mastery_status: analysis.masteryStatus
        });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }

  // Convert blob to base64 for storage
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Fallback analysis when AI services fail
  private getFallbackAnalysis(targetWord: string): PronunciationAnalysis {
    return {
      word: targetWord,
      transcription: targetWord.toLowerCase(),
      confidenceScore: 0.7,
      duration: 1000,
      wordCount: 1,
      wordsPerMinute: 60,
      averagePitch: 150,
      pitchRange: 50,
      volume: -20,
      phonemeAccuracy: { 'overall': 0.7 },
      pronunciationErrors: [],
      speakingRate: 'normal',
      clarityScore: 0.7,
      fluencyScore: 0.7,
      intonationScore: 0.7,
      overallScore: 0.7,
      improvementSuggestions: ['Keep practicing!'],
      difficultyLevel: 'medium',
      masteryStatus: 'practicing'
    };
  }

  // Get user's pronunciation progress
  async getUserProgress(): Promise<PronunciationProgress[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('pronunciation_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('last_attempt_date', { ascending: false });

      if (error) throw error;

      return data.map(item => ({
        word: item.word,
        attemptsCount: item.attempts_count,
        bestScore: item.best_score,
        latestScore: item.latest_score,
        averageScore: item.average_score,
        improvementRate: item.improvement_rate || 0,
        difficultyLevel: item.difficulty_level,
        masteryStatus: item.mastery_status
      }));
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return [];
    }
  }

  // Get session insights
  async getSessionInsights(): Promise<SessionInsights> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return this.getDefaultSessionInsights();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: recordings, error } = await supabase
        .from('pronunciation_recordings')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      if (error) throw error;

      const totalWords = new Set(recordings.map(r => r.word)).size;
      const totalRecordings = recordings.length;
      const averageScore = recordings.length > 0 
        ? recordings.reduce((sum, r) => sum + (r.overall_pronunciation_score || 0), 0) / recordings.length 
        : 0;

      // Analyze focus areas and achievements
      const focusAreas: string[] = [];
      const achievements: string[] = [];

      recordings.forEach(recording => {
        if (recording.overall_pronunciation_score < 0.6) {
          if (!focusAreas.includes('pronunciation accuracy')) {
            focusAreas.push('pronunciation accuracy');
          }
        }
        if (recording.clarity_score < 0.6) {
          if (!focusAreas.includes('speech clarity')) {
            focusAreas.push('speech clarity');
          }
        }
        if (recording.overall_pronunciation_score >= 0.9) {
          achievements.push(`Mastered "${recording.word}"`);
        }
      });

      return {
        totalWords,
        totalRecordings,
        averageScore: Math.round(averageScore * 100) / 100,
        focusAreas,
        achievements,
        sessionSummary: this.generateSessionSummary(totalWords, totalRecordings, averageScore),
        timeSpent: recordings.reduce((sum, r) => sum + (r.duration_ms || 0), 0) / 1000 / 60 // minutes
      };
    } catch (error) {
      console.error('Error fetching session insights:', error);
      return this.getDefaultSessionInsights();
    }
  }

  private generateSessionSummary(totalWords: number, totalRecordings: number, averageScore: number): string {
    if (totalRecordings === 0) return "No practice session data available.";
    
    const performance = averageScore >= 0.8 ? "excellent" : averageScore >= 0.6 ? "good" : "needs improvement";
    return `Practiced ${totalWords} words with ${totalRecordings} recordings. Overall performance: ${performance}.`;
  }

  private getDefaultSessionInsights(): SessionInsights {
    return {
      totalWords: 0,
      totalRecordings: 0,
      averageScore: 0,
      focusAreas: [],
      achievements: [],
      sessionSummary: "No practice session data available.",
      timeSpent: 0
    };
  }
}

export const pronunciationAnalysisService = new PronunciationAnalysisService();


