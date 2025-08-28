import React, { useState, useRef, useEffect } from 'react';
import { Play, Mic, StopCircle, X, Brain, Sparkles, Volume2, BookOpen, MessageSquare, Music, TrendingUp, Award, Clock, BarChart3, Download } from 'lucide-react';
import RecordRTC from 'recordrtc';
import { useAuth } from '../hooks/useAuth';
import { useVocabulary } from '../hooks/VocabularyContext';
import { useNavigate } from 'react-router-dom';
import { useFeedback } from '../hooks/FeedbackContext';
import { integrationService, PronunciationRecording, PronunciationProgress } from '../lib/integrationService';
import { 
  GlossyPronunciationChart, 
  GlossyPhonemeChart, 
  GlossyProgressChart, 
  GlossyCommunicationChart,
  GlossyKPICard,
  RechartsGlossyBar,
  RechartsGlossyArea
} from './EnhancedCharts';
import { pdfExportService } from '../lib/pdfExport';

const PronunciationPractice: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pronunciation');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWord, setCurrentWord] = useState('Pronunciation');
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [enhancedURL, setEnhancedURL] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [pronunciationRecordings, setPronunciationRecordings] = useState<PronunciationRecording[]>([]);
  const [pronunciationProgress, setPronunciationProgress] = useState<PronunciationProgress[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [showDetailedReport, setShowDetailedReport] = useState<boolean>(false);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  // const [s2sError, setS2sError] = useState<string | null>(null); // diagnostics hidden

  // Convert recorded audio (webm/opus) to 16-bit PCM WAV for maximum compatibility with S2S
  const convertBlobToWav = async (blob: Blob, targetSampleRate = 44100): Promise<Blob> => {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    // Resample if needed
    const offlineCtx = new OfflineAudioContext(
      decodedBuffer.numberOfChannels,
      Math.ceil(decodedBuffer.duration * targetSampleRate),
      targetSampleRate
    );
    const source = offlineCtx.createBufferSource();
    source.buffer = decodedBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);
    const rendered = await offlineCtx.startRendering();

    // Encode PCM 16-bit WAV
    const numChannels = rendered.numberOfChannels;
    const length = rendered.length * numChannels * 2 + 44; // 16-bit PCM
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    let offset = 0;
    writeString(offset, 'RIFF'); offset += 4;
    view.setUint32(offset, 36 + rendered.length * numChannels * 2, true); offset += 4;
    writeString(offset, 'WAVE'); offset += 4;
    writeString(offset, 'fmt '); offset += 4;
    view.setUint32(offset, 16, true); offset += 4; // PCM chunk size
    view.setUint16(offset, 1, true); offset += 2; // PCM format
    view.setUint16(offset, numChannels, true); offset += 2;
    view.setUint32(offset, targetSampleRate, true); offset += 4;
    view.setUint32(offset, targetSampleRate * numChannels * 2, true); offset += 4; // byte rate
    view.setUint16(offset, numChannels * 2, true); offset += 2; // block align
    view.setUint16(offset, 16, true); offset += 2; // bits per sample
    writeString(offset, 'data'); offset += 4;
    view.setUint32(offset, rendered.length * numChannels * 2, true); offset += 4;

    // Interleave and write samples
    const channels: Float32Array[] = [];
    for (let ch = 0; ch < numChannels; ch++) {
      channels.push(rendered.getChannelData(ch));
    }
    let sampleIndex = 0;
    for (let i = 0; i < rendered.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        let sample = channels[ch][i];
        sample = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset + sampleIndex * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        sampleIndex++;
      }
    }
    return new Blob([buffer], { type: 'audio/wav' });
  };
  // RecordRTC for better audio recording
  const recordRTCRef = useRef<RecordRTC | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Removed unused original waveform state
  const [latestRecordedWord, setLatestRecordedWord] = useState<string>('Pronunciation');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const aiAudioRef = useRef<HTMLAudioElement | null>(null);
  const [aiPlaybackRate, setAiPlaybackRate] = useState<number>(0.85);
  

  const { user } = useAuth();
  const navigate = useNavigate();
  const { addFeedback, feedbacks } = useFeedback();

  // Generate comprehensive insights data from feedbacks
  const generateInsightsData = () => {
    const recentFeedbacks = feedbacks.slice(-10); // Last 10 recordings
    
    if (recentFeedbacks.length === 0) {
      return {
        totalWords: 0,
        totalRecordings: 0,
        averageScore: 0,
        averageClarity: 0,
        averagePitch: 0,
        practiceTime: 0,
        pronunciationScores: [],
        phonemeData: [],
        progressData: [],
        communicationData: [],
        difficultyData: []
      };
    }

    const totalWords = new Set(recentFeedbacks.map(f => f.word)).size;
    const totalRecordings = recentFeedbacks.length;
    const averageScore = recentFeedbacks.reduce((sum, f) => sum + f.score, 0) / totalRecordings;
    const averageClarity = recentFeedbacks.reduce((sum, f) => sum + f.clarity.value, 0) / totalRecordings;
    const averagePitch = recentFeedbacks.reduce((sum, f) => sum + (f.averagePitch || 150), 0) / totalRecordings;
    const practiceTime = recentFeedbacks.reduce((sum, f) => sum + (f.duration || 2000), 0) / 1000 / 60; // minutes

    // Pronunciation scores by word
    const pronunciationScores = recentFeedbacks.map(f => ({
      word: f.word,
      score: f.score / 100,
      attempts: 1,
      difficulty: f.difficultyLevel || 'medium' as 'easy' | 'medium' | 'hard'
    }));

    // Phoneme accuracy data (mock based on clarity)
    const phonemeData = [
      { phoneme: 'Vowels', accuracy: Math.min(1, averageClarity / 100 + 0.1) },
      { phoneme: 'Consonants', accuracy: Math.min(1, averageClarity / 100 + 0.05) },
      { phoneme: 'Stress', accuracy: Math.min(1, (averageScore / 100) + 0.08) },
      { phoneme: 'Rhythm', accuracy: Math.min(1, (averageScore / 100) + 0.03) }
    ];

    // Progress data over time
    const progressData = recentFeedbacks.map((f) => ({
      date: new Date(f.date).toLocaleDateString(),
      score: f.score / 100,
      wordsPerMinute: f.wordsPerMinute || 120
    }));

    // Communication style data
    const communicationData = [
      { category: 'Clarity', score: averageClarity / 100, fullMark: 1 },
      { category: 'Fluency', score: Math.min(1, averageScore / 100 + 0.1), fullMark: 1 },
      { category: 'Pace', score: Math.min(1, averageScore / 100 + 0.05), fullMark: 1 },
      { category: 'Intonation', score: Math.min(1, averageScore / 100 + 0.03), fullMark: 1 },
      { category: 'Pronunciation', score: averageScore / 100, fullMark: 1 }
    ];

    // Difficulty distribution
    const difficultyCount = { easy: 0, medium: 0, hard: 0 };
    recentFeedbacks.forEach(f => {
      const difficulty = f.difficultyLevel || 'medium';
      difficultyCount[difficulty as keyof typeof difficultyCount]++;
    });

    const difficultyData = [
      { difficulty: 'Easy', count: difficultyCount.easy },
      { difficulty: 'Medium', count: difficultyCount.medium },
      { difficulty: 'Hard', count: difficultyCount.hard }
    ];

    return {
      totalWords,
      totalRecordings,
      averageScore,
      averageClarity,
      averagePitch,
      practiceTime,
      pronunciationScores,
      phonemeData,
      progressData,
      communicationData,
      difficultyData
    };
  };

  // Handle detailed report export
  const handleExportReport = async () => {
    if (isExportingPDF) return; // Prevent multiple exports
    
    try {
      setIsExportingPDF(true);
      const insightsData = generateInsightsData();
      
      // Show immediate feedback to user
      console.log('Starting PDF export...');
      
      // Validate and sanitize data before creating report
      const sanitizedInsights = {
        averageScore: Math.max(0, Math.min(100, insightsData.averageScore || 0)),
        totalWords: Math.max(0, insightsData.totalWords || 0),
        totalRecordings: Math.max(0, insightsData.totalRecordings || 0),
        practiceTime: Math.max(0, insightsData.practiceTime || 0),
        averageClarity: Math.max(0, Math.min(100, insightsData.averageClarity || 0)),
        pronunciationScores: Array.isArray(insightsData.pronunciationScores) ? insightsData.pronunciationScores : [],
        phonemeData: Array.isArray(insightsData.phonemeData) ? insightsData.phonemeData : [],
        progressData: Array.isArray(insightsData.progressData) ? insightsData.progressData : []
      };

      const reportData = {
        userName: (user?.user_metadata?.full_name || user?.email || 'User').substring(0, 50), // Limit length
        reportDate: new Date().toISOString(),
        overallScore: sanitizedInsights.averageScore / 100,
        totalWords: sanitizedInsights.totalWords,
        totalRecordings: sanitizedInsights.totalRecordings,
        timeSpent: sanitizedInsights.practiceTime,
        pronunciationScores: sanitizedInsights.pronunciationScores.slice(0, 20), // Limit to first 20
        phonemeAccuracy: sanitizedInsights.phonemeData.slice(0, 15), // Limit to first 15
        progressData: sanitizedInsights.progressData.slice(0, 10), // Limit to first 10
        communicationStyle: {
          clarity: sanitizedInsights.averageClarity / 100,
          fluency: Math.min(1, Math.max(0, sanitizedInsights.averageScore / 100 + 0.1)),
          intonation: Math.min(1, Math.max(0, sanitizedInsights.averageScore / 100 + 0.03)),
          speakingRate: 'normal' as 'slow' | 'normal' | 'fast'
        },
        achievements: sanitizedInsights.averageScore > 80 ? ['High Accuracy Achieved', 'Consistent Practice'] : ['Keep Practicing'],
        focusAreas: sanitizedInsights.averageClarity < 70 ? ['Speech Clarity', 'Pronunciation Accuracy'] : [],
        recommendations: [
          'Continue practicing with varied vocabulary',
          'Focus on clear articulation',
          'Maintain consistent practice schedule',
          'Record yourself regularly for self-assessment'
        ]
      };

      await pdfExportService.downloadReport(reportData);
      console.log('PDF export completed successfully');
      
    } catch (error) {
      console.error('Error exporting report:', error);
      // Show a more user-friendly error message
      const errorMessage = 'PDF export encountered an issue. A text version of your report will be downloaded instead.';
      alert(errorMessage);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Helper to generate AI voice with direct browser speech synthesis
  const generateAiVoice = async (): Promise<string | null> => {
    try {
      setIsEnhancing(true);
      console.log('🎤 Generating AI voice for:', latestRecordedWord);
      
      // Use direct browser speech synthesis for immediate response
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Stop any current speech
        
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
        console.log('🎤 Available voices:', voices.map(v => `${v.name} (${v.lang})`));
        
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

        if (selectedVoice) {
          console.log('✅ Selected voice:', selectedVoice.name, 'Language:', selectedVoice.lang);
        } else {
          console.log('⚠️ No preferred voice found, using default');
        }

        const utterance = new window.SpeechSynthesisUtterance(latestRecordedWord || 'Hello');
        utterance.rate = 0.8; // Slower for clarity
        utterance.pitch = 1.1; // Slightly higher pitch
        utterance.lang = 'en-US';
        utterance.volume = 1.0; // Full volume
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        // Speak the word
        window.speechSynthesis.speak(utterance);
        
        console.log('✅ AI voice generated using browser speech synthesis');
        return 'browser-speech'; // Return a placeholder since it's direct speech
      } else {
        console.error('❌ Speech synthesis not supported');
        return null;
      }
    } catch (error) {
      console.error('❌ AI voice generation error:', error);
      return null;
    } finally {
      setIsEnhancing(false);
    }
  };

  // Read selected words from Vocabulary Practice
  const { vocabList } = useVocabulary();
  // Recent activity types and state (synced via localStorage)
  type RecentWord = { id: number; word: string; createdAt: string };
  type SavedRecording = { id: number; word: string; url: string; blob: Blob; createdAt: string };
  const [, setRecentWords] = useState<RecentWord[]>([]);
  const [recordings, setRecordings] = useState<SavedRecording[]>([]);

  // Cleanup effect
  useEffect(() => {
    // Initialize audio context for better audio playback
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('🔊 Audio context initialized, state:', audioContextRef.current.state);
        
        // Resume audio context if suspended (needed for user interaction)
        if (audioContextRef.current.state === 'suspended') {
          console.log('🔊 Audio context is suspended, will resume on user interaction');
        }
      }
    } catch (error) {
      console.error('❌ Failed to initialize audio context:', error);
    }
    
    // Load persisted activity
    try {
      const w = JSON.parse(localStorage.getItem('recentWords') || '[]');
      if (Array.isArray(w)) setRecentWords(w);
    } catch {}
    try {
      const r = JSON.parse(localStorage.getItem('recentRecordings') || '[]');
      if (Array.isArray(r)) {
        console.log('📂 Loading recordings from localStorage:', r.length);
        
        // Convert base64 data back to blob URLs for playback
        const recordingsWithBlobs = r.map((recording: any) => {
          try {
            // Check if the URL is base64 data (starts with data:)
            if (recording.url && recording.url.startsWith('data:')) {
              console.log('🔄 Converting base64 to blob for recording:', recording.word);
              
              // Convert base64 to blob
              const base64Data = recording.url;
              const byteCharacters = atob(base64Data.split(',')[1]);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: 'audio/wav' });
              
              console.log('✅ Successfully converted base64 to blob, size:', blob.size, 'bytes');
              
              return {
                ...recording,
                blob,
                url: base64Data // Keep the base64 data for storage
              };
            }
            return recording;
          } catch (error) {
            console.error('❌ Error converting base64 to blob for recording:', recording.word, error);
            return recording;
          }
        });
        
        setRecordings(recordingsWithBlobs);
        console.log('✅ Loaded recordings with blobs:', recordingsWithBlobs.length);
      }
    } catch (error) {
      console.error('❌ Error loading recordings from localStorage:', error);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  

  // Pull the latest word added in Vocabulary Practice (via context)
  useEffect(() => {
    try {
      // Check for selected word from Vocabulary Practice
      const selectedWord = localStorage.getItem('selectedWord');
      if (selectedWord) {
        setLatestRecordedWord(selectedWord);
        setCurrentWord(selectedWord);
        // Clear the selected word after using it
        localStorage.removeItem('selectedWord');
        // Persist recent word to localStorage for dashboard sync
        const entry: RecentWord = { id: Date.now(), word: selectedWord, createdAt: new Date().toISOString() };
        setRecentWords(prev => {
          const updated = [entry, ...prev.filter(w => w.word !== selectedWord)].slice(0, 50);
          try { localStorage.setItem('recentWords', JSON.stringify(updated)); } catch {}
          return updated;
        });
      } else if (Array.isArray(vocabList) && vocabList.length > 0) {
        // Fallback to latest word from vocabulary list
        const last = vocabList[vocabList.length - 1];
        if (last?.word) {
          setLatestRecordedWord(last.word);
          setCurrentWord(last.word);
          // Persist recent word to localStorage for dashboard sync
          const entry: RecentWord = { id: Date.now(), word: last.word, createdAt: new Date().toISOString() };
          setRecentWords(prev => {
            const updated = [entry, ...prev.filter(w => w.word !== last.word)].slice(0, 50);
            try { localStorage.setItem('recentWords', JSON.stringify(updated)); } catch {}
            return updated;
          });
        }
      }
    } catch {}
  }, [vocabList]);

  // Removed AI assistant widget (using S2S buttons instead)
  
  const avatarUrl = user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name || user?.email || '';
  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // Sample data for different tabs
  // const sampleWords = ['Hello', 'World', 'Practice', 'Pronunciation', 'Language', 'Learning'];
  const flashcardData = [
    { word: 'Ephemeral', meaning: 'Lasting for a very short time', sentence: 'The beauty of cherry blossoms is ephemeral.' },
    { word: 'Ubiquitous', meaning: 'Present everywhere', sentence: 'Smartphones have become ubiquitous in modern society.' },
    { word: 'Serendipity', meaning: 'Finding something good without looking for it', sentence: 'Meeting my best friend was pure serendipity.' }
  ];
     const tongueTwisters = [
     'Peter Piper picked a peck of pickled peppers.',
     'She sells seashells by the seashore.',
     'How much wood would a woodchuck chuck if a woodchuck could chuck wood?'
   ];
   
   // Phoneme data for Sound Safari
   const PHONEMES = [
     {
       symbol: "/s/",
       tts: "s",
       word: "snake",
       phonemeAudio: "https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae7e2.mp3",
       wordAudio: "https://ssl.gstatic.com/dictionary/static/sounds/oxford/snake--_gb_1.mp3",
       hint: "S _ _ _ _ (a long, slithery reptile)",
     },
     {
       symbol: "/th/",
       tts: "th",
       word: "thumb",
       phonemeAudio: "https://cdn.pixabay.com/audio/2022/03/15/audio_115b9e7e2c.mp3",
       wordAudio: "https://ssl.gstatic.com/dictionary/static/sounds/oxford/thumb--_gb_1.mp3",
       hint: "T _ _ _ _ (a finger on your hand)",
     },
     {
       symbol: "/ʃ/",
       tts: "sh",
       word: "shoe",
       phonemeAudio: "https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae7e2.mp3",
       wordAudio: "https://ssl.gstatic.com/dictionary/static/sounds/oxford/shoe--_gb_1.mp3",
       hint: "S _ _ _ (you wear this on your foot)",
     },
     {
       symbol: "/k/",
       tts: "k",
       word: "kite",
       phonemeAudio: "https://cdn.pixabay.com/audio/2022/03/15/audio_115b9e7e2c.mp3",
       wordAudio: "https://ssl.gstatic.com/dictionary/static/sounds/oxford/kite--_gb_1.mp3",
       hint: "K _ _ _ (flies in the sky on a string)",
     },
   ];

   // const soundSafariData = [
   //   { sound: 'Ocean Waves', description: 'Listen to the calming sound of ocean waves', difficulty: 'Easy' },
   //   { sound: 'Bird Songs', description: 'Identify different bird species by their songs', difficulty: 'Medium' },
   //   { sound: 'City Sounds', description: 'Recognize various urban sounds and noises', difficulty: 'Hard' }
   // ];

   // Sound Safari state
   const [boxOpen, setBoxOpen] = useState(false);
   const [cardFlipped, setCardFlipped] = useState(false);
   const [currentPhoneme, setCurrentPhoneme] = useState(PHONEMES[0]);
   const [feedback, setFeedback] = useState("");
   const [progress, setProgress] = useState(0);
   const [listening, setListening] = useState(false);
   const [wordRevealed, setWordRevealed] = useState(false);
   const [error, setError] = useState<string | null>(null);
   // const [micSupported, setMicSupported] = useState(true);
   // const [micPermission, setMicPermission] = useState(true);

   // Flashcard state
   const [flippedCard, setFlippedCard] = useState<number | null>(null);

  // Removed sample words; using recentWords state loaded from localStorage

  const startWaveformAnalysis = (stream: MediaStream) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const source = audioContextRef.current.createMediaStreamSource(stream);
    const analyser = audioContextRef.current.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;
    
    // simplified, no visual sampling needed
    
    const updateWaveform = () => {
      if (!isRecording) return;
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    };
    
    updateWaveform();
  };

  const stopWaveformAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
  };

  const handleStartRecording = async () => {
    setAudioURL(null);
    
    // Set recording state immediately for better UI responsiveness
    setIsRecording(true);
    
    try {
      console.log('🎤 Starting RecordRTC audio recording...');
      
      // First, clean up any existing stream
      if (streamRef.current) {
        console.log('🧹 Cleaning up existing stream...');
        streamRef.current.getTracks().forEach(track => {
          if (track.readyState === 'live') {
            track.stop();
          }
        });
        streamRef.current = null;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      console.log('✅ Microphone access granted');
      
      streamRef.current = stream;
      
      // Configure RecordRTC with WAV format for better compatibility
      const recordRTC = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/wav', // WAV for broad compatibility
        recorderType: RecordRTC.StereoAudioRecorder,
        sampleRate: 44100, // Standard audio rate
        numberOfAudioChannels: 1, // Mono for simplicity
        timeSlice: 1000,
        ondataavailable: (blob: Blob) => {
          console.log('📦 RecordRTC data available, size:', blob.size, 'bytes');
        }
      });
      
      recordRTCRef.current = recordRTC;
      
      // Small delay to ensure stream is fully established
      setTimeout(() => {
        // Start recording
        recordRTC.startRecording();
        console.log('🎙️ RecordRTC recording started');
        
        // Start waveform analysis
        startWaveformAnalysis(stream);
      }, 100);
      
    } catch (err) {
      console.error('❌ Recording start error:', err);
      setIsRecording(false); // Reset recording state on error
      alert('Microphone access denied or not available. Please check your browser permissions.');
    }
  };

  const handleStopRecording = () => {
    if (recordRTCRef.current && isRecording) {
      console.log('⏹️ Stopping RecordRTC recording...');
      
      // Set recording state to false first to prevent premature cleanup
      setIsRecording(false);
      
      recordRTCRef.current.stopRecording(() => {
        try {
          const blob = recordRTCRef.current?.getBlob();
          console.log('🎵 RecordRTC blob created, size:', blob?.size, 'bytes');
          
          if (!blob || blob.size === 0) {
            console.error('❌ RecordRTC blob is empty!');
            alert('Recording failed. Please try again.');
            // Only cleanup after we're sure recording is complete
            setTimeout(() => cleanupRecording(), 100);
            return;
          }
          
          // Convert blob to base64 for persistent storage
          const reader = new FileReader();
          reader.onload = async () => {
            const base64Data = reader.result as string;
            console.log('📄 Base64 data length:', base64Data.length);
            
            setAudioBlob(blob);
            setAudioURL(base64Data);
            setLatestRecordedWord(currentWord);
            
            // Upload to Supabase Storage
            try {
              const fileName = `speech-${Date.now()}.wav`;
              const supabaseUrl = await integrationService.supabase.uploadAudioToStorage(blob, fileName);
              
              if (supabaseUrl) {
                console.log('✅ Audio uploaded to Supabase Storage:', supabaseUrl);
                // Use Supabase URL for playback instead of base64
                setAudioURL(supabaseUrl);
              } else {
                console.log('⚠️ Failed to upload to Supabase, using base64 fallback');
              }
            } catch (error) {
              console.error('❌ Supabase upload failed, using base64 fallback:', error);
            }
            
            // Save to recordings with base64 data as fallback
            const item: SavedRecording = { 
              id: Date.now(), 
              word: currentWord, 
              url: base64Data, 
              blob, 
              createdAt: new Date().toISOString() 
            };
            
            setRecordings(prev => {
              const updated = [item, ...prev].slice(0, 20);
              try {
                // Save base64 data to localStorage for persistence
                const lsItems = updated.map(r => ({ 
                  id: r.id, 
                  word: r.word, 
                  url: r.url, // This is now base64 data
                  createdAt: r.createdAt 
                }));
                localStorage.setItem('recentRecordings', JSON.stringify(lsItems));
                console.log('💾 Saved recording to localStorage with base64 data');
              } catch (error) {
                console.error('❌ Error saving to localStorage:', error);
              }
              return updated;
            });
            
            // Simple analysis and save to Supabase
            const performAnalysis = async () => {
              try {
                setIsAnalyzing(true);
                
                // Create feedback for local state
                const feedback = {
                  word: currentWord,
                  score: 75,
                  clarity: { value: 70, text: 'Good clarity' },
                  wordStress: { value: 75, text: 'Well stressed' },
                  pace: { value: 80, text: 'Good pace' },
                  phonemeAccuracy: { value: 72, text: 'Good sounds' },
                  suggestions: [
                    'Great recording! Keep practicing.',
                    'Listen to the AI voice and mimic it.',
                    'Record yourself and listen back.'
                  ],
                  date: new Date().toISOString()
                };
                
                addFeedback(feedback);
                
                // Save recording metadata to Supabase
                try {
                  const recordingData = {
                    user_id: '', // Will be set by the service
                    word: currentWord,
                    audio_url: audioURL || base64Data, // Use Supabase URL if available, otherwise base64
                    duration: blob.size > 0 ? Math.round(blob.size / 1000) : 0, // Rough duration estimate
                    file_size: blob.size,
                    analysis_score: feedback.score,
                    clarity_score: feedback.clarity.value,
                    accuracy_score: feedback.phonemeAccuracy.value,
                    fluency_score: feedback.pace.value,
                    feedback: 'Good recording quality',
                    suggestions: feedback.suggestions
                  };
                  
                  const savedRecording = await integrationService.supabase.saveRecording(recordingData);
                  if (savedRecording) {
                    console.log('✅ Recording metadata saved to Supabase:', savedRecording.id);
                  } else {
                    console.log('⚠️ Failed to save recording metadata to Supabase');
                  }
                } catch (error) {
                  console.error('❌ Error saving recording metadata to Supabase:', error);
                }
                
              } catch (error) {
                console.error('Analysis failed:', error);
              } finally {
                setIsAnalyzing(false);
              }
            };
            
            performAnalysis();
          };
          
          reader.onerror = () => {
            console.error('❌ Error converting blob to base64');
            alert('Failed to save recording. Please try again.');
            // Only cleanup after we're sure recording is complete
            setTimeout(() => cleanupRecording(), 100);
          };
          
          reader.readAsDataURL(blob);
          
        } catch (error) {
          console.error('❌ Error processing RecordRTC recording:', error);
          alert('Error processing recording. Please try again.');
          // Only cleanup after we're sure recording is complete
          setTimeout(() => cleanupRecording(), 100);
        }
      });
      
      // Stop waveform analysis after recording is complete
      stopWaveformAnalysis();
    }
  };
  
  const cleanupRecording = () => {
    console.log('🧹 Cleaning up recording resources...');
    
    // Only stop the stream if we're not currently recording
    if (streamRef.current && !isRecording) {
      console.log('🛑 Stopping media stream tracks...');
      streamRef.current.getTracks().forEach(track => {
        if (track.readyState === 'live') {
          track.stop();
        }
      });
      streamRef.current = null;
    }
    
    // Clear RecordRTC reference
    if (recordRTCRef.current) {
      console.log('🧹 Clearing RecordRTC reference...');
      recordRTCRef.current = null;
    }
    
    setIsRecording(false);
    stopWaveformAnalysis();
  };

  const handlePlayAudio = () => {
    if (audioURL) {
      try {
        console.log('🎵 Playing user recording:', audioURL.substring(0, 50) + '...');
        setIsPlaying(true);
        
        // Resume audio context if suspended
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          console.log('🔊 Resuming suspended audio context...');
          audioContextRef.current.resume();
        }
        
        // Create audio element with controls for better user experience
        const audio = new Audio(audioURL);
        audio.controls = true; // Show controls for user control
        audio.volume = 1.0; // Ensure volume is not muted
        audio.preload = 'auto';
        
        // Clear previous audio and add new one
        const playbackContainer = document.getElementById('playback-container');
        if (playbackContainer) {
          playbackContainer.innerHTML = '';
          playbackContainer.appendChild(audio);
        }
        
        // Play the audio
        audio.play().then(() => {
          console.log('✅ User audio playback started successfully');
          console.log('🔊 Audio volume:', audio.volume);
        }).catch(error => {
          console.error('❌ Playback error:', error);
          setIsPlaying(false);
          alert('Failed to play audio. Check browser compatibility or audio format.');
        });
        
        // Handle playback events
        audio.onplay = () => {
          console.log('🎵 User audio playback started');
          setIsPlaying(true);
        };
        
        audio.onended = () => {
          console.log('🎵 User audio playback ended');
          setIsPlaying(false);
        };
        
        audio.onerror = (e) => {
          console.error('🎵 User audio error:', e);
          setIsPlaying(false);
          if (audio.error) {
            console.error('🎵 Audio error code:', audio.error.code, 'Message:', audio.error.message);
          }
        };
        
      } catch (error) {
        console.error('❌ Playback setup error:', error);
        setIsPlaying(false);
        alert('Failed to play audio. Check browser compatibility or audio format.');
      }
    } else {
      console.log('❌ No audio URL available to play');
      alert('No recording available to play. Please record something first.');
    }
  };

  const handleClearRecording = () => {
    setAudioURL(null);
    setAudioBlob(null);
    setIsRecording(false);
    setIsPlaying(false);
    cleanupRecording();
  };

  // Recording share/download helpers (match JAM Sessions styling/behavior)
  const sanitizeFileName = (name: string) => name.replace(/[^a-z0-9\-_. ]/gi, '').replace(/\s+/g, '-');
  const buildShareMessage = (rec: SavedRecording) => {
    const dateStr = new Date(rec.createdAt).toLocaleString();
    const title = rec.word || 'Pronunciation Practice';
    return `Sharing my Pronunciation recording: "${title}" (recorded on ${dateStr}).`;
  };
  const handleDownloadRecording = (rec: SavedRecording) => {
    try {
      const a = document.createElement('a');
      a.href = rec.url;
      a.download = `${sanitizeFileName(rec.word || 'recording')}-${rec.id}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {}
  };
  const handleNativeShare = async (rec: SavedRecording) => {
    try {
      // @ts-ignore optional web share API
      if (navigator && navigator.share) {
        const blob = await fetch(rec.url).then(r => r.blob());
        const file = new File([blob], `${sanitizeFileName(rec.word || 'recording')}.webm`, { type: 'audio/webm' });
        // @ts-ignore
        await navigator.share({ title: rec.word || 'Pronunciation Recording', text: buildShareMessage(rec), files: [file] });
      } else {
        alert('Native sharing is not supported on this device. Use WhatsApp or Email buttons.');
      }
    } catch {}
  };

  const handleDeleteRecording = (id: number) => {
    setRecordings(prev => {
      const updated = prev.filter(r => r.id !== id);
      try {
        const lsItems = updated.map(r => ({ id: r.id, word: r.word, url: r.url, createdAt: r.createdAt }));
        localStorage.setItem('recentRecordings', JSON.stringify(lsItems));
      } catch {}
      return updated;
    });
  };

   // const generateNewWord = () => {
   //   const randomWord = sampleWords[Math.floor(Math.random() * sampleWords.length)];
   //   setCurrentWord(randomWord);
   //   handleClearRecording();
   // };

   // Function to update latest recorded word from external source (e.g., from previous page)
   // const updateLatestRecordedWord = (word: string) => {
   //   setLatestRecordedWord(word);
   // };

   // Sound Safari helper functions
   const getRandomPhoneme = () => {
     return PHONEMES[Math.floor(Math.random() * PHONEMES.length)];
   };

   const supportsSpeechRecognition = () => {
     return (
       typeof window !== 'undefined' &&
       ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
     );
   };

   const playPhonemeAudio = () => {
     if (currentPhoneme.phonemeAudio) {
       const audio = new Audio(currentPhoneme.phonemeAudio);
       audio.onerror = () => {
         if ('speechSynthesis' in window) {
           const utter = new window.SpeechSynthesisUtterance(currentPhoneme.tts || currentPhoneme.symbol);
           utter.lang = 'en-US';
           window.speechSynthesis.speak(utter);
         } else {
           setError('Audio and TTS not supported in this browser.');
         }
       };
       audio.onplay = () => setError(null);
       audio.play().catch(() => {
         if ('speechSynthesis' in window) {
           const utter = new window.SpeechSynthesisUtterance(currentPhoneme.tts || currentPhoneme.symbol);
           utter.lang = 'en-US';
           window.speechSynthesis.speak(utter);
         } else {
           setError('Audio and TTS not supported in this browser.');
         }
       });
     } else if ('speechSynthesis' in window) {
       const utter = new window.SpeechSynthesisUtterance(currentPhoneme.tts || currentPhoneme.symbol);
       utter.lang = 'en-US';
       window.speechSynthesis.speak(utter);
     } else {
       setError('Audio and TTS not supported in this browser.');
     }
   };

   const playWordAudio = () => {
     if (currentPhoneme.wordAudio) {
       const audio = new Audio(currentPhoneme.wordAudio);
       audio.onerror = () => {
         if ('speechSynthesis' in window) {
           const utter = new window.SpeechSynthesisUtterance(currentPhoneme.word);
           utter.lang = 'en-US';
           window.speechSynthesis.speak(utter);
         } else {
           setError('Audio and TTS not supported in this browser.');
         }
       };
       audio.onplay = () => setError(null);
       audio.play().catch(() => {
         if ('speechSynthesis' in window) {
           const utter = new window.SpeechSynthesisUtterance(currentPhoneme.word);
           utter.lang = 'en-US';
           window.speechSynthesis.speak(utter);
         } else {
           setError('Audio and TTS not supported in this browser.');
         }
       });
     } else if ('speechSynthesis' in window) {
       const utter = new window.SpeechSynthesisUtterance(currentPhoneme.word);
       utter.lang = 'en-US';
       window.speechSynthesis.speak(utter);
     } else {
       setError('Audio and TTS not supported in this browser.');
     }
   };

   const handleListen = () => {
     setError(null);
     if (!supportsSpeechRecognition()) {
       setError('Speech recognition is not supported in this browser. Please use Google Chrome on desktop.');
       return;
     }
     setListening(true);
     setFeedback("");
     // @ts-ignore
     const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
     // @ts-ignore
     const recognition = new Recognition();
     recognition.lang = 'en-US';
     recognition.interimResults = false;
     recognition.maxAlternatives = 1;
     recognition.onresult = (event: any) => {
       const transcript = event.results[0][0].transcript.toLowerCase();
       if (transcript.includes(currentPhoneme.word.toLowerCase())) {
         setFeedback("success");
         setProgress((p) => p + 1);
         setWordRevealed(true);
         setTimeout(() => playWordAudio(), 600);
       } else {
         setFeedback("try-again");
       }
       setListening(false);
     };
     recognition.onerror = (event: any) => {
       if (event.error === 'not-allowed' || event.error === 'denied') {
         setError('Microphone access denied. Please allow mic access in your browser settings.');
       } else {
         setError('Speech recognition error: ' + event.error);
       }
       setFeedback("try-again");
       setListening(false);
     };
     try {
       recognition.start();
     } catch (e) {
       setError('Could not start speech recognition.');
       setListening(false);
     }
   };

   const handleBoxTap = () => {
     setBoxOpen(true);
     setTimeout(() => setCardFlipped(true), 600);
     setTimeout(() => playPhonemeAudio(), 1200);
   };

   const handleNext = () => {
     setBoxOpen(false);
     setCardFlipped(false);
     setFeedback("");
     setWordRevealed(false);
     setError(null);
     setTimeout(() => {
       setCurrentPhoneme(getRandomPhoneme());
     }, 400);
   };

   const handleFlashcardFlip = (index: number) => {
     setFlippedCard(flippedCard === index ? null : index);
   };

  const renderPronunciationTab = () => (
    <div className="flex flex-col items-center space-y-8">
      <div className="text-center">
        <h2 className="text-5xl font-bold text-white mb-4">Echo Match</h2>
        <div className="bg-gradient-to-r from-white/30 to-white/10 backdrop-blur-sm rounded-xl px-10 py-4 mb-4 border border-white/40 inline-block shadow-2xl">
          <span className="text-5xl md:text-6xl font-black text-transparent bg-gradient-to-r from-blue-200 via-white to-purple-200 bg-clip-text tracking-wider drop-shadow-lg animate-pulse">{latestRecordedWord}</span>
      </div>

        </div>

      <div className="w-[650px] h-[420px] bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-white/50 p-6 relative z-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
          {/* Left Card: Your Pronunciation */}
          <div className="bg-white/10 rounded-xl border border-white/20 p-4 flex flex-col justify-between">
            <div>
              <div className="text-xl text-blue-200 mb-3">Your Pronunciation</div>
              <p className="text-sm text-blue-200/80 mb-4">Record and practice.</p>

                {isPlaying && (
                  <div className="mb-3 p-2 bg-blue-500/20 rounded-lg border border-blue-400/30">
                    <div className="flex items-center gap-2 text-blue-200">
                      <div className="w-3 h-3 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs">Playing...</span>
                    </div>
                  </div>
                )}
                {isAnalyzing && (
                  <div className="mb-3 p-2 bg-blue-500/20 rounded-lg border border-blue-400/30">
                    <div className="flex items-center gap-2 text-blue-200">
                      <div className="w-3 h-3 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs">AI analyzing...</span>
                    </div>
                  </div>
                )}
                

        </div>
            <div className="w-full flex items-center justify-center gap-3">
          <button
            onClick={handlePlayAudio}
            disabled={!audioURL || isPlaying}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center"
                aria-label="Play Recording"
                title="Play Recording"
          >
                <Play className="w-5 h-5" />
          </button>
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
                className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-500 flex items-center justify-center"
                aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
                title={isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            {isRecording ? (
                  <StopCircle className="w-5 h-5" />
            ) : (
                  <Mic className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={handleClearRecording}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-500 flex items-center justify-center"
                aria-label="Clear"
                title="Clear"
          >
                <X className="w-5 h-5" />
          </button>
        </div>
            {/* Moved recording audio player below Recent Activity per request */}
          </div>

          {/* Right Card: AI Pronunciation (S2S) */}
          <div className="bg-white/10 rounded-xl border border-white/20 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="text-xl text-blue-200">AI Pronunciation</div>
                {isEnhancing && <div className="text-sm text-purple-300">Generating…</div>}
              </div>
              {!enhancedURL && !isEnhancing && (
                <div className="text-gray-300 text-sm">Click Play AI Voice to generate and play. Record for best match.</div>
              )}
        </div>
            <div className="w-full flex items-center justify-center gap-3">
              <button
                onClick={async () => {
                  console.log('🎤 Play AI Voice clicked for word:', latestRecordedWord);
                  
                  // Use direct browser speech synthesis for immediate response
                  if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel(); // Stop any current speech
                    
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
                    console.log('🎤 Available voices:', voices.map(v => `${v.name} (${v.lang})`));
                    
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

                    if (selectedVoice) {
                      console.log('✅ Selected voice:', selectedVoice.name, 'Language:', selectedVoice.lang);
                    } else {
                      console.log('⚠️ No preferred voice found, using default');
                    }

                    const utterance = new window.SpeechSynthesisUtterance(latestRecordedWord || 'Hello');
                    utterance.rate = 0.8; // Slower for clarity
                    utterance.pitch = 1.1; // Slightly higher pitch
                    utterance.lang = 'en-US';
                    utterance.volume = 1.0; // Full volume
                    
                    if (selectedVoice) {
                      utterance.voice = selectedVoice;
                    }

                    // Speak the word
                    window.speechSynthesis.speak(utterance);
                    
                    console.log('✅ AI voice generated using browser speech synthesis');
                  } else {
                    console.error('❌ Speech synthesis not supported');
                    alert('Speech synthesis not supported in this browser. Please try a different browser.');
                  }
                }}
                disabled={isPlaying || isEnhancing || (!audioBlob && !latestRecordedWord)}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-lg shadow hover:from-pink-400 hover:to-violet-400 disabled:opacity-50"
              >
                Play AI Voice
              </button>
            </div>
            {enhancedURL && (
              <div className="mt-3 w-full">
                <audio
                  controls
                  src={enhancedURL}
                  className="w-full"
                  ref={aiAudioRef}
                  onLoadedMetadata={() => {
                    try { if (aiAudioRef.current) aiAudioRef.current.playbackRate = aiPlaybackRate; } catch {}
                  }}
                />
                <div className="mt-2 flex items-center gap-2 text-xs text-blue-200">
                  <span>AI speed</span>
                  <input
                    type="range"
                    min="0.6"
                    max="1.2"
                    step="0.05"
                    value={aiPlaybackRate}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setAiPlaybackRate(v);
                      try { if (aiAudioRef.current) aiAudioRef.current.playbackRate = v; } catch {}
                    }}
                    className="w-32 accent-purple-400"
                  />
                  <span>{aiPlaybackRate.toFixed(2)}x</span>
                </div>
              </div>
            )}
            {/* Error banner intentionally hidden per request */}
          </div>
        </div>

        {/* My Recordings section moved below main content; duplicate removed */}
      </div>
    </div>
  );

        const renderFlashcardsTab = () => (
     <div className="flex flex-col items-center space-y-8">
       <h2 className="text-5xl font-bold text-white mb-8">Flash Cards</h2>
       <div className="w-[650px] h-[420px] bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-white/50 p-8">
         <div className="grid grid-cols-1 gap-6 h-full overflow-y-auto">
           {flashcardData.map((card, index) => (
             <div 
               key={index} 
               className={`relative cursor-pointer transition-all duration-500 transform ${
                 flippedCard === index ? 'rotate-y-180' : ''
               }`}
               onClick={() => handleFlashcardFlip(index)}
             >
                               <div className={`w-full h-32 bg-white/20 rounded-xl border border-white/30 p-6 transition-all duration-500 ${
                  flippedCard === index ? 'opacity-0' : 'opacity-100'
                }`}>
                  {/* Front of card - Word only */}
                  <div className="flex items-center justify-center h-full">
                    <h3 className="text-3xl font-bold text-white text-center">{card.word}</h3>
                  </div>
                </div>
               
                               {/* Back of card - Meaning and Example */}
                <div className={`absolute inset-0 w-full h-32 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-xl border border-white/30 p-6 transition-all duration-500 ${
                  flippedCard === index ? 'opacity-100' : 'opacity-0'
                }`}>
                  <div className="h-full flex flex-col justify-center">
                    <div className="text-center mb-3">
                      <h4 className="text-lg font-semibold text-white mb-1">Meaning:</h4>
                      <p className="text-blue-200 text-sm">{card.meaning}</p>
                    </div>
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-white mb-1">Example:</h4>
                      <p className="text-gray-300 italic text-sm">"{card.sentence}"</p>
                    </div>
                  </div>
                </div>
             </div>
           ))}
         </div>
       </div>
     </div>
   );

     const renderTongueTwisterTab = () => (
     <div className="flex flex-col items-center space-y-8">
       <h2 className="text-5xl font-bold text-white mb-8">Tongue Twister</h2>
       <div className="w-[650px] h-[420px] bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-white/50 p-8 flex flex-col items-center justify-center">
         <div className="text-center mb-8">
           <h3 className="text-2xl font-bold text-white mb-4">Challenge</h3>
           <p className="text-xl text-blue-200 leading-relaxed">
             {tongueTwisters[0]}
           </p>
         </div>
         
         <div className="flex gap-6">
           <button
             onClick={handleStartRecording}
             disabled={isRecording}
             className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-lg hover:bg-blue-700 transition disabled:opacity-50"
           >
             {isRecording ? 'Recording...' : 'Start Challenge'}
           </button>
           
           <button
             onClick={handleStopRecording}
             disabled={!isRecording}
             className="px-8 py-3 bg-red-600 text-white rounded-lg font-semibold shadow-lg hover:bg-red-700 transition disabled:opacity-50"
           >
             Stop
           </button>
         </div>
       </div>
     </div>
   );

   const renderSoundSafariTab = () => (
     <div className="flex flex-col items-center space-y-8">
       <h2 className="text-5xl font-bold text-white mb-8">Sound Safari</h2>
       
       {/* Mystery Sound Box Game */}
       <div className="w-[650px] h-[420px] bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-white/50 p-8 flex flex-col items-center justify-center">
         <div className="text-center mb-4">
           <h3 className="text-2xl font-bold text-white mb-2">Mystery Sound Box</h3>
           <p className="text-lg text-blue-200">Tap the box to reveal a sound and a clue. Pronounce the word to solve the mystery!</p>
         </div>

         {/* Error/Support Warnings */}
         {error && (
           <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-3 text-red-200 text-sm max-w-md">
             {error}
           </div>
         )}

         {/* Progress */}
         <div className="mb-4">
           <div className="text-white text-lg mb-2 text-center">Progress: {progress}/10</div>
           <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden mx-auto">
             <div 
               className="h-full bg-green-400 transition-all duration-500" 
               style={{ width: `${(progress / 10) * 100}%` }}
             ></div>
           </div>
         </div>

         {/* Mystery Box */}
         <button
           onClick={handleBoxTap}
           disabled={boxOpen}
           className="mb-4 focus:outline-none transition-all duration-500 hover:scale-105 disabled:opacity-50"
         >
           <div className={`transition-all duration-500 ${boxOpen ? 'scale-110' : ''}`}>
             <svg width="100" height="70" viewBox="0 0 140 100">
               <rect x="20" y="40" width="80" height="40" rx="8" fill="#FFD966" stroke="#7C3AED" strokeWidth="4" />
               <rect x="20" y="30" width="80" height="20" rx="8" fill="#A78BFA" />
               <rect x="45" y="50" width="30" height="25" rx="4" fill="#FBBF24" stroke="#7C3AED" strokeWidth="3" />
               <circle cx="60" cy="62" r="4" fill="#7C3AED" />
             </svg>
           </div>
         </button>

         {/* Card Content */}
         {boxOpen && (
           <div className={`transition-all duration-500 ${cardFlipped ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} w-full max-w-md`}>
             <div className="bg-white/20 rounded-xl p-4 border border-white/30 text-center">
               <div className="text-3xl font-bold text-white mb-3">{currentPhoneme.symbol}</div>
               <div className="text-lg text-blue-200 mb-3">{currentPhoneme.hint}</div>
               
               {wordRevealed && (
                 <div className="text-xl font-bold text-green-400 mb-3">{currentPhoneme.word}</div>
               )}

               {/* Feedback */}
               {feedback === "success" && (
                 <div className="text-green-400 text-base mb-3">🎉 Correct! Well done!</div>
               )}
               {feedback === "try-again" && (
                 <div className="text-yellow-400 text-base mb-3">Try again! Listen carefully to the sound.</div>
               )}

               {/* Controls */}
               <div className="flex flex-wrap gap-2 justify-center">
                 <button
                   onClick={playPhonemeAudio}
                   className="px-3 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow-lg hover:bg-blue-700 transition text-sm"
                 >
                   <Volume2 className="w-3 h-3 inline mr-1" />
                   Listen
                 </button>
                 
                 {wordRevealed && (
                   <button
                     onClick={playWordAudio}
                     className="px-3 py-2 bg-green-600 text-white rounded-lg font-semibold shadow-lg hover:bg-green-700 transition text-sm"
                   >
                     <Play className="w-3 h-3 inline mr-1" />
                     Hear Word
                   </button>
                 )}

                 <button
                   onClick={handleListen}
                   disabled={listening || !wordRevealed}
                   className="px-3 py-2 bg-purple-600 text-white rounded-lg font-semibold shadow-lg hover:bg-purple-700 transition disabled:opacity-50 text-sm"
                 >
                   {listening ? (
                     <>
                       <Mic className="w-3 h-3 inline mr-1 animate-pulse" />
                       Listening...
                     </>
                   ) : (
                     <>
                       <Mic className="w-3 h-3 inline mr-1" />
                       Say Word
                     </>
                   )}
                 </button>

                 <button
                   onClick={handleNext}
                   className="px-3 py-2 bg-gray-600 text-white rounded-lg font-semibold shadow-lg hover:bg-gray-700 transition text-sm"
                 >
                   Next
                 </button>
               </div>
             </div>
           </div>
         )}

         {/* Instructions */}
         {!boxOpen && (
           <div className="text-center text-blue-200 text-sm mt-2">
             Tap the treasure box above to start the mystery sound game!
           </div>
         )}
       </div>
     </div>
   );

  return (
    <div className="min-h-[160vh] bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col pb-16">
      {/* Header */}
      <header className="flex items-center justify-between px-16 py-4 bg-white/10 shadow-md">
        <div className="flex items-center flex-1">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
              <Brain className="w-7 h-7 text-white" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
          </div>
          <div className="flex flex-col ml-4">
            <span className="text-2xl font-bold text-white tracking-tight">
              Vocab<span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Pro</span>
            </span>
            <span className="text-xs text-gray-300 font-medium tracking-wide">Learn • Practice • Excel</span>
          </div>
        </div>
        
        <div className="flex-1 flex justify-center">
          <h1 className="text-5xl font-bold text-white">Pronunciation Practice</h1>
        </div>
        
        <div className="flex items-center flex-1 justify-end">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-12 h-12 rounded-full border-2 border-blue-400 shadow-md object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full border-2 border-blue-400 shadow-md bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-xl font-bold">
              {initials}
            </div>
          )}
        </div>
      </header>

      {/* Back to Dashboard Button */}
      <div className="px-16 py-2">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all duration-300 border border-white/30 hover:border-white/50 shadow-md hover:shadow-lg transform hover:scale-105"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex justify-center pt-12 pb-12 px-4">
        <div className="max-w-8xl w-full flex justify-center gap-12">
          {/* Left Section */}
          <div className="flex flex-col items-center flex-1 max-w-4xl">
            {/* Tab Bar */}
            <div className="flex gap-6 mb-4 mt-8">
                             {[
                 { id: 'pronunciation', label: 'Pronunciation', icon: Volume2 },
                 { id: 'flashcards', label: 'Flash Cards', icon: BookOpen },
                 { id: 'tongue-twister', label: 'Tongue Twister', icon: MessageSquare },
                 { id: 'sound-safari', label: 'Sound Safari', icon: Music }
               ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-8 py-3 rounded-lg font-semibold text-xl transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-white text-purple-900 border-2 shadow-lg transform scale-105'
                      : 'bg-white/20 text-white hover:bg-white/40 hover:text-white border-2 border-white/30 hover:border-white/50'
                  }`}
                >
                  <tab.icon className="w-6 h-6 inline mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>

                         {/* Tab Content */}
             <div className="w-full flex justify-center">
               {activeTab === 'pronunciation' && renderPronunciationTab()}
               {activeTab === 'flashcards' && renderFlashcardsTab()}
               {activeTab === 'tongue-twister' && renderTongueTwisterTab()}
               {activeTab === 'sound-safari' && renderSoundSafariTab()}
             </div>
          </div>

          {/* Right Sidebar - Hide when Flashcards tab is active */}
          {activeTab !== 'flashcards' && (
            <div className={`w-[380px] ${activeTab === 'pronunciation' ? 'h-[720px]' : 'h-[680px]'} bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-blue-200/50 p-10 flex flex-col`}>
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mr-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white">Learn Insights</h3>
            </div>
            <div className="flex-1">
              <p className="text-lg text-blue-200 mb-6">
                Track your pronunciation progress and get personalized feedback to improve your speaking skills.
              </p>
              <div className="space-y-4">
                {(() => {
                  const insights = generateInsightsData();
                  return (
                    <>
                <div className="bg-white/20 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Accuracy Score</h4>
                        <div className="text-2xl font-bold text-green-400">
                          {insights.totalRecordings > 0 ? Math.round(insights.averageScore) : 0}%
                </div>
                      </div>
                <div className="bg-white/20 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Words Practiced</h4>
                        <div className="text-2xl font-bold text-blue-400">{insights.totalWords}</div>
                </div>
                <div className="bg-white/20 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Practice Time</h4>
                        <div className="text-2xl font-bold text-purple-400">
                          {insights.practiceTime > 0 ? `${Math.round(insights.practiceTime)}m` : '0m'}
                </div>
              </div>
                    </>
                  );
                })()}
            </div>
            </div>
            <button 
              onClick={() => setShowDetailedReport(true)}
              className="w-full px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg shadow-xl border-2 border-blue-200/50 backdrop-blur-sm hover:bg-blue-700 transition-all duration-300"
            >
              View Detailed Report
            </button>
          </div>
          )}
        </div>
      </main>

      {/* Recent Words section - Always show */}
      <div className="mt-8 w-full max-w-7xl mx-auto bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl border border-blue-300/30 p-6 relative z-30">
        <div className="text-2xl font-bold text-blue-100 mb-4 flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          Recent Words
          <span className="text-sm font-normal text-blue-200/70">({vocabList ? vocabList.length : 0})</span>
          </div>
          
        {vocabList && vocabList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {vocabList.slice(-12).map((vocab, index) => (
              <button
                key={index}
                onClick={() => {
                  setLatestRecordedWord(vocab.word);
                  setCurrentWord(vocab.word);
                  // Clear previous recordings for new word
                  setAudioURL(null);
                  setAudioBlob(null);
                  setEnhancedURL(null);
                }}
                className="group px-4 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl border border-white/20 hover:border-blue-300/50 transition-all duration-200 transform hover:scale-105 hover:shadow-lg relative"
                disabled={isEnhancing}
              >
                {isEnhancing && latestRecordedWord === vocab.word && (
                  <div className="absolute inset-0 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
                </div>
                )}
                <div className="text-white font-medium text-sm group-hover:text-blue-200 transition-colors">
                  {vocab.word}
              </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-white/60 mb-2">No words added yet</div>
            <div className="text-white/40 text-sm">
              Add words from the <button 
                onClick={() => navigate('/vocabpractice')} 
                className="text-blue-300 hover:text-blue-200 underline"
              >
                Vocabulary Practice
              </button> page to see them here
            </div>
          </div>
        )}
        </div>
        
      {/* Full-width recordings section below main content */}
      {recordings.length > 0 && (
        <div className="mt-8 w-full max-w-7xl mx-auto bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 p-6 relative z-30">
          <div className="text-2xl font-bold text-blue-100 mb-4">My Recordings</div>
          <ul className="divide-y divide-white/20 max-h-[32rem] overflow-y-auto">
            {recordings.map(r => (
              <li key={r.id} className="py-5">
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_auto_auto_auto_auto_auto] gap-4 items-center">
                  <div className="text-sm text-white/90 font-semibold truncate" title={r.word || 'Recording'}>{r.word || 'Recording'}</div>
                  <audio controls src={r.url} className="w-full" />
                  <div className="text-blue-200 text-xs whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</div>
                  <div className="flex flex-nowrap items-center gap-2 justify-end">
                    <button onClick={() => handleDeleteRecording(r.id)} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium whitespace-nowrap">Delete</button>
                    <button onClick={() => handleDownloadRecording(r)} className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-medium whitespace-nowrap">Download</button>
                    <button onClick={() => handleNativeShare(r)} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium whitespace-nowrap">Share</button>
                    {(() => {
                      const message = buildShareMessage(r);
                      const waHref = `https://wa.me/?text=${encodeURIComponent(message)}`;
                      return (
                        <a href={waHref} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium whitespace-nowrap">WhatsApp</a>
                      );
                    })()}
                    {(() => {
                      const message = buildShareMessage(r);
                      const mailHref = `mailto:?subject=${encodeURIComponent('Pronunciation Recording: ' + (r.word || 'Recording'))}&body=${encodeURIComponent(message)}`;
                      return (
                        <a href={mailHref} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium whitespace-nowrap">Email</a>
                      );
                    })()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation now placed below recordings */}
      <div className="w-full mt-4 px-0">
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/vocabpractice')}
            className="px-12 py-4 bg-gray-600 text-white rounded-lg font-semibold text-xl shadow-lg hover:bg-gray-700 transition"
          >
            Back
          </button>
          <button
            onClick={() => navigate('/spelling-practice')}
            className="px-12 py-4 bg-blue-600 text-white rounded-lg font-semibold text-xl shadow-lg hover:bg-blue-700 transition"
          >
            Next
          </button>
        </div>
      </div>
      {/* Detailed Report Modal */}
      {showDetailedReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 rounded-3xl border border-white/20 shadow-2xl max-w-7xl w-full my-8">
            {(() => {
              const insights = generateInsightsData();
              return (
                <div className="p-8">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h1 className="text-4xl font-bold text-white mb-2">Pronunciation Insights Report</h1>
                      <p className="text-blue-200">Comprehensive analysis of your pronunciation progress</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleExportReport}
                        disabled={isExportingPDF}
                        className={`px-6 py-3 bg-gradient-to-r text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                          isExportingPDF 
                            ? 'from-gray-500 to-gray-600 cursor-not-allowed' 
                            : 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                        }`}
                      >
                        {isExportingPDF ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <Download className="w-5 h-5" />
                            Export PDF
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setShowDetailedReport(false)}
                        className="px-6 py-3 bg-gray-600/50 text-white rounded-xl font-semibold hover:bg-gray-500/50 transition-all duration-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <GlossyKPICard
                      title="Overall Score"
                      value={`${Math.round(insights.averageScore)}%`}
                      subtitle="Average accuracy"
                      icon={<TrendingUp className="w-6 h-6" />}
                      gradient="from-green-500 to-emerald-600"
                      trend={insights.averageScore > 75 ? 'up' : insights.averageScore > 50 ? 'stable' : 'down'}
                    />
                    <GlossyKPICard
                      title="Words Practiced"
                      value={insights.totalWords}
                      subtitle={`${insights.totalRecordings} recordings`}
                      icon={<BookOpen className="w-6 h-6" />}
                      gradient="from-blue-500 to-cyan-600"
                      trend="up"
                    />
                    <GlossyKPICard
                      title="Average Clarity"
                      value={`${Math.round(insights.averageClarity)}%`}
                      subtitle="Speech clarity"
                      icon={<Volume2 className="w-6 h-6" />}
                      gradient="from-purple-500 to-pink-600"
                      trend={insights.averageClarity > 70 ? 'up' : 'stable'}
                    />
                    <GlossyKPICard
                      title="Practice Time"
                      value={`${Math.round(insights.practiceTime)}min`}
                      subtitle="Total practice"
                      icon={<Clock className="w-6 h-6" />}
                      gradient="from-orange-500 to-red-600"
                      trend="up"
                    />
                  </div>

                  {/* Charts Section */}
                  <div className="space-y-8">
                    {/* Pronunciation Scores Chart */}
                    {insights.pronunciationScores.length > 0 && (
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                          <BarChart3 className="w-6 h-6" />
                          Word Performance Analysis
                        </h2>
                        <GlossyPronunciationChart data={insights.pronunciationScores} />
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Phoneme Accuracy Chart */}
                      {insights.phonemeData.length > 0 && (
                        <div>
                          <h2 className="text-2xl font-bold text-white mb-4">Phoneme Accuracy</h2>
                          <GlossyPhonemeChart data={insights.phonemeData} />
                        </div>
                      )}

                      {/* Communication Style Radar */}
                      {insights.communicationData.length > 0 && (
                        <div>
                          <h2 className="text-2xl font-bold text-white mb-4">Communication Style</h2>
                          <GlossyCommunicationChart data={insights.communicationData} />
                        </div>
                      )}
                    </div>

                    {/* Progress Over Time */}
                    {insights.progressData.length > 1 && (
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-4">Progress Over Time</h2>
                        <GlossyProgressChart data={insights.progressData} />
                      </div>
                    )}

                    {/* Difficulty Distribution */}
                    {insights.difficultyData.some(d => d.count > 0) && (
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-4">Word Difficulty Distribution</h2>
                        <RechartsGlossyBar data={insights.difficultyData} />
                      </div>
                    )}

                    {/* Learning Progress Area Chart */}
                    {insights.progressData.length > 1 && (
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-4">Learning Journey</h2>
                        <RechartsGlossyArea data={insights.progressData} />
                      </div>
                    )}
                  </div>

                  {/* Insights Summary */}
                  <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10">
                    <h2 className="text-2xl font-bold text-white mb-4">Key Insights</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-blue-200 mb-3">Strengths</h3>
                        <ul className="space-y-2 text-white/80">
                          {insights.averageScore > 75 && <li className="flex items-center gap-2"><Award className="w-4 h-4 text-green-400" />High overall accuracy</li>}
                          {insights.averageClarity > 70 && <li className="flex items-center gap-2"><Award className="w-4 h-4 text-green-400" />Clear speech patterns</li>}
                          {insights.totalWords > 5 && <li className="flex items-center gap-2"><Award className="w-4 h-4 text-green-400" />Diverse vocabulary practice</li>}
                          {insights.totalRecordings > 3 && <li className="flex items-center gap-2"><Award className="w-4 h-4 text-green-400" />Consistent practice routine</li>}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-orange-200 mb-3">Areas for Improvement</h3>
                        <ul className="space-y-2 text-white/80">
                          {insights.averageScore < 75 && <li className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-orange-400" />Focus on pronunciation accuracy</li>}
                          {insights.averageClarity < 70 && <li className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-orange-400" />Improve speech clarity</li>}
                          {insights.totalWords < 5 && <li className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-orange-400" />Practice more diverse vocabulary</li>}
                          {insights.practiceTime < 5 && <li className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-orange-400" />Increase practice duration</li>}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* No Data Message */}
                  {insights.totalRecordings === 0 && (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🎤</div>
                      <h3 className="text-2xl font-bold text-white mb-2">No Recordings Yet</h3>
                      <p className="text-blue-200 mb-6">Start recording words to see your pronunciation insights and detailed analytics.</p>
                      <button
                        onClick={() => setShowDetailedReport(false)}
                        className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300"
                      >
                        Start Recording
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default PronunciationPractice; 