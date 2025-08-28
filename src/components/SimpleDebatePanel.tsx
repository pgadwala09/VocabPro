import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Play, Pause, Clock, User, Bot, Volume2, RotateCcw } from 'lucide-react';

interface SimpleDebatePanelProps {
  topic: string;
  duration: number; // in seconds
  rounds: number;
}

const SimpleDebatePanel: React.FC<SimpleDebatePanelProps> = ({
  topic,
  duration,
  rounds
}) => {
  // Core debate state
  const [currentRound, setCurrentRound] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [currentSpeaker, setCurrentSpeaker] = useState<'user_pro' | 'ai_con'>('user_pro');
  
  // Audio state
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [aiAudioUrl, setAiAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize debate
  useEffect(() => {
    startUserTurn();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startUserTurn = () => {
    setCurrentSpeaker('user_pro');
    setTimeRemaining(duration);
    setIsRecording(false);
    setIsProcessing(false);
    setIsAISpeaking(false);
  };

  const startAITurn = () => {
    setCurrentSpeaker('ai_con');
    setTimeRemaining(duration);
    setIsRecording(false);
    setIsProcessing(false);
    setIsAISpeaking(true);
    generateAIResponse();
  };

  const startRecording = async () => {
    if (currentSpeaker !== 'user_pro' || isRecording || isProcessing || isAISpeaking) {
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
      
      // Start countdown timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev && prev > 0) {
            return prev - 1;
          } else {
            stopRecording();
            return 0;
          }
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const processUserTurn = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate transcription
      const transcript = "User provided their argument about " + topic;
      console.log('User transcript:', transcript);
      
      // Advance to AI turn
      setTimeout(() => {
        startAITurn();
      }, 1000);
      
    } catch (error) {
      console.error('Error processing user turn:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateAIResponse = async () => {
    try {
      // Simulate AI response generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const aiText = `Thank you for your argument about ${topic}. I respectfully disagree and believe there are important counterpoints to consider. What evidence supports your position?`;
      
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
        playAISpeech(audioUrl);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      // Fallback: advance to next round
      setTimeout(() => {
        advanceToNextRound();
      }, 2000);
    }
  };

  const playAISpeech = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    }
  };

  const handleAudioEnded = () => {
    setIsAISpeaking(false);
    advanceToNextRound();
  };

  const advanceToNextRound = () => {
    if (currentRound < rounds) {
      setCurrentRound(prev => prev + 1);
      startUserTurn();
    } else {
      // Debate completed
      setCurrentSpeaker('complete');
      setTimeRemaining(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTurnStatus = () => {
    if (currentSpeaker === 'complete') return 'Debate Complete!';
    if (isRecording) return 'Recording...';
    if (isProcessing) return 'Processing...';
    if (isAISpeaking) return 'AI Speaking...';
    if (currentSpeaker === 'user_pro') return 'Your Turn';
    if (currentSpeaker === 'ai_con') return 'AI Turn';
    return 'Waiting...';
  };

  const getTurnColor = () => {
    if (currentSpeaker === 'complete') return 'bg-green-500';
    if (isRecording) return 'bg-red-500';
    if (isProcessing) return 'bg-yellow-500';
    if (isAISpeaking) return 'bg-blue-500';
    if (currentSpeaker === 'user_pro') return 'bg-green-500';
    if (currentSpeaker === 'ai_con') return 'bg-purple-500';
    return 'bg-gray-500';
  };

  if (currentSpeaker === 'complete') {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Debate Complete!</h1>
          <p className="text-gray-600 mb-4">{topic}</p>
          <div className="bg-green-500 text-white rounded-lg p-4 mb-6">
            <div className="text-lg font-semibold">Congratulations!</div>
            <div className="text-sm opacity-90">You've completed all {rounds} rounds</div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Start New Debate
          </button>
        </div>
      </div>
    );
  }

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
          
          {timeRemaining !== null && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-500" />
              <span className="text-sm font-mono text-red-500">
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Turn Status */}
      <div className={`${getTurnColor()} text-white rounded-lg p-4 mb-6 text-center`}>
        <div className="text-lg font-semibold">{getTurnStatus()}</div>
        <div className="text-sm opacity-90">
          {currentSpeaker === 'user_pro' ? 'You are PRO' : 'AI is CON'}
        </div>
      </div>
      
      {/* Participants */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* PRO (User) */}
        <div className={`text-center p-4 rounded-lg ${
          currentSpeaker === 'user_pro' ? 'bg-green-100 border-2 border-green-300' : 'bg-gray-100'
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
          currentSpeaker === 'ai_con' ? 'bg-purple-100 border-2 border-purple-300' : 'bg-gray-100'
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
        {currentSpeaker === 'user_pro' && !isRecording && !isProcessing && !isAISpeaking ? (
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

export default SimpleDebatePanel;
















