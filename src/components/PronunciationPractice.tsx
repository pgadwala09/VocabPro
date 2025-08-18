import React, { useState, useRef, useEffect } from 'react';
import { Play, Mic, StopCircle, X, Brain, Sparkles, Volume2, BookOpen, MessageSquare, Music } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

// Add interface for pronunciation feedback
interface PronunciationFeedback {
  word: string;
  overallScore: number;
  clarity: {
    score: number;
    feedback: string;
  };
  wordStress: {
    score: number;
    feedback: string;
  };
  pace: {
    score: number;
    feedback: string;
  };
  phonemeAccuracy: {
    score: number;
    feedback: string;
  };
  suggestions: string[];
}

const PronunciationPractice: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pronunciation');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWord, setCurrentWord] = useState('Pronunciation');
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const [recordingWaveform, setRecordingWaveform] = useState<number[]>([]);
  const [originalWaveform, setOriginalWaveform] = useState<number[]>([]);
  const [latestRecordedWord, setLatestRecordedWord] = useState<string>('Apple');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Add pronunciation feedback state
  const [pronunciationFeedback, setPronunciationFeedback] = useState<PronunciationFeedback | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  const avatarUrl = user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name || user?.email || '';
  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // Sample data for different tabs
  const sampleWords = ['Hello', 'World', 'Practice', 'Pronunciation', 'Language', 'Learning'];
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

  const soundSafariData = [
    { sound: 'Ocean Waves', description: 'Listen to the calming sound of ocean waves', difficulty: 'Easy' },
    { sound: 'Bird Songs', description: 'Identify different bird species by their songs', difficulty: 'Medium' },
    { sound: 'City Sounds', description: 'Recognize various urban sounds and noises', difficulty: 'Hard' }
  ];

  // Sound Safari state
  const [boxOpen, setBoxOpen] = useState(false);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [currentPhoneme, setCurrentPhoneme] = useState(PHONEMES[0]);
  const [feedback, setFeedback] = useState("");
  const [progress, setProgress] = useState(0);
  const [listening, setListening] = useState(false);
  const [wordRevealed, setWordRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micSupported, setMicSupported] = useState(true);
  const [micPermission, setMicPermission] = useState(true);

  // Flashcard state
  const [flippedCard, setFlippedCard] = useState<number | null>(null);

  // Sample recent activity data - words selected from previous page
  const recentWords = [
    { word: 'Ephemeral', timestamp: '2 min ago', difficulty: 'Hard' },
    { word: 'Ubiquitous', timestamp: '5 min ago', difficulty: 'Medium' },
    { word: 'Serendipity', timestamp: '8 min ago', difficulty: 'Hard' },
    { word: 'Eloquent', timestamp: '12 min ago', difficulty: 'Medium' },
    { word: 'Perseverance', timestamp: '15 min ago', difficulty: 'Easy' }
  ];

  const startWaveformAnalysis = (stream: MediaStream) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const source = audioContextRef.current.createMediaStreamSource(stream);
    const analyser = audioContextRef.current.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateWaveform = () => {
      if (!isRecording) return;
      
      analyser.getByteFrequencyData(dataArray);
      const waveformData = Array.from(dataArray).slice(0, 32); // Take first 32 values for visualization
      setRecordingWaveform(waveformData);
      
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    };
    
    updateWaveform();
  };

  const stopWaveformAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setRecordingWaveform([]);
  };

  const handleStartRecording = async () => {
    setAudioURL(null);
    setAudioBlob(null);
    audioChunks.current = [];
    setRecordingWaveform([]);
    setPronunciationFeedback(null); // Clear previous feedback
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          audioChunks.current.push(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        // Update the latest recorded word when recording is completed
        setLatestRecordedWord(currentWord);
        stream.getTracks().forEach(track => track.stop());
        stopWaveformAnalysis();
      };
      mediaRecorder.start();
      setIsRecording(true);
      startWaveformAnalysis(stream);
    } catch (err) {
      alert('Microphone access denied or not available.');
    }
  };

  const generateNewWord = () => {
    const randomWord = sampleWords[Math.floor(Math.random() * sampleWords.length)];
    setCurrentWord(randomWord);
    setLatestRecordedWord(randomWord);
    setPronunciationFeedback(null); // Clear previous feedback
    handleClearRecording();
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Simulate getting the latest recorded word from the previous page
  useEffect(() => {
    // This would typically come from a context, localStorage, or API
    // For now, we'll simulate it with a sample word
    const getLatestWordFromPreviousPage = () => {
      // Simulate getting the latest word from vocabulary practice
      const sampleLatestWords = ['Apple', 'Ubiquitous', 'Serendipity', 'Eloquent', 'Perseverance'];
      const randomLatestWord = sampleLatestWords[Math.floor(Math.random() * sampleLatestWords.length)];
      setLatestRecordedWord(randomLatestWord);
    };
    
    getLatestWordFromPreviousPage();
  }, []);

  // AI Pronunciation Analysis Function
  const analyzePronunciation = async (audioBlob: Blob, word: string): Promise<PronunciationFeedback> => {
    // Simulate AI analysis with realistic feedback
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
    
    const clarityScore = Math.floor(Math.random() * 30) + 70; // 70-100
    const wordStressScore = Math.floor(Math.random() * 25) + 75; // 75-100
    const paceScore = Math.floor(Math.random() * 35) + 65; // 65-100
    const phonemeScore = Math.floor(Math.random() * 40) + 60; // 60-100
    
    const overallScore = Math.round((clarityScore + wordStressScore + paceScore + phonemeScore) / 4);
    
    return {
      word,
      overallScore,
      clarity: {
        score: clarityScore,
        feedback: clarityScore >= 85 ? "Clear with minor slurs" : 
                 clarityScore >= 70 ? "Generally clear, some slurring" : "Needs improvement in clarity"
      },
      wordStress: {
        score: wordStressScore,
        feedback: wordStressScore >= 85 ? "AP-ple-..." : 
                 wordStressScore >= 70 ? "Good stress pattern" : "Work on syllable stress"
      },
      pace: {
        score: paceScore,
        feedback: paceScore >= 85 ? "Excellent, especially \"fv\" and \"h\" sounds" : 
                 paceScore >= 70 ? "Good pace, some hesitation" : "A bit fast - try pausing more"
      },
      phonemeAccuracy: {
        score: phonemeScore,
        feedback: phonemeScore >= 85 ? "Very precise sounds" : 
                 phonemeScore >= 70 ? "Mostly accurate" : "Focus on individual sounds"
      },
      suggestions: [
        "Emphasize second syllables",
        "Slow speech when pronouncing multisyllabic words."
      ]
    };
  };

  // Handle pronunciation analysis after recording
  const handlePronunciationAnalysis = async () => {
    if (!audioBlob) return;
    
    setIsAnalyzing(true);
    try {
      const feedback = await analyzePronunciation(audioBlob, currentWord);
      setPronunciationFeedback(feedback);
      console.log('Pronunciation feedback set:', feedback); // Debug log
    } catch (error) {
      console.error('Error analyzing pronunciation:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Update handleStopRecording to trigger analysis
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopWaveformAnalysis();
      
      // Trigger pronunciation analysis after recording stops
      setTimeout(() => {
        handlePronunciationAnalysis();
      }, 500);
    }
  };

  const handlePlayAudio = () => {
    if (audioURL) {
      setIsPlaying(true);
      const audio = new Audio(audioURL);
      audio.onended = () => setIsPlaying(false);
      audio.play();
    }
  };

  const handleClearRecording = () => {
    setAudioURL(null);
    setAudioBlob(null);
    setIsRecording(false);
    setIsPlaying(false);
    setRecordingWaveform([]);
    setPronunciationFeedback(null); // Clear pronunciation feedback
    stopWaveformAnalysis();
  };



   // Function to update latest recorded word from external source (e.g., from previous page)
   const updateLatestRecordedWord = (word: string) => {
     setLatestRecordedWord(word);
   };

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
       setMicSupported(false);
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
         setMicPermission(false);
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
        <div className="bg-white/20 backdrop-blur-sm rounded-xl px-8 py-3 mb-4 border border-white/30 inline-block">
          <span className="text-2xl font-bold text-white">{currentWord}</span>
        </div>
        <p className="text-2xl text-blue-200 mt-4">Listen and repeat the word</p>
        <button
          onClick={generateNewWord}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg font-semibold shadow hover:bg-blue-600 transition"
        >
          New Word
        </button>
        <button
          onClick={() => {
            const testFeedback = {
              word: currentWord,
              overallScore: 89,
              clarity: { score: 85, feedback: "Clear with minor slurs" },
              wordStress: { score: 92, feedback: "AP-ple-..." },
              pace: { score: 88, feedback: "Excellent, especially \"fv\" and \"h\" sounds" },
              phonemeAccuracy: { score: 75, feedback: "A bit fast - try pausing more" },
              suggestions: ["Emphasize second syllables", "Slow speech when pronouncing multisyllabic words."]
            };
            setPronunciationFeedback(testFeedback);
          }}
          className="mt-2 px-6 py-2 bg-green-500 text-white rounded-lg font-semibold shadow hover:bg-green-600 transition"
        >
          Test AI Feedback
        </button>
      </div>

      <div className="w-[650px] h-[320px] bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-white/50 p-8 flex flex-col items-center justify-center">
        {/* Waveform visualization */}
        <div className="mb-8">
          <div className="text-xl text-blue-200 mb-2">Your Recording</div>
          <div className="flex items-center gap-4">
            <svg width="320" height="40" className="mb-2">
              {recordingWaveform.length > 0 ? (
                // Real-time recording waveform
                <g>
                  {recordingWaveform.map((value, index) => {
                    const x = (index / recordingWaveform.length) * 320;
                    const height = (value / 255) * 30;
                    const y = 20 - height / 2;
                    return (
                      <rect
                        key={index}
                        x={x}
                        y={y}
                        width={8}
                        height={height}
                        fill="white"
                        rx="2"
                      />
                    );
                  })}
                </g>
              ) : (
                // Static waveform when not recording
                <path
                  d="M0,20 L20,10 L40,30 L60,5 L80,35 L100,15 L120,25 L140,8 L160,32 L180,12 L200,28 L220,6 L240,34 L260,18 L280,22 L300,14 L320,26"
                  stroke="white"
                  strokeWidth="5"
                  fill="none"
                />
              )}
            </svg>
            <div className="text-xl font-bold text-white min-w-[60px]">
              {isRecording && recordingWaveform.length > 0 
                ? `${Math.round((recordingWaveform.reduce((sum, val) => sum + val, 0) / recordingWaveform.length / 255) * 100)}%`
                : '0%'
              }
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="text-xl text-blue-200 mb-2">Original Audio</div>
          <div className="flex items-center gap-4">
            <svg width="320" height="40" className="mb-2">
              <path
                d="M0,20 L20,15 L40,25 L60,10 L80,30 L100,20 L120,30 L140,15 L160,25 L180,20 L200,30 L220,10 L240,25 L260,15 L280,20 L300,25 L320,15"
                stroke="#60A5FA"
                strokeWidth="5"
                fill="none"
              />
            </svg>
            <div className="text-xl font-bold text-white min-w-[60px]">
              85%
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-6">
          <button
            onClick={handlePlayAudio}
            disabled={!audioURL || isPlaying}
            className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110 disabled:opacity-50"
          >
            <Play className="w-8 h-8 text-white ml-1" />
          </button>
          
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110"
          >
            {isRecording ? (
              <StopCircle className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>
          
          <button
            onClick={handleClearRecording}
            className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110"
          >
            <X className="w-8 h-8 text-white" />
          </button>
        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col">
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

      {/* Main Content */}
      <main className="flex-1 flex justify-center pt-12 px-4">
        <div className="max-w-8xl w-full flex justify-center gap-12">
          {/* Left Section */}
          <div className="flex flex-col items-center flex-1 max-w-4xl">
            {/* Tab Bar */}
            <div className="flex gap-6 mb-4 mt-8">
                             {[
                 { id: 'pronunciation', label: 'Vocabulary', icon: Volume2 },
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

          {/* Right Sidebar */}
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
              
              {activeTab === 'pronunciation' && pronunciationFeedback ? (
                // Pronunciation Feedback Section
                <div className="space-y-6">
                  {/* Overall Score */}
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl font-bold text-white">{pronunciationFeedback.overallScore}</span>
                    </div>
                    <div className="text-white text-lg">/100</div>
                    <div className="text-white text-xl font-semibold">{pronunciationFeedback.word}</div>
                  </div>

                  {/* Pronunciation Metrics */}
                  <div className="space-y-4">
                    {/* Clarity */}
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🎤</span>
                          <span className="text-white font-medium">Clarity</span>
                        </div>
                        <span className="text-white text-sm">{pronunciationFeedback.clarity.score}%</span>
                      </div>
                      <div className="text-white text-sm mb-2">How clear was my pronunciation?</div>
                      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-2">
                        <div 
                          className="h-2 bg-blue-400 transition-all duration-500" 
                          style={{ width: `${pronunciationFeedback.clarity.score}%` }}
                        ></div>
                      </div>
                      <div className="text-white text-sm">{pronunciationFeedback.clarity.feedback}</div>
                    </div>

                    {/* Word Stress */}
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🎶</span>
                          <span className="text-white font-medium">Word Stress</span>
                        </div>
                        <span className="text-white text-sm">{pronunciationFeedback.wordStress.score}%</span>
                      </div>
                      <div className="text-white text-sm mb-2">Did I stress the syllables correctly?</div>
                      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-2">
                        <div 
                          className="h-2 bg-blue-400 transition-all duration-500" 
                          style={{ width: `${pronunciationFeedback.wordStress.score}%` }}
                        ></div>
                      </div>
                      <div className="text-white text-sm">{pronunciationFeedback.wordStress.feedback}</div>
                    </div>

                    {/* Pace */}
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">⏰</span>
                          <span className="text-white font-medium">Pace</span>
                        </div>
                        <span className="text-white text-sm">{pronunciationFeedback.pace.score}%</span>
                      </div>
                      <div className="text-white text-sm mb-2">Was I speaking at an appropriate speed?</div>
                      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-2">
                        <div 
                          className="h-2 bg-blue-400 transition-all duration-500" 
                          style={{ width: `${pronunciationFeedback.pace.score}%` }}
                        ></div>
                      </div>
                      <div className="text-white text-sm">{pronunciationFeedback.pace.feedback}</div>
                    </div>

                    {/* Phoneme Accuracy */}
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🎶🎶</span>
                          <span className="text-white font-medium">Phoneme Accuracy</span>
                        </div>
                        <span className="text-white text-sm">{pronunciationFeedback.phonemeAccuracy.score}%</span>
                      </div>
                      <div className="text-white text-sm mb-2">How precise were my sounds?</div>
                      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-2">
                        <div 
                          className="h-2 bg-blue-400 transition-all duration-500" 
                          style={{ width: `${pronunciationFeedback.phonemeAccuracy.score}%` }}
                        ></div>
                      </div>
                      <div className="text-white text-sm">{pronunciationFeedback.phonemeAccuracy.feedback}</div>
                    </div>

                    {/* Suggestions */}
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-white font-semibold mb-2">Suggestions</div>
                      <ul className="space-y-1">
                        {pronunciationFeedback.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-white text-sm">• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                // Default Stats Section
                <div className="space-y-4">
                  <div className="bg-white/20 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Accuracy Score</h4>
                    <div className="text-2xl font-bold text-green-400">85%</div>
                  </div>
                  
                  <div className="bg-white/20 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Words Practiced</h4>
                    <div className="text-2xl font-bold text-blue-400">127</div>
                  </div>
                  
                  <div className="bg-white/20 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Practice Time</h4>
                    <div className="text-2xl font-bold text-purple-400">2h 15m</div>
                  </div>
                </div>
              )}
            </div>
            
            {isAnalyzing && (
              <div className="text-center py-4">
                <div className="text-white text-lg mb-2">Analyzing pronunciation...</div>
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
              </div>
            )}
            
            <button className="w-full px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg shadow-xl border-2 border-blue-200/50 backdrop-blur-sm hover:bg-blue-700 transition-all duration-300">
              View Detailed Report
            </button>
          </div>
        </div>
      </main>

      {/* Recent Activity and Navigation */}
      <div className="max-w-8xl mx-auto w-full px-12 py-4">
        {/* Recent Activity Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-white/30 p-6 mb-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">Recent Activity</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentWords.map((item, index) => (
              <div key={index} className="bg-white/20 rounded-lg p-4 border border-white/30 hover:bg-white/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-white">{item.word}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.difficulty === 'Easy' ? 'bg-green-500/30 text-green-300' :
                    item.difficulty === 'Medium' ? 'bg-yellow-500/30 text-yellow-300' :
                    'bg-red-500/30 text-red-300'
                  }`}>
                    {item.difficulty}
                  </span>
                </div>
                <p className="text-sm text-blue-200">{item.timestamp}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Navigation Buttons */}
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
    </div>
  );
};

export default PronunciationPractice; 