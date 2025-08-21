import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Brain, Sparkles, Users, MessageSquare, ArrowLeft, Mic, MicOff, Play, Pause, Trophy, Clock, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { initializeDebate, getCurrentTurn, saveTurn } from '../api-routes';
import EmojiPickerLib from 'emoji-picker-react';
import OneOnOneDebate from './OneOnOneDebate';
import ChatDebate from './ChatDebate';
import DebateWithAI from './DebateWithAI';

interface DebateData {
  id: string;
  topic: string;
  debateStyle: string;
  sideSelection: string;
  builderCharacter: string;
  breakerCharacter: string;
  duration: number;
  createdAt: Date;
}

const DebateTournament: React.FC = () => {
  const navigate = useNavigate();
  const [currentDebate, setCurrentDebate] = useState<DebateData | null>(() => {
    const saved = localStorage.getItem('currentDebate');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved debate:', e);
      }
    }
    // Create a default debate for immediate use
    const defaultDebate: DebateData = {
      id: 'default-debate-' + Date.now(),
      topic: 'Technology in Education',
      debateStyle: 'ai',
      sideSelection: 'builder',
      builderCharacter: 'AI',
      breakerCharacter: 'AI',
      duration: 5,
      createdAt: new Date()
    };
    // Save the default debate to localStorage
    localStorage.setItem('currentDebate', JSON.stringify(defaultDebate));
    console.log('Created default debate:', defaultDebate);
    // Show a brief notification to the user
    setTimeout(() => {
      alert('Welcome! A default debate has been created for you. You can start debating immediately or go back to create a custom debate.');
    }, 500);
    return defaultDebate;
  });

  const [activeTab, setActiveTab] = useState<'live' | 'chat' | 'ai'>('live');
  const [builderTime, setBuilderTime] = useState(150);
  const [breakerTime, setBreakerTime] = useState(150);
  const [builderScore, setBuilderScore] = useState(0);
  const [breakerScore, setBreakerScore] = useState(0);
  const [participants, setParticipants] = useState(1);
  const channelRef = useRef<any>(null);
  const leaderRef = useRef(false);
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [summaryAudioUrl, setSummaryAudioUrl] = useState<string | null>(null);
  const [summaryUploading, setSummaryUploading] = useState(false);
  const SUMMARY_BUCKET = 'debate summaries';
  const debateAudioPartsRef = useRef<string[]>([]);

  // Single shared audio element to avoid overlapping playback
  const sharedAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingSide, setSpeakingSide] = useState<'pro' | 'con' | null>(null);
  const [mutePro, setMutePro] = useState(false);
  const [muteCon, setMuteCon] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [isUserTurn, setIsUserTurn] = useState(false);

  // Initialize mute states when component mounts
  useEffect(() => {
    console.log('🔍 Component mounted - initializing mute states');
    // Start with both speakers enabled by default
    setMuteCon(false);
    setMutePro(false);
    setTestMode(false); // Let user control mute states
    
    console.log('✅ Initial mute states set: PRO = false, CON = false');
  }, []);

  // Debug effect to log mute state changes
  useEffect(() => {
    console.log('🔄 Mute state changed - muteCon:', muteCon, 'mutePro:', mutePro, 'testMode:', testMode);
  }, [muteCon, mutePro, testMode]);

  // Set up debate timing when currentDebate changes
  useEffect(() => {
    if (currentDebate) {
      const halfDuration = Math.floor(currentDebate.duration * 30);
      setBuilderTime(halfDuration);
      setBreakerTime(halfDuration);
    }
  }, [currentDebate]);

  const { user } = useAuth();
  const avatarUrl = user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name || user?.email || '';
  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleBack = () => {
    localStorage.removeItem('currentDebate');
    navigate('/debates');
  };

  const renderLiveDebateTab = () => {
    if (!currentDebate) return null;

    return (
      <OneOnOneDebate
        currentDebate={currentDebate}
        isSpeaking={isSpeaking}
        speakingSide={speakingSide}
        mutePro={mutePro}
        muteCon={muteCon}
        setMutePro={setMutePro}
        setMuteCon={setMuteCon}
        remainingSeconds={null}
        selectedMinutes={5}
        selectedRound={1}
        proArgument=""
        conArgument=""
        onGenerate={() => {
          // The OneOnOneDebate component handles its own logic
          console.log('🎤 1-on-1 debate initialized');
        }}
        onUserSpeak={() => {
          // The OneOnOneDebate component handles its own logic
          console.log('🎤 1-on-1 debate user interaction');
        }}
        voiceStatus="available"
        isUserTurn={false}
      />
    );
  };

  const renderChatDebateTab = () => {
    if (!currentDebate) return null;

    return (
      <ChatDebate
        currentDebate={currentDebate}
        selectedMinutes={5}
        selectedRound={1}
        onBack={handleBack}
      />
    );
  };

  const renderAIDebateTab = () => {
    if (!currentDebate) return null;

    return <DebateWithAI currentDebate={currentDebate} />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading debate...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <header className="flex items-center justify-between px-16 py-4 bg-white/10 shadow-md">
        <div className="flex items-center flex-1">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
              <Brain className="w-7 h-7 text-white" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
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
          <h1 className="text-5xl font-bold text-white">Debate Tournament</h1>
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

      <main className="flex-1 flex justify-center pt-8 px-4 pb-8">
        <div className="w-full max-w-7xl mx-auto space-y-8">
          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-2">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('live')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 ${
                    activeTab === 'live'
                      ? 'bg-white text-purple-900 shadow-lg'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span>1-on-1 Debate</span>
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 ${
                    activeTab === 'chat'
                      ? 'bg-white text-purple-900 shadow-lg'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Chat Debate</span>
                </button>
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 ${
                    activeTab === 'ai'
                      ? 'bg-white text-purple-900 shadow-lg'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Brain className="w-5 h-5" />
                  <span>Debate with AI</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'live' && renderLiveDebateTab()}
          {activeTab === 'chat' && renderChatDebateTab()}
          {activeTab === 'ai' && renderAIDebateTab()}
        </div>
      </main>

      {/* Back Button */}
      <div className="fixed bottom-8 left-8">
        <button
          onClick={handleBack}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
      </div>
    </div>
  );
};

export default DebateTournament;