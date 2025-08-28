import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Play, Pause, Clock, User, Bot, Volume2, RotateCcw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { debateService, ttsService, Debate, DebateTurn } from '../lib/supabase';

interface MinimalDebatePanelProps {
  topic: string;
  duration: number; // in seconds
  rounds: number;
}

const MinimalDebatePanel: React.FC<MinimalDebatePanelProps> = ({
  topic,
  duration,
  rounds
}) => {
  const { user } = useAuth();
  
  // Core debate state
  const [debate, setDebate] = useState<Debate | null>(null);
  const [currentTurn, setCurrentTurn] = useState<DebateTurn | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [turnTimeRemaining, setTurnTimeRemaining] = useState<number | null>(null);
  
  // Audio state
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [aiAudioUrl, setAiAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Turn management
  const [canUserSpeak, setCanUserSpeak] = useState(false);
  const [turnEndTime, setTurnEndTime] = useState<Date | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  
  // Initialize debate
  useEffect(() => {
    initializeDebate();
  }, []);
  
  // Load current turn and subscribe to updates
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
          if (isRecording) {
            stopRecording();
          }
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [turnEndTime, currentTurn, isRecording]);
  
  const initializeDebate = async () => {
    try {
      // Create new debate
      const newDebate = await debateService.createDebate(topic, rounds, duration);
      
      if (newDebate) {
        setDebate(newDebate);
        
        // Initialize with turn engine
        const initResponse = await fetch('/api/debate/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            debateId: newDebate.id,
            config: { topic, duration, rounds }
          })
        });
        
        if (initResponse.ok) {
          const initResult = await initResponse.json();
          if (initResult.turn) {
            setCurrentTurn(initResult.turn);
          }
        }
      }
    } catch (error) {
      console.error('Error initializing debate:', error);
    }
  };
  
  const loadCurrentTurn = async () => {
    if (!debate) return;
    
    try {
      const stateResponse = await fetch(`/api/debate/${debate.id}/state`);
      if (stateResponse.ok) {
        const stateResult = await stateResponse.json();
        if (stateResult.currentTurn) {
          setCurrentTurn(stateResult.currentTurn);
        }
      }
    } catch (error) {
      console.error('Error loading current turn:', error);
    }
  };
  
  const subscribeToTurnUpdates = () => {
    if (!debate) return;
    
    return debateService.subscribeToDebateTurns(debate.id, (updatedTurn) => {
      setCurrentTurn(updatedTurn);
    });
  };
  
  const startRecording = async () => {
    if (!debate || !canUserSpeak || isRecording || isProcessing || isAISpeaking) {
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedAudio(audioBlob);
        setIsRecording(false);
        await processUserTurn(audioBlob);
      };
      
      mediaRecorder.start(1000);
      setIsRecording(true);
      
      // Start speaking turn
      await fetch(`/api/debate/${debate.id}/start-speaking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speaker: 'user_pro',
          duration
        })
      });
      
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };
  
  const processUserTurn = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      // Upload and transcribe
      const formData = new FormData();
      formData.append('file', audioBlob);
      
      const uploadResponse = await fetch('/api/human-upload', {
        method: 'POST',
        body: formData
      });
      
      let transcript = "User provided their argument.";
      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json();
        
        // Transcribe
        const transcribeFormData = new FormData();
        transcribeFormData.append('file', audioBlob);
        
        const transcribeResponse = await fetch('/api/transcribe', {
          method: 'POST',
          body: transcribeFormData
        });
        
        if (transcribeResponse.ok) {
          const transcribeResult = await transcribeResponse.json();
          transcript = transcribeResult.text || transcript;
        }
      }
      
      // Complete turn and advance
      if (debate) {
        const advanceResponse = await fetch(`/api/debate/${debate.id}/complete-turn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            turnData: { transcript, duration: duration - (turnTimeRemaining || 0) }
          })
        });
        
        if (advanceResponse.ok) {
          const advanceResult = await advanceResponse.json();
          if (advanceResult.nextTurn) {
            setCurrentTurn(advanceResult.nextTurn);
            
            // Generate AI response if it's AI's turn
            if (advanceResult.nextTurn.speaker === 'ai_con') {
              await generateAIResponse(transcript);
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Error processing user turn:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const generateAIResponse = async (userTranscript: string) => {
    try {
      // Generate AI response
      const aiResponse = await fetch('/api/generate-ai-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: `You are CON on the topic: "${topic}". Stay within 150 words. Be concise and targeted. End with one probing question.`,
          userPrompt: `Respond to: ${userTranscript}`,
          topic
        })
      });
      
      if (aiResponse.ok) {
        const aiResult = await aiResponse.json();
        const aiText = aiResult.response;
        
        // Generate TTS
        const ttsResponse = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: aiText })
        });
        
        if (ttsResponse.ok) {
          const audioBlob = await ttsResponse.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          setAiAudioUrl(audioUrl);
          setIsAISpeaking(true);
          playAISpeech(audioUrl);
        }
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
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
    
    // Complete AI turn and advance to next user turn
    if (debate && currentTurn) {
      try {
        const advanceResponse = await fetch(`/api/debate/${debate.id}/complete-turn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            turnData: { transcript: 'AI response completed', duration: 30 }
          })
        });
        
        if (advanceResponse.ok) {
          const advanceResult = await advanceResponse.json();
          if (advanceResult.nextTurn) {
            setCurrentTurn(advanceResult.nextTurn);
            setCurrentRound(prev => prev + 1);
          }
        }
      } catch (error) {
        console.error('Error advancing after AI speech:', error);
      }
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getTurnStatus = () => {
    if (isRecording) return 'Recording...';
    if (isProcessing) return 'Processing...';
    if (isAISpeaking) return 'AI Speaking...';
    if (currentTurn?.speaker === 'user_pro') return 'Your Turn';
    if (currentTurn?.speaker === 'ai_con') return 'AI Turn';
    return 'Waiting...';
  };
  
  const getTurnColor = () => {
    if (isRecording) return 'bg-red-500';
    if (isProcessing) return 'bg-yellow-500';
    if (isAISpeaking) return 'bg-blue-500';
    if (currentTurn?.speaker === 'user_pro') return 'bg-green-500';
    if (currentTurn?.speaker === 'ai_con') return 'bg-purple-500';
    return 'bg-gray-500';
  };
  
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Debate Panel</h1>
        <p className="text-gray-600 text-sm">{topic}</p>
        
        {/* Round and Timer */}
        <div className="flex items-center justify-center gap-4 mt-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Round {currentRound}/{rounds}</span>
          </div>
          
          {turnTimeRemaining !== null && currentTurn?.state === 'speaking' && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-500" />
              <span className="text-sm font-mono text-red-500">
                {formatTime(turnTimeRemaining)}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Turn Status */}
      <div className={`${getTurnColor()} text-white rounded-lg p-4 mb-6 text-center`}>
        <div className="text-lg font-semibold">{getTurnStatus()}</div>
        <div className="text-sm opacity-90">
          {currentTurn?.speaker === 'user_pro' ? 'You are PRO' : 'AI is CON'}
        </div>
      </div>
      
      {/* Participants */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* PRO (User) */}
        <div className={`text-center p-4 rounded-lg ${
          currentTurn?.speaker === 'user_pro' ? 'bg-green-100 border-2 border-green-300' : 'bg-gray-100'
        }`}>
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <User className="w-6 h-6 text-white" />
          </div>
          <div className="font-semibold text-gray-800">PRO</div>
          <div className="text-xs text-gray-600">You</div>
          {isRecording && (
            <div className="mt-2">
              <Mic className="w-4 h-4 text-red-500 mx-auto animate-pulse" />
            </div>
          )}
        </div>
        
        {/* CON (AI) */}
        <div className={`text-center p-4 rounded-lg ${
          currentTurn?.speaker === 'ai_con' ? 'bg-purple-100 border-2 border-purple-300' : 'bg-gray-100'
        }`}>
          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="font-semibold text-gray-800">CON</div>
          <div className="text-xs text-gray-600">AI</div>
          {isAISpeaking && (
            <div className="mt-2">
              <Volume2 className="w-4 h-4 text-purple-500 mx-auto animate-pulse" />
            </div>
          )}
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        {canUserSpeak && !isRecording && !isProcessing && !isAISpeaking ? (
          <button
            onClick={startRecording}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Mic className="w-5 h-5" />
            Start Recording
          </button>
        ) : isRecording ? (
          <button
            onClick={stopRecording}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Pause className="w-5 h-5" />
            Stop Recording
          </button>
        ) : isProcessing ? (
          <div className="px-6 py-3 bg-yellow-500 text-white rounded-lg flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Processing...
          </div>
        ) : isAISpeaking ? (
          <div className="px-6 py-3 bg-purple-500 text-white rounded-lg flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            AI Speaking...
          </div>
        ) : (
          <div className="px-6 py-3 bg-gray-500 text-white rounded-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Waiting...
          </div>
        )}
      </div>
      
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default MinimalDebatePanel;
















