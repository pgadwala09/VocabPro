import React, { useState, useRef, useEffect } from 'react';
import { Play, Mic, StopCircle, X, Brain, Sparkles, Volume2, BookOpen, MessageSquare, Music } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useVocabulary } from '../hooks/VocabularyContext';
import { useNavigate } from 'react-router-dom';
import { useFeedback } from '../hooks/FeedbackContext';

const PronunciationPractice: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pronunciation');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWord, setCurrentWord] = useState('Pronunciation');
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { vocabList } = useVocabulary();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // Initialize current word from vocabulary context
  useEffect(() => {
    if (vocabList && vocabList.length > 0) {
      const lastWord = vocabList[vocabList.length - 1];
      if (lastWord?.word) {
        setCurrentWord(lastWord.word);
      }
    }
  }, [vocabList]);

  const handleStartRecording = async () => {
    setAudioURL(null);
    audioChunks.current = [];
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
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert('Microphone access denied or not available.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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
    setIsRecording(false);
    setIsPlaying(false);
  };

  const avatarUrl = user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name || user?.email || '';
  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

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
              {activeTab === 'pronunciation' && (
                <div className="flex flex-col items-center space-y-8">
                  <div className="text-center">
                    <h2 className="text-5xl font-bold text-white mb-4">Echo Match</h2>
                    <div className="bg-gradient-to-r from-white/30 to-white/10 backdrop-blur-sm rounded-xl px-10 py-4 mb-4 border border-white/40 inline-block shadow-2xl">
                      <span className="text-5xl md:text-6xl font-black text-transparent bg-gradient-to-r from-blue-200 via-white to-purple-200 bg-clip-text tracking-wider drop-shadow-lg animate-pulse">{currentWord}</span>
                    </div>
                  </div>

                  <div className="w-[650px] h-[420px] bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-white/50 p-6 relative z-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                      {/* Left Card: Your Pronunciation */}
                      <div className="bg-white/10 rounded-xl border border-white/20 p-4 flex flex-col justify-between">
                        <div>
                          <div className="text-xl text-blue-200 mb-3">Your Pronunciation</div>
                          <p className="text-sm text-blue-200/80 mb-4">Record and practice.</p>
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
                      </div>

                      {/* Right Card: AI Pronunciation */}
                      <div className="bg-white/10 rounded-xl border border-white/20 p-4 flex flex-col justify-between">
                        <div>
                          <div className="text-xl text-blue-200 mb-3">AI Pronunciation</div>
                          <p className="text-sm text-gray-300">Coming soon...</p>
                        </div>
                        <div className="w-full flex items-center justify-center gap-3">
                          <button
                            disabled
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg shadow opacity-50 cursor-not-allowed"
                          >
                            Play AI Voice
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'flashcards' && (
                <div className="flex flex-col items-center space-y-8">
                  <h2 className="text-5xl font-bold text-white mb-8">Flash Cards</h2>
                  <div className="w-[650px] h-[420px] bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-white/50 p-8">
                    <p className="text-white text-center">Flashcards coming soon...</p>
                  </div>
                </div>
              )}

              {activeTab === 'tongue-twister' && (
                <div className="flex flex-col items-center space-y-8">
                  <h2 className="text-5xl font-bold text-white mb-8">Tongue Twister</h2>
                  <div className="w-[650px] h-[420px] bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-white/50 p-8">
                    <p className="text-white text-center">Tongue twisters coming soon...</p>
                  </div>
                </div>
              )}

              {activeTab === 'sound-safari' && (
                <div className="flex flex-col items-center space-y-8">
                  <h2 className="text-5xl font-bold text-white mb-8">Sound Safari</h2>
                  <div className="w-[650px] h-[420px] bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-white/50 p-8">
                    <p className="text-white text-center">Sound safari coming soon...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-[380px] h-[720px] bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-blue-200/50 p-10 flex flex-col">
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
                <div className="bg-white/20 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Current Word</h4>
                  <div className="text-2xl font-bold text-green-400">{currentWord}</div>
                </div>
                <div className="bg-white/20 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Words Available</h4>
                  <div className="text-2xl font-bold text-blue-400">{vocabList ? vocabList.length : 0}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Navigation */}
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
    </div>
  );
};

export default PronunciationPractice;
