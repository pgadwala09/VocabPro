import React, { useState, useRef, useEffect } from 'react';
import { sendDebateRequest, fetchDebateHistory, getDebateStats, searchDebateHistory } from '../lib/debateIntegration';
import { Mic, Send, Volume2, Loader2, MessageSquare, Brain, Users, Clock, Search, BarChart3, History, Filter } from 'lucide-react';
import DebateDebug from './DebateDebug';

interface DebateResponse {
  agent_text: string;
  audio_url?: string;
  history_updated?: boolean;
}

interface DebateMessage {
  id: string;
  userId: string;
  topic: string;
  message: string;
  response: DebateResponse;
  timestamp: Date;
}

interface DebateHistoryItem {
  id: string;
  user_id: string;
  topic: string;
  user_message: string;
  agent_response: string;
  audio_url?: string;
  history_updated?: boolean;
  timestamp: string;
}

interface DebateStats {
  totalExchanges: number;
  uniqueTopics: number;
  lastActivity: string | null;
  topics: string[];
}

const DebateInterface: React.FC = () => {
  const [userId, setUserId] = useState('cursor_user');
  const [topic, setTopic] = useState('AI benefits society');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<DebateResponse | null>(null);
  const [debateHistory, setDebateHistory] = useState<DebateMessage[]>([]);
  const [supabaseHistory, setSupabaseHistory] = useState<DebateHistoryItem[]>([]);
  const [debateStats, setDebateStats] = useState<DebateStats | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [debateHistory]);

  // Load debate history and stats on component mount
  useEffect(() => {
    loadDebateHistory();
    loadDebateStats();
  }, [userId]);

  // Load debate history from Supabase
  const loadDebateHistory = async () => {
    if (!userId) return;
    
    setIsLoadingHistory(true);
    try {
      const history = await fetchDebateHistory(userId, selectedTopic || undefined);
      setSupabaseHistory(history);
    } catch (error) {
      console.error('Failed to load debate history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load debate statistics
  const loadDebateStats = async () => {
    if (!userId) return;
    
    try {
      const stats = await getDebateStats(userId);
      setDebateStats(stats);
    } catch (error) {
      console.error('Failed to load debate stats:', error);
    }
  };

  // Search debate history
  const handleSearch = async () => {
    if (!userId || !searchTerm.trim()) {
      await loadDebateHistory();
      return;
    }
    
    setIsLoadingHistory(true);
    try {
      const results = await searchDebateHistory(userId, searchTerm);
      setSupabaseHistory(results);
    } catch (error) {
      console.error('Failed to search debate history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSubmit = async () => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    setCurrentResponse(null);

    try {
      const response = await sendDebateRequest(userId, topic, message);
      
      const newMessage: DebateMessage = {
        id: Date.now().toString(),
        userId,
        topic,
        message,
        response,
        timestamp: new Date()
      };

      setDebateHistory(prev => [...prev, newMessage]);
      setCurrentResponse(response);
      setMessage('');

      // Reload history and stats after new exchange
      await loadDebateHistory();
      await loadDebateStats();

      // Auto-play audio if available
      if (response.audio_url) {
        playAudio(response.audio_url);
      }
    } catch (error) {
      console.error('Debate request failed:', error);
      setCurrentResponse({
        agent_text: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
        audio_url: undefined,
        history_updated: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    audioRef.current = new Audio(audioUrl);
    audioRef.current.onplay = () => setIsPlaying(true);
    audioRef.current.onended = () => setIsPlaying(false);
    audioRef.current.onerror = () => setIsPlaying(false);
    audioRef.current.play().catch(console.error);
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-t-2xl p-6 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">AI Debate Interface</h1>
                <p className="text-white/70">Engage in intelligent conversations with AI</p>
              </div>
            </div>
                         <div className="flex items-center space-x-4 text-white/70">
               <div className="flex items-center space-x-2">
                 <Users className="w-5 h-5" />
                 <span>{debateHistory.length} exchanges</span>
               </div>
               <div className="flex items-center space-x-2">
                 <BarChart3 className="w-5 h-5" />
                 <span>{debateStats?.totalExchanges || 0} total</span>
               </div>
               <button
                 onClick={() => setShowHistory(!showHistory)}
                 className="flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
               >
                 <History className="w-4 h-4" />
                 <span>{showHistory ? 'Hide' : 'Show'} History</span>
               </button>
             </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white/10 backdrop-blur-lg p-6 border-b border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">User ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter your user ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Debate Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter debate topic"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSubmit}
                disabled={isLoading || !message.trim()}
                className="w-full px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Start Debate</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Your Message</label>
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="Type your message here... (Press Enter to send)"
                rows={3}
              />
              <div className="absolute bottom-3 right-3 text-white/50 text-sm">
                {message.length}/500
              </div>
            </div>
          </div>
        </div>

        {/* Current Response */}
        {currentResponse && (
          <div className="bg-white/10 backdrop-blur-lg p-6 border-b border-white/20">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-white font-medium">AI Agent</span>
                  <span className="text-white/50 text-sm">{formatTime(new Date())}</span>
                </div>
                <div className="bg-white/5 rounded-lg p-4 mb-3">
                  <p className="text-white leading-relaxed">{currentResponse.agent_text}</p>
                </div>
                {currentResponse.audio_url && (
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => isPlaying ? stopAudio() : playAudio(currentResponse.audio_url!)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                    >
                      {isPlaying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Playing...</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4" />
                          <span>Play Audio</span>
                        </>
                      )}
                    </button>
                    {currentResponse.history_updated && (
                      <span className="text-green-400 text-sm flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>History Updated</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

                 {/* Supabase Debate History */}
         {showHistory && (
           <div className="bg-white/10 backdrop-blur-lg p-6 border-b border-white/20">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                 <History className="w-5 h-5" />
                 <span>Debate History from Database</span>
               </h3>
               <div className="flex items-center space-x-2">
                 <select
                   value={selectedTopic}
                   onChange={(e) => {
                     setSelectedTopic(e.target.value);
                     loadDebateHistory();
                   }}
                   className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                 >
                   <option value="">All Topics</option>
                   {debateStats?.topics.map((topic) => (
                     <option key={topic} value={topic}>{topic}</option>
                   ))}
                 </select>
               </div>
             </div>

             {/* Search Bar */}
             <div className="flex items-center space-x-2 mb-4">
               <div className="flex-1 relative">
                 <input
                   type="text"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                   placeholder="Search debate history..."
                   className="w-full px-4 py-2 pl-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                 />
                 <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 transform -translate-y-1/2" />
               </div>
               <button
                 onClick={handleSearch}
                 className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
               >
                 Search
               </button>
             </div>

             {/* History List */}
             <div className="max-h-64 overflow-y-auto">
               {isLoadingHistory ? (
                 <div className="text-center py-8">
                   <Loader2 className="w-8 h-8 text-white/50 mx-auto animate-spin" />
                   <p className="text-white/50 mt-2">Loading history...</p>
                 </div>
               ) : supabaseHistory.length === 0 ? (
                 <div className="text-center py-8">
                   <History className="w-16 h-16 text-white/30 mx-auto mb-4" />
                   <p className="text-white/50">No debate history found</p>
                 </div>
               ) : (
                 <div className="space-y-3">
                   {supabaseHistory.map((item) => (
                     <div key={item.id} className="bg-white/5 rounded-lg p-3">
                       <div className="flex items-start space-x-3">
                         <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                           <span className="text-white text-xs font-medium">
                             {item.user_id.charAt(0).toUpperCase()}
                           </span>
                         </div>
                         <div className="flex-1 min-w-0">
                           <div className="flex items-center space-x-2 mb-1">
                             <span className="text-white font-medium text-sm">{item.user_id}</span>
                             <span className="text-white/50 text-xs">{formatTime(new Date(item.timestamp))}</span>
                           </div>
                           <p className="text-purple-300 text-xs mb-1">
                             <span className="text-white/70">Topic:</span> {item.topic}
                           </p>
                           <p className="text-white text-sm mb-2">{item.user_message}</p>
                           <div className="bg-white/5 rounded p-2">
                             <p className="text-green-400 text-xs font-medium mb-1">AI Response:</p>
                             <p className="text-white/90 text-sm">{item.agent_response}</p>
                           </div>
                           {item.audio_url && (
                             <button
                               onClick={() => playAudio(item.audio_url!)}
                               className="mt-2 flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-xs"
                             >
                               <Volume2 className="w-3 h-3" />
                               <span>Play Audio</span>
                             </button>
                           )}
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           </div>
         )}

         {/* Current Session History */}
         <div className="bg-white/10 backdrop-blur-lg rounded-b-2xl p-6 max-h-96 overflow-y-auto">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Debate History</span>
          </h3>
          
          {debateHistory.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <p className="text-white/50">No debate history yet. Start a conversation above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {debateHistory.map((debate) => (
                <div key={debate.id} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-medium">
                        {debate.userId.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-white font-medium">{debate.userId}</span>
                        <span className="text-white/50 text-sm">{formatTime(debate.timestamp)}</span>
                      </div>
                      <div className="mb-3">
                        <p className="text-white/80 text-sm mb-1">
                          <span className="text-purple-300">Topic:</span> {debate.topic}
                        </p>
                        <p className="text-white">{debate.message}</p>
                      </div>
                      
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Brain className="w-4 h-4 text-green-400" />
                          <span className="text-green-400 text-sm font-medium">AI Response</span>
                        </div>
                        <p className="text-white/90 text-sm">{debate.response.agent_text}</p>
                        {debate.response.audio_url && (
                          <button
                            onClick={() => playAudio(debate.response.audio_url!)}
                            className="mt-2 flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>Play Audio</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
                 </div>
       </div>
       
       {/* Debug Panel */}
       <DebateDebug />
     </div>
   );
 };

export default DebateInterface;
