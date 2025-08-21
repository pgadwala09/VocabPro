import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Play, Pause, Clock, Users, MessageSquare, Brain, Trophy, Download, Share2, Mail, MessageCircle, User, Bot, Volume2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { debateService, transcriptionService, aiResponseService, ttsService, Debate, DebateTurn } from '../lib/supabase';
import { initializeDebate as initializeDebateAPI, getCurrentTurn, saveTurn } from '../api-routes';

interface OneOnOneDebateProps {
  currentDebate: any;
  isSpeaking: boolean;
  speakingSide: 'pro' | 'con' | null;
  mutePro: boolean;
  muteCon: boolean;
  setMutePro: (mute: boolean) => void;
  setMuteCon: (mute: boolean) => void;
  remainingSeconds: number | null;
  selectedMinutes: number;
  selectedRound: number;
  proArgument: string;
  conArgument: string;
  onGenerate: () => void;
  onUserSpeak: () => void;
  voiceStatus: 'checking' | 'available' | 'fallback' | 'unavailable';
  isUserTurn: boolean;
}

const OneOnOneDebate: React.FC<OneOnOneDebateProps> = ({
  currentDebate,
  isSpeaking,
  speakingSide,
  mutePro,
  muteCon,
  setMutePro,
  setMuteCon,
  remainingSeconds,
  selectedMinutes,
  selectedRound,
  proArgument,
  conArgument,
  onGenerate,
  onUserSpeak,
  voiceStatus,
  isUserTurn
}) => {
  const { user } = useAuth();
  const avatarUrl = user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name || user?.email || '';
  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // Debate state
  const [debate, setDebate] = useState<Debate | null>(null);
  const [debateTurns, setDebateTurns] = useState<DebateTurn[]>([]);
  const [currentTurn, setCurrentTurn] = useState<DebateTurn | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [currentTurnNumber, setCurrentTurnNumber] = useState(1);
  const [turnEndTime, setTurnEndTime] = useState<Date | null>(null);
  const [canUserSpeak, setCanUserSpeak] = useState(false);
  const [localProArgument, setLocalProArgument] = useState<string>('');
  const [localConArgument, setLocalConArgument] = useState<string>('');
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [showScores, setShowScores] = useState<boolean>(false);
  const [proScore, setProScore] = useState<number>(0);
  const [conScore, setConScore] = useState<number>(0);
  const [showDebateCompleteModal, setShowDebateCompleteModal] = useState<boolean>(false);
  const [round4Completed, setRound4Completed] = useState<boolean>(false);
  const [showRound4ScoresModal, setShowRound4ScoresModal] = useState<boolean>(false);
  const [debateActivities, setDebateActivities] = useState<Array<{
    round: number;
    proArgument: string;
    conArgument: string;
    timestamp: Date;
    audioUrl?: string;
  }>>([]);
  
  const [completedDebates, setCompletedDebates] = useState<Array<{
    id: string;
    title: string;
    topic: string;
    rounds: number;
    timestamp: Date;
    audioUrl?: string;
    proScore: number;
    conScore: number;
    winner: 'PRO' | 'CON' | 'TIE';
  }>>([]);

  // Audio recording state
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [aiAudioUrl, setAiAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Timer states
  const [selectedRoundDisplay, setSelectedRoundDisplay] = useState(selectedRound);
  const [selectedTimeDisplay, setSelectedTimeDisplay] = useState(selectedMinutes);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(selectedTimeDisplay * 60);
  const [isDebateStarted, setIsDebateStarted] = useState(false);
  const [turnTimeRemaining, setTurnTimeRemaining] = useState<number | null>(null);

  // Recent activities
  const [recentActivities, setRecentActivities] = useState<Array<{
    id: string;
    title: string;
    timestamp: Date;
    audioUrl?: string;
    topic: string;
  }>>([]);

  // Initialize debate when component mounts
  useEffect(() => {
    if (currentDebate && !debate) {
      initializeDebate();
    }
    // If no debate is being created, create initial turn
    if (!currentDebate && !debate) {
      createInitialTurn();
    }
  }, [currentDebate]);

  // Set initial debate text
  useEffect(() => {
    if (currentDebate) {
      // Set initial PRO argument based on the debate topic and round
      const initialProArgument = `Round ${currentRound}: I support the proposition: "${currentDebate.topic}". AI-assisted learning can revolutionize education by providing personalized learning experiences, adaptive content, and real-time feedback that traditional methods cannot match. This technology can help bridge educational gaps and prepare students for a technology-driven future.`;
      setLocalProArgument(initialProArgument);
      
      // Set initial CON argument
      const initialConArgument = `Round ${currentRound}: I oppose the proposition: "${currentDebate.topic}". While AI offers some benefits, there are significant concerns about data privacy, the digital divide, and the potential loss of human connection in education. Traditional methods have proven results and foster critical thinking skills that AI cannot replicate. We must carefully consider the long-term implications before fully embracing AI in our educational systems.`;
      setLocalConArgument(initialConArgument);
      
      console.log(`✅ Round ${currentRound} debate text synced:`, { topic: currentDebate.topic, pro: initialProArgument, con: initialConArgument });
    }
  }, [currentDebate, currentRound]);

  // Debug round changes
  useEffect(() => {
    console.log(`🔄 Round changed to: ${currentRound}`);
  }, [currentRound]);

  // Load current turn and set up realtime subscription
  useEffect(() => {
    if (debate) {
      loadCurrentTurn();
      subscribeToTurnUpdates();
    }
  }, [debate]);

  // Update canUserSpeak based on current turn
  useEffect(() => {
    if (currentTurn) {
      const isUserTurn = currentTurn.speaker === 'user_pro';
      const isSpeakingState = currentTurn.state === 'speaking';
      setCanUserSpeak(isUserTurn && isSpeakingState);
      
      if (currentTurn.ends_at) {
        setTurnEndTime(new Date(currentTurn.ends_at));
      }
    }
  }, [currentTurn]);

  // Turn countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (turnEndTime && currentTurn?.state === 'speaking') {
      interval = setInterval(() => {
        const now = new Date();
        const timeLeft = Math.max(0, Math.floor((turnEndTime.getTime() - now.getTime()) / 1000));
        setTurnTimeRemaining(timeLeft);
        
        if (timeLeft <= 0) {
          // Auto-stop recording when turn ends
          if (isRecording) {
            stopRecording();
          }
          // Complete the turn
          if (currentTurn) {
            debateService.completeTurn(currentTurn.id);
          }
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [turnEndTime, currentTurn, isRecording]);

  // Load debate turns when debate is set
  useEffect(() => {
    if (debate) {
      loadDebateTurns();
      subscribeToDebateUpdates();
    }
  }, [debate]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            console.log('⏰ Timer ended - turn over!');
            setIsTimerRunning(false);
            if (currentTurn?.speaker === 'user_pro' && isRecording) {
              console.log('🛑 Auto-stopping recording due to timer end');
              stopRecording();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timeRemaining, currentTurn, isRecording]);

  // Update timer when selectedTimeDisplay changes
  useEffect(() => {
    setTimeRemaining(selectedTimeDisplay * 60);
  }, [selectedTimeDisplay]);

  const createInitialTurn = async () => {
    try {
      // Create a mock debate for testing
      const mockDebate = {
        id: 'temp-debate',
        user_id: 'temp-user',
        topic: currentDebate?.topic || "Should schools adopt AI-assisted learning?",
        created_at: new Date().toISOString(),
        status: 'active' as const,
        selected_rounds: selectedRoundDisplay,
        selected_time: selectedTimeDisplay * 60
      };
      
      setDebate(mockDebate);
      setIsDebateStarted(true);
      
      // Create initial user turn
      const initialTurn = await debateService.createNextTurn(mockDebate.id, 'user_pro');
      if (initialTurn) {
        setCurrentTurn(initialTurn);
      }
    } catch (error) {
      console.error('Error creating initial turn:', error);
    }
  };

  const initializeDebate = async () => {
    try {
      if (!currentDebate?.topic) return;

      // Create new debate using our API routes
      const result = await initializeDebateAPI(
        currentDebate.topic,
        selectedRoundDisplay,
        selectedTimeDisplay * 60
      );

      if (result.success && result.debate) {
        setDebate(result.debate);
        setIsDebateStarted(true);
        console.log('✅ Debate created successfully:', result.debate);
      } else {
        console.error('❌ Failed to create debate:', result.error);
      }
    } catch (error) {
      console.error('Error initializing debate:', error);
    }
  };

  const loadCurrentTurn = async () => {
    if (!debate) return;
    
    try {
      const result = await getCurrentTurn(debate.id);
      if (result.success && result.turn) {
        setCurrentTurn(result.turn);
      }
    } catch (error) {
      console.error('Error loading current turn:', error);
    }
  };

  const subscribeToTurnUpdates = () => {
    if (!debate) return;
    
    return debateService.subscribeToDebateTurns(debate.id, (updatedTurn) => {
      setCurrentTurn(updatedTurn);
      setDebateTurns(prev => {
        const existingIndex = prev.findIndex(t => t.id === updatedTurn.id);
        if (existingIndex >= 0) {
          const newTurns = [...prev];
          newTurns[existingIndex] = updatedTurn;
          return newTurns;
        } else {
          return [...prev, updatedTurn];
        }
      });
    });
  };

  const loadDebateTurns = async () => {
    if (!debate) return;

    try {
      const turns = await debateService.getDebateTurns(debate.id);
      setDebateTurns(turns);
      setCurrentTurnNumber(turns.length + 1);
    } catch (error) {
      console.error('Error loading debate turns:', error);
    }
  };

  const subscribeToDebateUpdates = () => {
    if (!debate) return;

    return debateService.subscribeToDebateTurns(debate.id, (newTurn) => {
      setDebateTurns(prev => [...prev, newTurn]);
      setCurrentTurnNumber(prev => prev + 1);
    });
  };

  const startRecording = async () => {
    // Check if already recording or processing
    if (isRecording || isProcessing || isAISpeaking) {
      console.log('❌ Cannot start recording - already recording, processing, or AI speaking');
      return;
    }

    console.log('🎤 Starting recording for user turn...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      console.log('✅ Microphone access granted');
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log('📦 Audio chunk received:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('🛑 Recording stopped, processing audio...');
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        console.log('📊 Audio blob created, size:', audioBlob.size, 'bytes');
        
        setRecordedAudio(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setIsRecording(false);
        
        // Process the recorded audio
        await processUserTurn(audioBlob);
      };

      mediaRecorder.start(1000); // Collect data every second
      console.log('🎙️ MediaRecorder started');
      setIsRecording(true);
      setIsTimerRunning(true);
      setTimeRemaining(selectedTimeDisplay * 60);
      
      // Start the speaking turn using orchestration endpoint
      if (debate) {
        await fetch(`/api/debate/${debate.id}/start-speaking`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            speaker: 'user_pro',
            duration: selectedTimeDisplay * 60
          })
        });
      }
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    console.log('🛑 Stopping recording...');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => {
        track.stop();
        console.log('🔇 Audio track stopped:', track.kind);
      });
      setIsTimerRunning(false);
      console.log('✅ Recording stopped and tracks cleaned up');
    } else {
      console.log('⚠️ No active recording to stop');
    }
  };

  const processUserTurn = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      console.log('🔄 Processing user turn...');
      console.log('📊 Audio blob size:', audioBlob.size, 'bytes');
      console.log('🎵 Audio blob type:', audioBlob.type);
      
      // 1. Upload audio file to server first
      let audioUrl = null;
      try {
        console.log('📤 Uploading audio file to server...');
        const formData = new FormData();
        formData.append('file', audioBlob, `user-turn-${currentTurnNumber}.webm`);
        formData.append('debateId', debate?.id || 'temp');
        formData.append('turnNumber', currentTurnNumber.toString());
        formData.append('speaker', 'user_pro');
        
        const uploadResponse = await fetch('/api/human-upload', {
          method: 'POST',
          body: formData
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          audioUrl = uploadResult.audioUrl;
          console.log('✅ Audio uploaded successfully:', audioUrl);
        } else {
          throw new Error(`Upload failed: ${uploadResponse.status}`);
        }
      } catch (uploadError) {
        console.warn('⚠️ Failed to upload audio to server, using local blob:', uploadError);
        audioUrl = URL.createObjectURL(audioBlob);
      }

      // 2. Transcribe audio using server endpoint
      let transcript = null;
      try {
        console.log('🎤 Transcribing audio...');
        const transcribeFormData = new FormData();
        transcribeFormData.append('file', audioBlob);
        
        const transcribeResponse = await fetch('/api/transcribe', {
          method: 'POST',
          body: transcribeFormData
        });
        
        if (transcribeResponse.ok) {
          const transcribeResult = await transcribeResponse.json();
          transcript = transcribeResult.text;
          console.log('✅ Transcription successful:', transcript);
        } else {
          throw new Error(`Transcription failed: ${transcribeResponse.status}`);
        }
      } catch (transcriptionError) {
        console.warn('⚠️ Server transcription failed, using fallback:', transcriptionError);
        transcript = "User provided their argument in the debate.";
      }

      if (!transcript || transcript.trim() === '') {
        transcript = "User provided their argument in the debate.";
      }

      // 3. Update PRO argument text with the transcript
      if (transcript && transcript.trim() !== '') {
        setLocalProArgument(transcript);
        console.log('✅ PRO argument updated:', transcript);
        
        // Add to debate activities
        setDebateActivities(prev => [...prev, {
          round: currentRound,
          proArgument: transcript,
          conArgument: '', // Will be updated when CON responds
          timestamp: new Date(),
          audioUrl: audioUrl || undefined
        }]);
      }

      // 4. Save turn to database (skip if not configured)
      let turn = null;
      try {
        if (debate) {
          console.log('💾 Saving turn to database...');
          turn = await debateService.addDebateTurn(
            debate.id,
            'user_pro',
            transcript,
            audioUrl || undefined,
            selectedTimeDisplay * 60 - timeRemaining
          );
          console.log('✅ Turn saved to database');
        }
      } catch (dbError) {
        console.warn('⚠️ Failed to save turn to database:', dbError);
      }

      if (turn) {
        setDebateTurns(prev => [...prev, turn]);
        setCurrentTurnNumber(prev => prev + 1);
      }
      
      // 5. Automatically trigger AI response after a short delay
      setTimeout(async () => {
        await generateAIResponse(transcript);
      }, 2000); // 2 second delay
    } catch (error) {
      console.error('❌ Error processing user turn:', error);
      // Don't show alert, just log the error
    } finally {
      setIsProcessing(false);
    }
  };

  const generateAIResponse = async (userTranscript: string) => {
    setIsProcessing(true);
    try {
      console.log('Generating AI response for:', userTranscript);
      
      // 3. Generate AI response (skip if API not available)
      let aiResponse = null;
      try {
        const topic = currentDebate?.topic || "Should schools adopt AI-assisted learning?";
        aiResponse = await aiResponseService.generateAIResponse(
          topic,
          userTranscript,
          debateTurns
        );
        console.log('AI response generated:', aiResponse);
      } catch (aiError) {
        console.warn('AI response generation failed, using fallback:', aiError);
        aiResponse = `Thank you for your argument about ${userTranscript}. I respectfully disagree and believe there are important counterpoints to consider. Let me provide a thoughtful response to your position.`;
      }

      if (!aiResponse) {
        aiResponse = `Thank you for your argument. I respectfully disagree and believe there are important counterpoints to consider. Let me provide a thoughtful response to your position.`;
      }

      // 4. Update CON argument text with the AI response
      setLocalConArgument(aiResponse);
      console.log('✅ CON argument updated:', aiResponse);

      // 5. Generate TTS for AI response
      await generateAISpeech(aiResponse, 'temp');
      
      // 6. Handle round progression after AI response
      setTimeout(() => {
        if (currentRound < 4) {
          console.log(`🔄 Auto-progressing from Round ${currentRound} to Round ${currentRound + 1}`);
          handleNextRound();
        } else if (currentRound === 4) {
          console.log(`🏁 Round 4 completed - showing scores popup`);
          setRound4Completed(true);
          // Automatically show scores after Round 4 CON response
          setTimeout(() => {
            handleFinishTurn();
          }, 1000); // Wait 1 second after AI response to show scores
        }
      }, 3000); // Wait 3 seconds after AI response to allow user to read/hear it
    } catch (error) {
      console.error('Error generating AI response:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateAISpeech = async (text: string, turnId: string) => {
    if (!debate) return;

    try {
      console.log('🎤 Generating AI speech for text:', text.substring(0, 50) + '...');
      console.log('📝 Full text length:', text.length, 'characters');
      
      // 1. Generate speech using ElevenLabs TTS
      console.log('🔄 Calling TTS service...');
      const audioBlob = await ttsService.generateSpeech(text);
      
      if (!audioBlob) {
        console.error('❌ TTS service returned null audio blob');
        console.log('🔄 Falling back to browser speech synthesis...');
        await fallbackSpeechSynthesis(text);
        return;
      }

      console.log('✅ TTS audio blob generated successfully');
      console.log('📊 Audio blob size:', audioBlob.size, 'bytes');
      console.log('🎵 Audio blob type:', audioBlob.type);

      // 2. Upload AI audio to Supabase Storage (skip if not configured)
      let aiAudioUrl = null;
      try {
        console.log('📤 Uploading AI audio to Supabase...');
        aiAudioUrl = await debateService.uploadAudioFile(debate.id, currentTurnNumber, audioBlob);
        console.log('✅ AI audio uploaded to Supabase:', aiAudioUrl);
      } catch (uploadError) {
        console.warn('⚠️ Failed to upload AI audio to Supabase, using local blob:', uploadError);
        aiAudioUrl = URL.createObjectURL(audioBlob);
        console.log('📁 Using local audio URL:', aiAudioUrl);
      }

      // 3. Update turn with audio URL in database (skip if not configured)
      try {
        if (aiAudioUrl && turnId !== 'temp') {
          console.log('💾 Updating debate turn with audio URL...');
          await debateService.updateDebateTurnAudio(turnId, aiAudioUrl);
          console.log('✅ Debate turn updated with audio URL');
        }
      } catch (updateError) {
        console.warn('⚠️ Failed to update debate turn audio in database:', updateError);
      }

      // 4. Play AI speech
      if (aiAudioUrl) {
        console.log('🎵 Setting up AI speech playback...');
        setAiAudioUrl(aiAudioUrl);
        setIsAISpeaking(true);
        playAISpeech(aiAudioUrl as string);
        console.log('🎤 AI speech playback started');
      } else {
        console.error('❌ No audio URL available for playback');
        setIsAISpeaking(false);
      }
      
    } catch (error) {
      console.error('❌ Error generating AI speech:', error);
      console.log('🔄 Falling back to browser speech synthesis...');
      // Fallback to browser speech synthesis
      await fallbackSpeechSynthesis(text);
    }
  };

  const fallbackSpeechSynthesis = async (text: string) => {
    try {
      console.log('Using fallback speech synthesis');
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        utterance.onstart = () => {
          setIsAISpeaking(true);
          console.log('Fallback speech synthesis started');
        };
        
                 utterance.onend = async () => {
           setIsAISpeaking(false);
           // Create next user turn
           if (debate) {
             const nextTurn = await debateService.createNextTurn(debate.id, 'user_pro');
             if (nextTurn) {
               setCurrentTurn(nextTurn);
             }
           }
           console.log('Fallback speech synthesis ended');
         };
         
         utterance.onerror = async (error) => {
           console.error('Speech synthesis error:', error);
           setIsAISpeaking(false);
           // Create next user turn
           if (debate) {
             const nextTurn = await debateService.createNextTurn(debate.id, 'user_pro');
             if (nextTurn) {
               setCurrentTurn(nextTurn);
             }
           }
         };
        
        speechSynthesis.speak(utterance);
      } else {
        console.error('Speech synthesis not supported');
        setIsAISpeaking(false);
        // Create next user turn
        if (debate) {
          const nextTurn = await debateService.createNextTurn(debate.id, 'user_pro');
          if (nextTurn) {
            setCurrentTurn(nextTurn);
          }
        }
      }
    } catch (error) {
      console.error('Fallback speech synthesis failed:', error);
      setIsAISpeaking(false);
      // Create next user turn
      if (debate) {
        const nextTurn = await debateService.createNextTurn(debate.id, 'user_pro');
        if (nextTurn) {
          setCurrentTurn(nextTurn);
        }
      }
    }
  };

  const playAISpeech = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    }
  };

  const handleAudioEnded = async () => {
    setIsAISpeaking(false);
    // Create next user turn
    if (debate) {
      const nextTurn = await debateService.createNextTurn(debate.id, 'user_pro');
      if (nextTurn) {
        setCurrentTurn(nextTurn);
      }
    }
  };

  const addToRecentActivity = (audioBlob?: Blob, isCompleteDebate: boolean = false) => {
    const newActivity = {
      id: Date.now().toString(),
      title: isCompleteDebate ? `Complete Debate - ${debate?.topic || 'Debate Topic'}` : `1-on-1 Debate - ${debate?.topic || 'Debate Topic'}`,
      timestamp: new Date(),
      audioUrl: audioBlob ? URL.createObjectURL(audioBlob) : undefined,
      topic: debate?.topic || 'Debate Topic',
      hasRecording: !!audioBlob,
      isCompleteDebate
    };
    setRecentActivities(prev => [newActivity, ...prev.slice(0, 9)]);
  };

  const handleDownload = (activity: any) => {
    if (activity.audioUrl) {
      const link = document.createElement('a');
      link.href = activity.audioUrl;
      link.download = `${activity.title}.mp3`;
      link.click();
    }
  };

  const handleShare = (activity: any) => {
    if (navigator.share) {
      navigator.share({
        title: activity.title,
        text: `Check out this debate: ${activity.topic}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleWhatsApp = (activity: any) => {
    const text = `Check out this debate: ${activity.topic}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + window.location.href)}`;
    window.open(url, '_blank');
  };

  const handleEmail = (activity: any) => {
    const subject = `Debate: ${activity.topic}`;
    const body = `Check out this debate: ${activity.topic}\n\nLink: ${window.location.href}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNextRound = () => {
    if (currentRound < 4) {
      setCurrentRound(prev => prev + 1);
      // Reset arguments for new round
      setLocalProArgument('');
      setLocalConArgument('');
      // Reset debate state for new round
      setIsDebateStarted(false);
      setRound4Completed(false); // Reset round 4 completion flag
      setTimeout(() => {
        setIsDebateStarted(true);
      }, 100);
      console.log(`✅ Advanced to Round ${currentRound + 1}`);
    }
  };

  const handleFinishTurn = () => {
    console.log(`🎯 Finish Turn clicked for Round ${currentRound}`);
    
    // Calculate scores based on round and argument quality
    const baseScore = 10;
    const roundBonus = currentRound * 5;
    const proArgumentLength = localProArgument.length;
    const conArgumentLength = localConArgument.length;
    
    // Score based on argument length and round
    const newProScore = Math.min(100, baseScore + roundBonus + Math.floor(proArgumentLength / 10));
    const newConScore = Math.min(100, baseScore + roundBonus + Math.floor(conArgumentLength / 10));
    
    setProScore(newProScore);
    setConScore(newConScore);
    
    if (currentRound === 4) {
      // Show popup for Round 4 completion
      setShowRound4ScoresModal(true);
    } else {
      // Show inline scores for other rounds
      setShowScores(true);
    }
    
    console.log(`🎯 Round ${currentRound} finished! PRO: ${newProScore}, CON: ${newConScore}`);
  };

  const handleFinishDebate = () => {
    const isFinalRound = currentRound === 4;
    const nextRound = isFinalRound ? 1 : currentRound + 1;
    
    console.log(`🏁 Finish Debate clicked - ${isFinalRound ? 'Resetting to Round 1' : `Progressing to Round ${nextRound}`}`);
    
    // Add completed debate to the list if it's the final round
    if (isFinalRound) {
      const winner: 'PRO' | 'CON' | 'TIE' = proScore > conScore ? 'PRO' : conScore > proScore ? 'CON' : 'TIE';
      // Get the latest audio URL from debate activities
      const latestActivity = debateActivities[debateActivities.length - 1];
      const audioUrl = latestActivity?.audioUrl;
      
      const completedDebate = {
        id: `debate-${Date.now()}`,
        title: `Debate on ${currentDebate?.topic || 'AI in Education'}`,
        topic: currentDebate?.topic || 'AI in Education',
        rounds: 4,
        timestamp: new Date(),
        audioUrl: audioUrl,
        proScore,
        conScore,
        winner
      };
      setCompletedDebates(prev => [completedDebate, ...prev]);
    }
    
    // Show the completion modal
    setShowDebateCompleteModal(true);
    
    // Progress to next round or reset after a delay
    setTimeout(() => {
      setCurrentRound(nextRound);
      setLocalProArgument('');
      setLocalConArgument('');
      setShowScores(false);
      setProScore(0);
      setConScore(0);
      setIsDebateStarted(false);
      setRound4Completed(false); // Reset round 4 completion flag
      setShowRound4ScoresModal(false); // Reset round 4 scores modal
      setDebateActivities([]); // Reset debate activities
      
      // Brief delay to ensure state updates, then restart debate
      setTimeout(() => {
        setIsDebateStarted(true);
        console.log(`🔄 ${isFinalRound ? 'Debate reset to Round 1' : `Debate progressed to Round ${nextRound}`}`);
        setShowDebateCompleteModal(false);
      }, 100);
    }, 2000); // Show modal for 2 seconds
  };

  const getReferenceArguments = (topic: string) => {
    const topicLower = topic.toLowerCase();
    
    if (topicLower.includes('ai') || topicLower.includes('artificial intelligence')) {
      return {
        pro: [
          'AI provides personalized learning experiences',
          'Adaptive content adjusts to student pace',
          'Real-time feedback improves learning outcomes',
          'Reduces teacher workload and administrative tasks',
          'Prepares students for technology-driven future',
          'Bridges educational gaps in underserved areas',
          '24/7 availability for learning support',
          'Data-driven insights for better teaching strategies'
        ],
        con: [
          'Privacy concerns with student data collection',
          'Digital divide may widen educational inequality',
          'Loss of human connection and mentorship',
          'Traditional methods have proven track record',
          'Critical thinking skills may be compromised',
          'Over-reliance on technology reduces creativity',
          'Cost barriers for implementation',
          'Potential job displacement for educators'
        ]
      };
    } else if (topicLower.includes('social media') || topicLower.includes('technology')) {
      return {
        pro: [
          'Enhances communication and connectivity',
          'Provides access to global information',
          'Facilitates remote learning and work',
          'Creates new job opportunities',
          'Improves efficiency in daily tasks',
          'Enables innovation and creativity',
          'Connects people across cultures',
          'Provides platforms for self-expression'
        ],
        con: [
          'Privacy and security concerns',
          'Addiction and mental health impacts',
          'Spread of misinformation',
          'Reduced face-to-face interactions',
          'Cyberbullying and online harassment',
          'Digital divide and inequality',
          'Loss of critical thinking skills',
          'Environmental impact of technology'
        ]
      };
    } else {
      // Generic debate arguments
      return {
        pro: [
          'Provides clear benefits and advantages',
          'Addresses current challenges effectively',
          'Offers innovative solutions',
          'Improves efficiency and productivity',
          'Creates positive change',
          'Supports progress and development',
          'Benefits multiple stakeholders',
          'Has proven track record'
        ],
        con: [
          'Raises significant concerns',
          'May have unintended consequences',
          'Traditional approaches work well',
          'Costs outweigh benefits',
          'Risks are too high',
          'Not ready for implementation',
          'Better alternatives exist',
          'Requires more research and testing'
        ]
      };
    }
  };

  const getCurrentTurnText = () => {
    if (currentTurn?.speaker === 'user_pro') return 'Recording';
    if (currentTurn?.speaker === 'ai_con') return 'Con Speaking';
    return 'Recording';
  };

  const getCurrentTurnStatus = () => {
    if (isRecording) return 'Recording...';
    if (isProcessing) return 'Processing...';
    if (isAISpeaking) return 'AI speaking...';
    if (currentTurn?.speaker === 'user_pro') return 'Ready to record';
    if (currentTurn?.speaker === 'ai_con') return 'AI preparing response';
    return 'Waiting';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4">
      {/* Header - Debate Arena */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Debate Arena</h1>
        
        {/* Topic Box */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="text-white text-lg font-medium">
            {debate?.topic || currentDebate?.topic || "Should schools adopt AI-assisted learning?"}
          </div>
          
          {/* Round Display - Centered below title */}
          <div className="text-center mt-3">
            <div className="text-2xl font-bold text-white bg-blue-600 rounded-lg px-4 py-2 inline-block">
              Round {currentRound}
            </div>
          </div>
          

          
                     {/* Round and Turn Status */}
           <div className="flex items-center justify-between mt-3">
             <div className="text-sm text-gray-400">Round {currentRound}/4</div>
             <div className="flex items-center gap-2">
               {turnTimeRemaining !== null && currentTurn?.state === 'speaking' && (
                 <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-mono">
                   {formatTime(turnTimeRemaining)}
                 </div>
               )}
               <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                 {currentRound < 4 ? (
                   <button 
                     onClick={() => handleNextRound()}
                     className="hover:bg-green-600 transition-colors"
                   >
                     Round {currentRound + 1}
                   </button>
                 ) : (
                   <span>Final Round</span>
                 )}
               </div>
             </div>
           </div>
        </div>
      </div>

      {/* Main Debate Participants Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* PRO Card */}
        <div className={`rounded-xl p-6 text-center transition-colors ${
          speakingSide === 'pro' ? 'bg-green-100 border-2 border-green-300' : 
          mutePro ? 'bg-red-100 border-2 border-red-300' : 'bg-gray-100'
        }`}>
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="text-xl font-bold text-gray-800 mb-4">PRO</div>
          
          {/* Recording Icon with Status */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
            speakingSide === 'pro' ? 'bg-green-500 animate-pulse' : 
            mutePro ? 'bg-red-500' : 'bg-blue-500'
          }`}>
            <Mic className="w-4 h-4 text-white" />
          </div>
          
          {/* Debate Start Indicator */}
          <div className="text-xs text-blue-600 mb-2">
            {isUserTurn ? '⏳ Your turn for arguments' : '🤖 AI is preparing'}
          </div>
          
          {/* Argument Text */}
          <div className="text-sm text-gray-600 bg-white rounded-lg p-3 mb-4">
            {localProArgument || proArgument || 'AI has the potential to personalize education.'}
          </div>
          
          {/* Recording Button */}
          <div className="mt-4">
            {!isRecording && !isProcessing && !isAISpeaking ? (
              <button
                onClick={startRecording}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2 transition-colors mx-auto"
              >
                <Mic className="w-4 h-4" />
                Start Arguments
              </button>
            ) : isRecording ? (
              <div className="flex items-center gap-2 justify-center">
                <div className="px-3 py-1 bg-green-500/20 text-green-700 rounded text-xs font-medium animate-pulse">
                  🎤 Recording...
                </div>
                <button
                  onClick={stopRecording}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs transition-colors"
                >
                  <Pause className="w-3 h-3" />
                  Stop
                </button>
              </div>
            ) : isProcessing ? (
              <div className="px-3 py-1 bg-yellow-500/20 text-yellow-700 rounded text-xs font-medium">
                ⏳ Processing...
              </div>
            ) : (
              <div className="px-3 py-1 bg-blue-500/20 text-blue-700 rounded text-xs font-medium">
                🤖 AI Speaking...
              </div>
            )}
          </div>
        </div>

        {/* CON Card */}
        <div className={`rounded-xl p-6 text-center transition-colors ${
          speakingSide === 'con' ? 'bg-blue-100 border-2 border-blue-300' : 
          muteCon ? 'bg-red-100 border-2 border-red-300' : 'bg-gray-100'
        }`}>
          <div className="w-16 h-16 bg-blue-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <div className="text-xl font-bold text-gray-800 mb-4">CON</div>
          
          {/* Audio Waveform Icon with Status */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
            speakingSide === 'con' ? 'bg-blue-500 animate-pulse' : 
            muteCon ? 'bg-red-500' : 'bg-blue-700'
          }`}>
            <Volume2 className="w-4 h-4 text-white" />
          </div>
          
          {/* Debate Start Indicator */}
          <div className="text-xs text-blue-600 mb-2">
            {isDebateStarted ? (isUserTurn ? '🎤 You will start first' : '⏳ AI will start first') : '⏳ Waiting to start debate'}
          </div>
          
          {/* Argument Text */}
          <div className="text-sm text-gray-600 bg-white rounded-lg p-3 mb-4">
            {isDebateStarted ? (localConArgument || conArgument || 'AI in education raises privacy concerns and may widen the digital divide. Traditional methods foster critical thinking and human connection that AI cannot replicate.') : 'Waiting for debate to start...'}
          </div>
          
          {/* AI Agent for Debate Button */}
          <div className="mt-4">
            <button
              onClick={async () => {
                const debateText = `Round ${currentRound}: As the CON side, I must respectfully disagree with the proposition. While AI-assisted learning offers some benefits, there are significant concerns about data privacy, the digital divide, and the potential loss of human connection in education. Traditional methods have proven results and foster critical thinking skills that AI cannot replicate. We must carefully consider the long-term implications before fully embracing AI in our educational systems.`;
                setIsAISpeaking(true);
                
                      // Update CON argument text
      setLocalConArgument(debateText);
      
      // Update the latest activity with CON argument
      setDebateActivities(prev => {
        if (prev.length > 0) {
          const updatedActivities = [...prev];
          const lastActivity = updatedActivities[updatedActivities.length - 1];
          if (lastActivity.round === currentRound && !lastActivity.conArgument) {
            lastActivity.conArgument = debateText;
          }
          return updatedActivities;
        }
        return prev;
      });
                
                // Try TTS service first
                const audioBlob = await ttsService.generateSpeech(debateText);
                if (audioBlob) {
                  const audioUrl = URL.createObjectURL(audioBlob);
                  setAiAudioUrl(audioUrl);
                  playAISpeech(audioUrl || '');
                } else {
                  // Fallback to browser speech synthesis
                  await fallbackSpeechSynthesis(debateText);
                }
              }}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors mx-auto"
            >
              <Bot className="w-4 h-4" />
              AI Agent for Debate
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      {debateActivities.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-lg border-2 border-gray-200 mt-6">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">📋 Recent Activity</h2>
            <p className="text-gray-600">Recorded debates between PRO and CON</p>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {debateActivities.map((activity, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-500 text-white px-2 py-1 rounded text-sm font-semibold">
                      Round {activity.round}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {activity.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* PRO Argument */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                      </div>
                      <span className="font-semibold text-blue-800">PRO</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {activity.proArgument || 'No argument recorded'}
                    </p>
                  </div>
                  
                  {/* CON Argument */}
                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                      <span className="font-semibold text-red-800">CON</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {activity.conArgument || 'No response yet'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Clear Activity Button */}
          <div className="text-center mt-4">
            <button 
              onClick={() => setDebateActivities([])}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
            >
              🗑️ Clear Activity History
            </button>
          </div>
        </div>
      )}

      {/* Completed Debates Section */}
      {completedDebates.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-lg border-2 border-gray-200 mt-6">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">🎯 Completed Debates</h2>
            <p className="text-gray-600">Recordings and sharing options</p>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {completedDebates.map((debate) => (
              <div key={debate.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-green-500 text-white px-2 py-1 rounded text-sm font-semibold">
                      🏁 Completed
                    </span>
                    <span className="text-gray-500 text-sm">
                      {debate.timestamp.toLocaleDateString()} {debate.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      debate.winner === 'PRO' ? 'bg-blue-100 text-blue-800' :
                      debate.winner === 'CON' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {debate.winner === 'PRO' ? '🏆 PRO Wins' :
                       debate.winner === 'CON' ? '🏆 CON Wins' : '🤝 Tie'}
                    </span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <h3 className="font-semibold text-gray-800 mb-1">{debate.title}</h3>
                  <p className="text-sm text-gray-600">{debate.topic}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-blue-600">PRO: {debate.proScore}</span>
                    <span className="text-red-600">CON: {debate.conScore}</span>
                    <span className="text-gray-600">{debate.rounds} Rounds</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {debate.audioUrl && (
                    <button 
                      onClick={() => {
                        // Play audio functionality
                        const audio = new Audio(debate.audioUrl);
                        audio.play();
                      }}
                      className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs transition-colors flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" />
                      Play Audio
                    </button>
                  )}
                  
                  <button 
                    onClick={() => {
                      // Download functionality
                      const debateText = `Debate: ${debate.title}\nTopic: ${debate.topic}\nRounds: ${debate.rounds}\nPRO Score: ${debate.proScore}\nCON Score: ${debate.conScore}\nWinner: ${debate.winner}\nDate: ${debate.timestamp.toLocaleString()}`;
                      const blob = new Blob([debateText], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `debate-${debate.id}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs transition-colors flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                  
                  <button 
                    onClick={() => {
                      // Share functionality
                      const shareText = `Check out this debate: ${debate.title}\nTopic: ${debate.topic}\nWinner: ${debate.winner}\nPRO: ${debate.proScore} | CON: ${debate.conScore}`;
                      if (navigator.share) {
                        navigator.share({
                          title: debate.title,
                          text: shareText,
                          url: window.location.href
                        });
                      } else {
                        navigator.clipboard.writeText(shareText);
                        alert('Debate details copied to clipboard!');
                      }
                    }}
                    className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs transition-colors flex items-center gap-1"
                  >
                    <Share2 className="w-3 h-3" />
                    Share
                  </button>
                  
                  <button 
                    onClick={() => {
                      // WhatsApp sharing
                      const shareText = `Check out this debate: ${debate.title}%0ATopic: ${debate.topic}%0AWinner: ${debate.winner}%0APRO: ${debate.proScore} | CON: ${debate.conScore}`;
                      window.open(`https://wa.me/?text=${shareText}`, '_blank');
                    }}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors flex items-center gap-1"
                  >
                    <MessageCircle className="w-3 h-3" />
                    WhatsApp
                  </button>
                  
                  <button 
                    onClick={() => {
                      // Email sharing
                      const subject = `Debate: ${debate.title}`;
                      const body = `Check out this debate:\n\nTopic: ${debate.topic}\nRounds: ${debate.rounds}\nPRO Score: ${debate.proScore}\nCON Score: ${debate.conScore}\nWinner: ${debate.winner}\nDate: ${debate.timestamp.toLocaleString()}`;
                      window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                    }}
                    className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-xs transition-colors flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" />
                    Email
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Clear Completed Debates Button */}
          <div className="text-center mt-4">
            <button 
              onClick={() => setCompletedDebates([])}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
            >
              🗑️ Clear Completed Debates
            </button>
          </div>
        </div>
      )}

      {/* Controls Section */}
      <div className="flex items-center justify-center mt-6">
        {/* Note: Round 4 scores show automatically after CON response */}
      </div>

      {/* Scores Display */}
      {showScores && (
        <div className="bg-white rounded-lg p-6 shadow-lg border-2 border-gray-200">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Round {currentRound} Results</h2>
            <p className="text-gray-600">Debate performance scores</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PRO Score */}
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{proScore}</div>
              <div className="text-lg font-semibold text-blue-800 mb-1">PRO</div>
              <div className="text-sm text-blue-600">
                {proScore >= 80 ? '🏆 Excellent!' : 
                 proScore >= 60 ? '👍 Good!' : 
                 proScore >= 40 ? '📈 Fair' : '📝 Needs Improvement'}
              </div>
            </div>
            
            {/* CON Score */}
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">{conScore}</div>
              <div className="text-lg font-semibold text-red-800 mb-1">CON</div>
              <div className="text-sm text-red-600">
                {conScore >= 80 ? '🏆 Excellent!' : 
                 conScore >= 60 ? '👍 Good!' : 
                 conScore >= 40 ? '📈 Fair' : '📝 Needs Improvement'}
              </div>
            </div>
          </div>
          
          {/* Winner Announcement */}
          <div className="text-center mt-6">
            {proScore > conScore ? (
              <div className="text-xl font-bold text-blue-600">
                🏆 PRO wins this round!
              </div>
            ) : conScore > proScore ? (
              <div className="text-xl font-bold text-red-600">
                🏆 CON wins this round!
              </div>
            ) : (
              <div className="text-xl font-bold text-gray-600">
                🤝 It's a tie!
              </div>
            )}
          </div>
          
          {/* Continue Button */}
          <div className="text-center mt-4">
            <button 
              onClick={() => {
                setShowScores(false);
                if (currentRound < 4) {
                  handleNextRound();
                } else {
                  handleFinishDebate();
                }
              }}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              {currentRound < 4 ? `Continue to Round ${currentRound + 1}` : 'Finish Debate'}
            </button>
          </div>
        </div>
      )}

      {/* Hidden audio element for AI speech */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        style={{ display: 'none' }}
      />

      {/* Debate Complete Modal */}
      {showDebateCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center shadow-2xl">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Round {currentRound} Completed!
            </h2>
            <p className="text-gray-600 mb-6">
              {currentRound === 4 ? 'Starting fresh debate at Round 1' : `Progressing to Round ${currentRound + 1}`}
            </p>
            <div className="animate-pulse">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          </div>
        </div>
      )}

      {/* Round 4 Scores Modal */}
      {showRound4ScoresModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-lg mx-4 text-center shadow-2xl">
            <div className="text-6xl mb-4">🏁</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Debate Completed!
            </h2>
            <p className="text-gray-600 mb-6">
              Round 4 finished. Here are the final scores:
            </p>
            
            {/* Scores Display */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* PRO Score */}
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{proScore}</div>
                <div className="text-xl font-semibold text-blue-800 mb-1">PRO</div>
                <div className="text-sm text-blue-600">
                  {proScore >= 80 ? '🏆 Excellent!' : 
                   proScore >= 60 ? '👍 Good!' : 
                   proScore >= 40 ? '📈 Fair' : '📝 Needs Improvement'}
                </div>
              </div>
              
              {/* CON Score */}
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-4xl font-bold text-red-600 mb-2">{conScore}</div>
                <div className="text-xl font-semibold text-red-800 mb-1">CON</div>
                <div className="text-sm text-red-600">
                  {conScore >= 80 ? '🏆 Excellent!' : 
                   conScore >= 60 ? '👍 Good!' : 
                   conScore >= 40 ? '📈 Fair' : '📝 Needs Improvement'}
                </div>
              </div>
            </div>
            
            {/* Winner Announcement */}
            <div className="text-center mb-6">
              {proScore > conScore ? (
                <div className="text-2xl font-bold text-blue-600">
                  🏆 PRO wins the debate!
                </div>
              ) : conScore > proScore ? (
                <div className="text-2xl font-bold text-red-600">
                  🏆 CON wins the debate!
                </div>
              ) : (
                <div className="text-2xl font-bold text-gray-600">
                  🤝 It's a tie!
                </div>
              )}
            </div>
            
            {/* Start New Debate Button */}
            <button 
              onClick={() => {
                setShowRound4ScoresModal(false);
                handleFinishDebate();
              }}
              className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-lg font-semibold"
            >
              🎯 Start New Debate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OneOnOneDebate;
