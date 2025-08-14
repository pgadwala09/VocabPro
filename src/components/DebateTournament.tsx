import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Users, MessageSquare, ArrowLeft, Mic, MicOff, Play, Pause, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

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
    try {
      const savedDebate = localStorage.getItem('currentDebate');
      console.log('Loading debate data from localStorage:', savedDebate);
      if (savedDebate) {
        const parsed = JSON.parse(savedDebate);
        console.log('Parsed debate data:', parsed);
        const debateData = {
          ...parsed,
          createdAt: parsed.createdAt ? new Date(parsed.createdAt) : new Date()
        };
        console.log('Processed debate data:', debateData);
        return debateData;
      }
      console.log('No debate data found in localStorage');
      return null;
    } catch (error) {
      console.error('Error loading debate data:', error);
      return null;
    }
  });
  
  const [isDebateStarted, setIsDebateStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [builderTime, setBuilderTime] = useState(0);
  const [breakerTime, setBreakerTime] = useState(0);
  const [activeRole, setActiveRole] = useState<'builder' | 'breaker' | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  interface DebateActivity {
    id: string;
    topic: string;
    timestamp: Date;
    builderCharacter: string;
    breakerCharacter: string;
    duration: string;
    recordings: Array<{
      id: string;
      url: string;
      timestamp: Date;
      role: 'builder' | 'breaker';
    }>;
  }

  const [recordings, setRecordings] = useState<Array<{
    id: string;
    url: string;
    timestamp: Date;
    role: 'builder' | 'breaker';
    topic: string;
  }>>(JSON.parse(localStorage.getItem('debateRecordings') || '[]'));

  const [liveDebates, setLiveDebates] = useState<DebateActivity[]>(() => {
    const saved = localStorage.getItem('liveDebates');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTab, setActiveTab] = useState<'live' | 'chat'>('live');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{
    id: string;
    text: string;
    timestamp: Date;
    sender: string;
    reactions: Array<{
      emoji: string;
      count: number;
      users: string[];
    }>;
  }>>(JSON.parse(localStorage.getItem('chatMessages') || '[]'));
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

  const { user } = useAuth();
  const avatarUrl = user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name || user?.email || '';
  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  useEffect(() => {
    if (!currentDebate) {
      navigate('/debates');
    } else {
      // Initialize timers when debate data is loaded
      const halfDuration = Math.floor(currentDebate.duration * 30);
      setBuilderTime(halfDuration);
      setBreakerTime(halfDuration);
    }
  }, [currentDebate, navigate]);

  // Save recordings to localStorage
  useEffect(() => {
    localStorage.setItem('debateRecordings', JSON.stringify(recordings));
  }, [recordings]);

  useEffect(() => {
    localStorage.setItem('liveDebates', JSON.stringify(liveDebates));
  }, [liveDebates]);

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmojiPicker && !(event.target as Element).closest('.emoji-picker-container')) {
        setShowEmojiPicker(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isDebateStarted && activeRole) {
      interval = setInterval(() => {
        if (activeRole === 'builder' && builderTime > 0) {
          setBuilderTime(time => time - 1);
        } else if (activeRole === 'breaker' && breakerTime > 0) {
          setBreakerTime(time => time - 1);
        } else if (builderTime === 0 && breakerTime > 0) {
          // Switch to breaker when builder time is up
          setActiveRole('breaker');
        } else if (breakerTime === 0 && builderTime > 0) {
          // Switch to builder when breaker time is up
          setActiveRole('builder');
        } else {
          // Stop debate when both timers are up
          clearInterval(interval);
          setIsDebateStarted(false);
          setActiveRole(null);
          stopRecording();
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDebateStarted, activeRole, builderTime, breakerTime]);

  // Initialize recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
          setAudioChunks([...chunks]);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const newRecording = {
          id: Date.now().toString(),
          url: audioUrl,
          timestamp: new Date(),
          role: activeRole || 'builder'
        };

        // Update live debates
        setLiveDebates(prev => {
          const existingDebateIndex = prev.findIndex(d => d.topic === currentDebate.topic);
          if (existingDebateIndex >= 0) {
            // Update existing debate
            const updatedDebates = [...prev];
            updatedDebates[existingDebateIndex] = {
              ...updatedDebates[existingDebateIndex],
              recordings: [...updatedDebates[existingDebateIndex].recordings, newRecording]
            };
            return updatedDebates;
          } else {
            // Create new debate entry
            return [...prev, {
              id: Date.now().toString(),
              topic: currentDebate.topic,
              timestamp: new Date(),
              builderCharacter: currentDebate.builderCharacter,
              breakerCharacter: currentDebate.breakerCharacter,
              duration: currentDebate.duration,
              recordings: [newRecording]
            }];
          }
        });
      };

      // Set data available event to trigger every second
      recorder.start(1000);
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      // Stop all audio tracks
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleBack = () => {
    // Clear the current debate data when going back
    localStorage.removeItem('currentDebate');
    navigate('/debates');
  };

  // Emoji picker component
  const EmojiPicker = ({ messageId, onEmojiSelect }: { messageId: string; onEmojiSelect: (emoji: string) => void }) => {
    const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🎉', '🔥', '💯', '🤔', '👀'];
    
         return (
       <div className="emoji-picker-container absolute bottom-full left-0 mb-2 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 p-3 z-10">
        <div className="grid grid-cols-4 gap-2">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onEmojiSelect(emoji)}
              className="w-8 h-8 text-xl hover:bg-white/20 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Handle emoji reaction
  const handleEmojiReaction = (messageId: string, emoji: string) => {
    const updatedMessages = messages.map(msg => {
      if (msg.id === messageId) {
        const existingReaction = msg.reactions?.find(r => r.emoji === emoji);
        if (existingReaction) {
          // If user already reacted, remove their reaction
          const userIndex = existingReaction.users.indexOf(currentDebate.builderCharacter);
          if (userIndex > -1) {
            existingReaction.users.splice(userIndex, 1);
            existingReaction.count--;
            if (existingReaction.count === 0) {
              return {
                ...msg,
                reactions: msg.reactions?.filter(r => r.emoji !== emoji) || []
              };
            }
          } else {
            // Add user reaction
            existingReaction.users.push(currentDebate.builderCharacter);
            existingReaction.count++;
          }
        } else {
          // Create new reaction
          const newReaction = {
            emoji,
            count: 1,
            users: [currentDebate.builderCharacter]
          };
          return {
            ...msg,
            reactions: [...(msg.reactions || []), newReaction]
          };
        }
      }
      return msg;
    });
    
    setMessages(updatedMessages);
    setShowEmojiPicker(null);
  };

  const renderLiveDebateTab = () => {
    if (!currentDebate) {
      console.log('No current debate data available');
      return (
        <div className="w-full max-w-7xl mx-auto space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Live Debates</h1>
            <p className="text-xl text-gray-300">No debate data available</p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Live Debates</h1>
          <p className="text-xl text-gray-300">Join real-time debates with other participants</p>
        </div>

        {/* Debate Panel */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden relative">
          {/* Title Bar */}
          <div className="bg-gradient-to-r from-purple-600/50 to-blue-600/50 p-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-purple-300">Builder</div>
              <h2 className="text-2xl font-bold text-white text-center">{currentDebate.topic}</h2>
              <div className="text-lg font-semibold text-blue-300">Breaker</div>
            </div>
          </div>

          {/* Debate Info */}
          <div className="p-4 flex items-center justify-between text-gray-300">
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">Live Now</span>
            <span className="text-sm">{currentDebate.duration} minutes</span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">{currentDebate.debateStyle}</span>
          </div>

          {/* Participants Panel */}
          <div className="grid grid-cols-3 gap-4 p-6">
            {/* Builder */}
            <div className="bg-purple-500/20 rounded-xl p-6 text-center h-[32rem]">
              <div className="text-lg font-semibold text-purple-300 mb-4">Builder</div>
              
              {/* Timer and Points */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-purple-500/30 rounded-lg p-3">
                  <div className="text-sm text-purple-300 mb-1">Timer</div>
                  <div className={`text-2xl font-bold ${activeRole === 'builder' ? 'text-purple-300' : 'text-white'}`}>
                    {Math.floor(builderTime / 60)}:{(builderTime % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                <div className="bg-purple-500/30 rounded-lg p-3">
                  <div className="text-sm text-purple-300 mb-1">Points</div>
                  <div className="text-2xl font-bold text-white">0</div>
                </div>
              </div>

              {/* Character Icon */}
              <div className={`w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4 shadow-lg ${
                activeRole === 'builder' ? 'ring-4 ring-purple-400 animate-pulse' : ''
              }`}>
                <span className="text-4xl">🎭</span>
              </div>
              <div className="text-xl text-white font-medium">{currentDebate.builderCharacter}</div>
            </div>

            {/* VS with Trophy */}
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                {/* Main Trophy Container */}
                <div className="w-40 h-48 relative drop-shadow-lg">
                  {/* Trophy Head */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-24 bg-yellow-300 rounded-lg overflow-hidden">
                    {/* Trophy Icon Container */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Trophy className="w-16 h-16 text-yellow-100" />
                    </div>
                  </div>

                  {/* Trophy Handles */}
                  <div className="absolute top-6 -left-6 w-6 h-16 bg-yellow-300 rounded-full" />
                  <div className="absolute top-6 -right-6 w-6 h-16 bg-yellow-300 rounded-full" />

                  {/* Trophy Neck */}
                  <div className="absolute top-24 left-1/2 transform -translate-x-1/2">
                    {/* Neck Top */}
                    <div className="w-10 h-4 bg-yellow-300" />
                    {/* Neck Bottom */}
                    <div className="w-8 h-8 bg-yellow-300" />
                  </div>

                  {/* Trophy Base */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                    {/* Base Top */}
                    <div className="w-24 h-4 bg-yellow-300" />
                    {/* Base Bottom */}
                    <div className="w-32 h-6 bg-yellow-300" />
                  </div>
                </div>
              </div>
              
              <div className="text-5xl font-bold text-white/50 mt-6">VS</div>
            </div>

            {/* Breaker */}
            <div className="bg-blue-500/20 rounded-xl p-6 text-center h-[32rem]">
              <div className="text-lg font-semibold text-blue-300 mb-4">Breaker</div>
              
              {/* Timer and Points */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-500/30 rounded-lg p-3">
                  <div className="text-sm text-blue-300 mb-1">Timer</div>
                  <div className={`text-2xl font-bold ${activeRole === 'breaker' ? 'text-blue-300' : 'text-white'}`}>
                    {Math.floor(breakerTime / 60)}:{(breakerTime % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                <div className="bg-blue-500/30 rounded-lg p-3">
                  <div className="text-sm text-blue-300 mb-1">Points</div>
                  <div className="text-2xl font-bold text-white">0</div>
                </div>
              </div>

              {/* Character Icon */}
              <div className={`w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4 shadow-lg ${
                activeRole === 'breaker' ? 'ring-4 ring-blue-400 animate-pulse' : ''
              }`}>
                <span className="text-4xl">🎭</span>
              </div>
              <div className="text-xl text-white font-medium">{currentDebate.breakerCharacter}</div>
            </div>
          </div>

          {/* Action Button and Recording Section */}
          <div className="p-6 border-t border-white/10 h-48 flex flex-col items-center justify-center space-y-6">
            {/* Start/Progress Button */}
            <button 
              onClick={() => {
                if (!isDebateStarted) {
                  setIsDebateStarted(true);
                  setActiveRole('builder');
                  startRecording();
                }
              }}
              disabled={isDebateStarted}
              className={`w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-3 ${
                isDebateStarted 
                  ? 'opacity-90 cursor-not-allowed'
                  : 'hover:from-green-700 hover:to-emerald-700 transform hover:scale-105'
              }`}
            >
              <MessageSquare className="w-6 h-6" />
              <span>{isDebateStarted ? 'Debate in Progress' : 'Start Debate'}</span>
            </button>

            {/* Recording Controls */}
            {isDebateStarted && (
              <div className="flex flex-col items-center space-y-4">
                <div className="text-xl font-semibold text-white mb-2">
                  {activeRole === 'builder' ? 'Builder\'s Turn' : 'Breaker\'s Turn'}
                </div>
                <button
                  onClick={() => {
                    if (isRecording) {
                      stopRecording();
                    } else {
                      startRecording();
                    }
                  }}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                  }`}
                >
                  {isRecording ? (
                    <Pause className="w-10 h-10 text-white" />
                  ) : (
                    <Play className="w-10 h-10 text-white ml-1" />
                  )}
                </button>
                {/* Recording Indicator */}
                <div className="flex justify-center">
                  {isRecording ? (
                    <div className="flex items-center justify-center w-3 h-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute"></div>
                      <div className="w-3 h-3 bg-red-500 rounded-full relative"></div>
                    </div>
                  ) : (
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  )}
                </div>
              </div>
            )}
          </div>


        </div>

        {/* Recent Activity List */}
        {liveDebates.length > 0 && (
          <div className="mt-8 w-full max-w-7xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              <div className="flex flex-col items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Recent Activity</h3>
              </div>
              <div className="space-y-6">
                {liveDebates.map((debate) => (
                  <div 
                    key={debate.id}
                    className="bg-white/5 rounded-lg p-4 border border-white/20"
                  >
                    <div className="flex flex-col space-y-4">
                      {/* Debate Header */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div className="text-lg font-medium text-white">
                          {debate.topic}
                        </div>
                        <div className="text-sm text-gray-400">
                          {new Date(debate.timestamp).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Debate Info */}
                      <div className="grid grid-cols-3 gap-4 text-sm text-gray-300">
                        <div>Duration: {debate.duration} min</div>
                        <div>Builder: {debate.builderCharacter}</div>
                        <div>Breaker: {debate.breakerCharacter}</div>
                      </div>

                      {/* Recordings */}
                      <div className="space-y-3">
                        {debate.recordings.map((recording) => (
                          <div 
                            key={recording.id}
                            className={`bg-white/5 rounded-lg p-3 border ${
                              recording.role === 'builder' ? 'border-purple-500/30' : 'border-blue-500/30'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className={`text-sm font-medium ${
                                recording.role === 'builder' ? 'text-purple-300' : 'text-blue-300'
                              }`}>
                                {recording.role === 'builder' ? 'Builder' : 'Breaker'}
                              </div>
                              <div className="text-sm text-gray-400">
                                {new Date(recording.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                            <audio 
                              src={recording.url} 
                              controls 
                              className="w-full h-8"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderChatDebateTab = () => {
    if (!currentDebate) {
      console.log('No current debate data available for chat');
      return (
        <div className="w-full max-w-7xl mx-auto space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Chat Debates</h1>
            <p className="text-xl text-gray-300">No debate data available</p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Chat Debates</h1>
          <p className="text-xl text-gray-300">Engage in text-based debate discussions</p>
        </div>

             {/* Chat Panel */}
       <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
         {/* Chat Area */}
        <div className="h-[600px] flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400">
                No messages yet. Start a debate conversation!
              </div>
            ) : (
                             messages.map((msg) => (
                 <div
                   key={msg.id}
                   className={`flex flex-col ${
                     msg.sender === currentDebate.builderCharacter ? 'items-end' : 'items-start'
                   }`}
                 >
                   <div className={`max-w-[80%] rounded-xl p-3 relative ${
                     msg.sender === currentDebate.builderCharacter
                       ? 'bg-purple-500/20 text-purple-100'
                       : 'bg-blue-500/20 text-blue-100'
                   }`}>
                     <div className="text-sm font-medium mb-1">{msg.sender}</div>
                     <div>{msg.text}</div>
                     <div className="text-xs opacity-70 mt-1">
                       {new Date(msg.timestamp).toLocaleTimeString()}
                     </div>
                     
                     {/* Emoji Reactions */}
                     {msg.reactions && msg.reactions.length > 0 && (
                       <div className="flex flex-wrap gap-1 mt-2">
                         {msg.reactions.map((reaction, index) => (
                           <button
                             key={index}
                             onClick={() => handleEmojiReaction(msg.id, reaction.emoji)}
                             className={`px-2 py-1 rounded-full text-xs transition-all duration-200 ${
                               reaction.users.includes(currentDebate.builderCharacter)
                                 ? 'bg-white/30 text-white'
                                 : 'bg-white/10 text-white/70 hover:bg-white/20'
                             }`}
                           >
                             {reaction.emoji} {reaction.count}
                           </button>
                         ))}
                       </div>
                     )}
                     
                     {/* Add Reaction Button */}
                     <button
                       onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                       className="emoji-picker-container absolute -bottom-2 -right-2 w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-xs transition-all duration-200"
                     >
                       😊
                     </button>
                     
                     {/* Emoji Picker */}
                     {showEmojiPicker === msg.id && (
                       <EmojiPicker
                         messageId={msg.id}
                         onEmojiSelect={handleEmojiReaction}
                       />
                     )}
                   </div>
                 </div>
               ))
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/20">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!message.trim()) return;

                                 const newMessage = {
                   id: Date.now().toString(),
                   text: message.trim(),
                   timestamp: new Date(),
                   sender: currentDebate.builderCharacter,
                   reactions: []
                 };

                const updatedMessages = [...messages, newMessage];
                setMessages(updatedMessages);
                localStorage.setItem('chatMessages', JSON.stringify(updatedMessages));
                setMessage('');
              }}
              className="flex space-x-4"
            >
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
              <button 
                type="submit"
                disabled={!message.trim()}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Send</span>
                <MessageSquare className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
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

      <div className="flex justify-center pt-8 px-4">
        <div className="flex gap-4 bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-white/50 p-2">
          {[
            { id: 'live', label: 'Live Debates', icon: Users },
            { id: 'chat', label: 'Chat Debates', icon: MessageSquare }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center ${
                activeTab === tab.id
                  ? 'bg-white text-purple-900 shadow-lg transform scale-105'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              <tab.icon className="w-5 h-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 flex justify-center pt-8 px-4 pb-8">
        <div className="w-full">
          {activeTab === 'live' && renderLiveDebateTab()}
          {activeTab === 'chat' && renderChatDebateTab()}
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