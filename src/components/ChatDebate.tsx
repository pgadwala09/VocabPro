import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, MessageSquare, ArrowLeft, Smile } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import EmojiPickerLib from 'emoji-picker-react';

interface ChatDebateProps {
  currentDebate: any;
  selectedMinutes: number;
  selectedRound: number;
  onBack: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  message: string;
  timestamp: Date;
  reactions?: Array<{
    emoji: string;
    count: number;
    users: string[];
  }>;
}

const ChatDebate: React.FC<ChatDebateProps> = ({
  currentDebate,
  selectedMinutes,
  selectedRound,
  onBack
}) => {
  const { user } = useAuth();
  const fullName = user?.user_metadata?.full_name || user?.email || '';
  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize debate
  useEffect(() => {
    if (currentDebate) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        sender: 'ai',
        message: `Hello! I'm your AI debate partner. We're discussing "${currentDebate.topic}". Feel free to share your thoughts and arguments. I'm here to engage in a thoughtful conversation with you!`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [currentDebate]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateAIResponse = async (userMessage: string) => {
    setIsTyping(true);
    
    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const aiResponses = [
      `That's an interesting perspective! ${userMessage.toLowerCase().includes('ai') ? 'AI does indeed present both opportunities and challenges.' : 'I can see why you might think that way.'} However, I'd like to offer a different viewpoint that might add to our discussion.`,
      `I appreciate you sharing that thought. ${userMessage.toLowerCase().includes('education') ? 'Education is such a complex topic with many facets to consider.' : 'There are certainly multiple angles to explore here.'} Let me present a counter-argument that might enrich our conversation.`,
      `You make a compelling point! ${userMessage.toLowerCase().includes('benefit') ? 'While there are indeed benefits, we should also consider the potential drawbacks.' : 'That\'s a valid observation that deserves careful consideration.'} Here's another perspective to think about.`,
      `That's a thoughtful argument. ${userMessage.toLowerCase().includes('future') ? 'The future implications are certainly worth discussing.' : 'This is exactly the kind of nuanced discussion I enjoy.'} Let me share a different viewpoint that might contribute to our debate.`,
      `I see where you're coming from. ${userMessage.toLowerCase().includes('technology') ? 'Technology is transforming many aspects of our lives.' : 'This is a complex issue that requires careful analysis.'} However, I think there's another side to this that we should consider.`,
      `Excellent point! ${userMessage.toLowerCase().includes('society') ? 'Society is indeed evolving rapidly.' : 'This touches on some fundamental questions.'} Let me offer a contrasting perspective that might add depth to our discussion.`
    ];
    
    const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
    
    const aiMessage: ChatMessage = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      message: randomResponse,
      timestamp: new Date(),
      reactions: []
    };
    
    setMessages(prev => [...prev, aiMessage]);
    setIsTyping(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      message: inputMessage,
      timestamp: new Date(),
      reactions: []
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    
    // Generate AI response
    await generateAIResponse(inputMessage);
  };

  const handleEmojiReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const existingReaction = msg.reactions?.find(r => r.emoji === emoji);
        if (existingReaction) {
          // Increment existing reaction
          return {
            ...msg,
            reactions: msg.reactions?.map(r => 
              r.emoji === emoji 
                ? { ...r, count: r.count + 1, users: [...r.users, fullName] }
                : r
            )
          };
        } else {
          // Add new reaction
          return {
            ...msg,
            reactions: [...(msg.reactions || []), { emoji, count: 1, users: [fullName] }]
          };
        }
      }
      return msg;
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Debate Selection
          </button>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-400" />
            <span className="text-lg font-semibold text-white">Chat Debate</span>
          </div>
        </div>
        
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            {currentDebate?.topic || "AI-Assisted Learning Discussion"}
          </h1>
          
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-white/80">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4 text-blue-400" />
              <span>You</span>
            </div>
            <div className="flex items-center gap-1">
              <Bot className="w-4 h-4 text-purple-400" />
              <span>AI Partner</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 mb-6">
        <div className="p-4 border-b border-white/20">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Debate Chat
          </h2>
        </div>
        
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="relative group">
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl ${
                    message.sender === 'user'
                      ? 'bg-blue-500/20 text-white border border-blue-400/30'
                      : 'bg-purple-500/20 text-white border border-purple-400/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {message.sender === 'user' ? (
                      <User className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Bot className="w-4 h-4 text-purple-400" />
                    )}
                    <span className="text-xs font-semibold">
                      {message.sender === 'user' ? 'You' : 'AI Partner'}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{message.message}</p>
                  <div className="text-xs opacity-75">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                  
                  {/* Emoji Reactions */}
                  {message.reactions && message.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {message.reactions.map((reaction, index) => (
                        <button
                          key={index}
                          onClick={() => handleEmojiReaction(message.id, reaction.emoji)}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs transition-colors"
                          title={`${reaction.emoji} • ${reaction.users.join(', ')}`}
                        >
                          {reaction.emoji} {reaction.count}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Add Reaction Button */}
                <button
                  onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                  className="absolute -bottom-2 -right-2 w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-xs transition-all duration-200 opacity-0 group-hover:opacity-100"
                >
                  <Smile className="w-3 h-3" />
                </button>
                
                {/* Emoji Picker */}
                {showEmojiPicker === message.id && (
                  <div className="absolute top-full right-0 mt-2 z-10">
                    <EmojiPickerLib
                      onEmojiClick={(emojiData: any) => {
                        const emoji = emojiData.emoji;
                        handleEmojiReaction(message.id, emoji);
                        setShowEmojiPicker(null);
                      }}
                      lazyLoadEmojis
                      skinTonesDisabled
                      searchDisabled
                      previewConfig={{ showPreview: false }}
                      width={300}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-purple-500/20 text-white px-4 py-3 rounded-xl border border-purple-400/30">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-purple-400" />
                  <span className="text-sm">AI is typing...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message Input */}
        <div className="p-4 border-t border-white/20">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              disabled={isTyping}
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:bg-white/5"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white rounded-xl transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatDebate;
