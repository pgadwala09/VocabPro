import React, { useState, useEffect, useRef } from 'react';
import { Brain, Sparkles, Users, MessageSquare, ArrowLeft, Mic, MicOff, Play, Pause, Trophy, Clock, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { googleCloudTts, generateElevenLabsSpeech, openAiTts } from '../lib/tts';
import { generateDebateTurn } from '../lib/insights';

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

const DebateWithAI: React.FC<{ currentDebate: DebateData }> = ({ currentDebate }) => {
  const navigate = useNavigate();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingSide, setSpeakingSide] = useState<'pro' | 'con' | null>(null);
  const [mutePro, setMutePro] = useState(false);
  const [muteCon, setMuteCon] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [aiStartsFirst, setAiStartsFirst] = useState(false); // PRO starts the debate by default
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(5);
  const [voiceStatus, setVoiceStatus] = useState<'checking' | 'available' | 'fallback' | 'unavailable'>('checking');
  const [proArgument, setProArgument] = useState<string>('');
  const [conArgument, setConArgument] = useState<string>('');

  const { user } = useAuth();
  const avatarUrl = user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name || user?.email || '';
  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // Check voice system status on component mount
  useEffect(() => {
    const checkVoiceStatus = async () => {
      try {
        if ('speechSynthesis' in window) {
          setVoiceStatus('fallback');
        } else {
          setVoiceStatus('unavailable');
          return;
        }
        
        try {
          const gcpResponse = await fetch('http://127.0.0.1:8789/gcp/health');
          if (gcpResponse.ok) {
            setVoiceStatus('available');
            return;
          }
        } catch {}
        
        setVoiceStatus('fallback');
      } catch (error) {
        setVoiceStatus('fallback');
      }
    };
    
    checkVoiceStatus();
  }, []);

  // Enhanced AI voice function with browser speech synthesis as primary
  const playAIVoice = async (text: string): Promise<void> => {
    console.log('🎤 Playing AI voice for:', text);
    
    if (muteCon && !testMode) {
      console.log('❌ AI voice is muted. Use the CON AI Voice button to enable it.');
      alert('AI voice is muted. Click the "CON AI Voice" button to enable it.');
      return;
    }
    
    return new Promise(async (resolve, reject) => {
      console.log('🔊 Using browser speech synthesis for immediate response');
      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.lang = 'en-US';
          utterance.volume = 1.0;
          
          utterance.onstart = () => console.log('✅ Browser speech synthesis started');
          utterance.onend = () => {
            console.log('✅ Browser speech synthesis ended');
            resolve();
          };
          utterance.onerror = (e) => {
            console.error('❌ Browser speech synthesis error:', e);
            resolve();
          };
          
          window.speechSynthesis.speak(utterance);
        } else {
          console.error('❌ Browser speech synthesis not available');
          resolve();
        }
      } catch (error) {
        console.error('❌ Browser speech synthesis failed:', error);
        resolve();
      }
    });
  };

  // Simple thematic pools to ensure varied fallback content across turns
  const proThemes = ['benefits & impact', 'real-world example', 'cost–benefit', 'innovation', 'fairness', 'long-term gains'];
  const conThemes = ['risks & trade-offs', 'feasibility', 'cost burden', 'unintended effects', 'equity concerns', 'uncertainty'];

  const buildProFallback = (topic: string, theme: string): string => {
    switch (theme) {
      case 'benefits & impact':
        return `As PRO on ${topic}, the key point is practical benefit: it improves outcomes for ordinary people and removes friction in daily life. We get more value with fewer resources.`;
      case 'real-world example':
        return `For PRO on ${topic}, look at places that tried it: early pilots show higher satisfaction and measurable gains. When scaled carefully, results get better, not worse.`;
      case 'cost–benefit':
        return `From PRO, the cost of ${topic} is small compared with gains in productivity and wellbeing. The return on investment stacks up year after year.`;
      case 'innovation':
        return `PRO argues ${topic} unlocks innovation: once the baseline improves, people experiment more and new solutions appear faster.`;
      case 'fairness':
        return `PRO stresses fairness: ${topic} levels the playing field so opportunity depends less on luck and more on effort.`;
      default:
        return `Long term, ${topic} compounds advantages: small improvements each month add up to a step‑change over a few years.`;
    }
  };

  const buildConFallback = (topic: string, theme: string, lastProPoint?: string | null): string => {
    switch (theme) {
      case 'risks & trade-offs':
        return `As CON on ${topic}, every benefit hides a trade‑off: hidden costs, new failure points, or perverse incentives. We should not pretend the downsides vanish.`;
      case 'feasibility':
        return `CON questions feasibility: ${topic} sounds elegant, but execution is messy. Without capacity, the plan slips and outcomes disappoint.`;
      case 'cost burden':
        return `From CON, the price tag of ${topic} lands on taxpayers or users. Before expanding, prove it pays for itself without squeezing essentials.`;
      case 'unintended effects':
        return `CON warns about unintended effects: once ${topic} changes behavior, people adapt in ways that blunt the intended gains.`;
      case 'equity concerns':
        return `CON stresses equity: the groups who need help most may be last to benefit from ${topic}. ${lastProPoint ? 'Your claim ignores who gets left out.' : ''}`;
      default:
        return `Finally, CON highlights uncertainty: evidence is thin and cherry‑picked. A cautious pilot with clear exit criteria beats a blanket rollout.`;
    }
  };

  // Run a timed debate for the configured duration (minutes)
  const speakAgentsSequentially = async (topic: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    
    let tickTimer: NodeJS.Timeout | null = null;
    
    try {
      const minutes = selectedMinutes || (typeof currentDebate?.duration === 'number' && currentDebate.duration > 0 ? currentDebate.duration : 5);
      const endTs = Date.now() + minutes * 60 * 1000;
      
      setRemainingSeconds(Math.ceil((endTs - Date.now()) / 1000));
             tickTimer = setInterval(() => {
         const s = Math.max(0, Math.ceil((endTs - Date.now()) / 1000));
         setRemainingSeconds(s);
         if (s <= 0) {
           if (tickTimer) clearInterval(tickTimer);
           // Immediately stop any ongoing speech synthesis when timer reaches 0
           if ('speechSynthesis' in window) {
             window.speechSynthesis.cancel();
           }
         }
       }, 1000);
      
      let lastPro: string | null = null;
      let lastCon: string | null = null;
      let turn: 'pro' | 'con' = aiStartsFirst ? 'con' : 'pro';

      console.log('🎬 Debate starting...');
      console.log('🎯 Turn order:', aiStartsFirst ? 'CON starts first' : 'PRO starts first');
      console.log('🎤 First speaker:', turn);
      setSpeakingSide(turn);

      let firstArgument = '';
      if (turn === 'pro') {
        firstArgument = buildProFallback(topic, 'General');
      } else {
        firstArgument = buildConFallback(topic, 'General');
      }
      
      const firstVoicePromise = playAIVoice(firstArgument);

      let idx = 0;
      while (Date.now() < endTs) {
        if (turn === 'pro') {
          setSpeakingSide('pro');
          
          let text: string;
          if (idx === 0 && firstArgument) {
            text = firstArgument;
            console.log(`🎤 PRO Turn ${idx + 1} (Pre-generated):`, text);
            await firstVoicePromise;
          } else {
            const theme = proThemes[idx % proThemes.length];
            const generated = await generateDebateTurn('pro', topic, lastCon || undefined);
            text = generated || buildProFallback(topic, theme);
            
            const timeLeft = Math.max(0, Math.ceil((endTs - Date.now()) / 1000));
            const aiTurnDuration = Math.min(30, timeLeft);
            
            if (aiTurnDuration > 0) {
              await playAIVoice(text);
            }
          }
          
          setProArgument(text);
          lastPro = text;
          turn = 'con';
          setSpeakingSide(null);
        } else {
          setSpeakingSide('con');
          
          const theme = conThemes[idx % conThemes.length];
          const generated = await generateDebateTurn('con', topic, lastPro || undefined);
          const text = generated || buildConFallback(topic, theme, lastPro);
          
          const timeLeft = Math.max(0, Math.ceil((endTs - Date.now()) / 1000));
          const aiTurnDuration = Math.min(30, timeLeft);
          
          if (aiTurnDuration > 0) {
            await playAIVoice(text);
          }
          
          setConArgument(text);
          lastCon = text;
          turn = 'pro';
          setSpeakingSide(null);
        }
        
        idx += 1;
        await new Promise((r) => setTimeout(r, 500));
      }
    } finally {
      if (tickTimer) clearInterval(tickTimer);
      setIsSpeaking(false);
      setRemainingSeconds(null);
      setSpeakingSide(null);
    }
  };

  const handleBack = () => {
    localStorage.removeItem('currentDebate');
    navigate('/debates');
  };

     return (
           <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
       <main className="flex-1 flex justify-center pt-8 px-4 pb-8">
         <div className="w-full max-w-7xl mx-auto space-y-8">
           <div className="text-center mb-8">
             <h1 className="text-6xl font-bold text-white mb-4">Debate with AI</h1>
             <p className="text-xl text-gray-300">AI-powered debate with high-quality voice synthesis</p>
           </div>

          {/* Debate with AI panel */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
            <div className="p-6">
                             <div className="text-center mb-6">
                 {currentDebate?.topic ? (
                   <div className="text-white/90 text-lg font-medium">{currentDebate.topic}</div>
                 ) : null}
               </div>
              
              {/* Top row: PRO | Round | Timer | CON */}
              <div className="flex items-center justify-between mb-6">
                <div className="text-2xl font-bold text-white">PRO</div>
                <div className="flex items-center gap-4">
                  {isSpeaking ? (
                    <div className="flex items-center gap-2 bg-white/10 text-white px-3 py-2 rounded-xl border border-white/20 min-w-[100px] justify-center">
                      <Clock className="w-4 h-4" />
                      <span className="tabular-nums">{`${String(Math.floor((remainingSeconds ?? Math.round(selectedMinutes*60))/60)).padStart(2,'0')}:${String((remainingSeconds ?? Math.round(selectedMinutes*60))%60).padStart(2,'0')}`}</span>
                    </div>
                  ) : (
                    <>
                      <select value={selectedRound} onChange={(e)=>setSelectedRound(parseInt(e.target.value))} className="bg-white text-purple-900 px-4 py-2 rounded-xl border border-white/20">
                        <option value={1}>Round 1</option>
                        <option value={2}>Round 2</option>
                        <option value={3}>Round 3</option>
                      </select>
                      <select value={selectedMinutes} onChange={(e)=>setSelectedMinutes(parseFloat(e.target.value))} className="bg-white text-purple-900 px-4 py-2 rounded-xl border border-white/20">
                        <option value={0.5}>00:30</option>
                        <option value={1}>01:00</option>
                        <option value={2}>02:00</option>
                        <option value={3}>03:00</option>
                        <option value={5}>05:00</option>
                      </select>
                    </>
                  )}
                </div>
                <div className="text-2xl font-bold text-white">CON</div>
              </div>
              
              {/* Two columns */}
              <div className="relative grid grid-cols-2 gap-8">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20 pointer-events-none" />
                
                                                                                                    {/* PRO side */}
                 <div className="flex flex-col items-center">
                   <div className="flex items-center gap-3 mb-3">
                                                                                        <div className="flex items-center gap-2">
                         <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-300 to-blue-400 flex items-center justify-center shadow-lg border-2 border-blue-200 transform hover:scale-105 transition-transform">
                           <div className="w-10 h-10 text-white">
                             <svg viewBox="0 0 24 24" fill="currentColor">
                               {/* 3D Robot head with depth */}
                               <defs>
                                 <linearGradient id="robotGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                                   <stop offset="0%" style={{stopColor: "#ef4444", stopOpacity: 1}} />
                                   <stop offset="100%" style={{stopColor: "#dc2626", stopOpacity: 1}} />
                                 </linearGradient>
                                 <filter id="shadow1" x="-20%" y="-20%" width="140%" height="140%">
                                   <feDropShadow dx="2" dy="2" stdDeviation="1" floodColor="#000000" floodOpacity="0.3"/>
                                 </filter>
                               </defs>
                               
                               {/* Main robot head with 3D effect */}
                               <rect x="4" y="6" width="16" height="16" rx="3" fill="url(#robotGradient1)" filter="url(#shadow1)"/>
                               
                               {/* 3D highlight on top */}
                               <rect x="4" y="6" width="16" height="4" rx="3" fill="#fca5a5" opacity="0.6"/>
                               
                               {/* Eyes with 3D effect */}
                               <circle cx="8" cy="12" r="2" fill="#f97316"/>
                               <circle cx="16" cy="12" r="2" fill="#f97316"/>
                               <circle cx="8" cy="12" r="1" fill="#fdba74"/>
                               <circle cx="16" cy="12" r="1" fill="#fdba74"/>
                               
                               {/* Mouth with 3D effect */}
                               <rect x="10" y="16" width="4" height="2" rx="1" fill="white"/>
                               <rect x="10" y="16" width="4" height="1" rx="0.5" fill="#e5e7eb"/>
                               
                               {/* Antenna with 3D effect */}
                               <rect x="11" y="4" width="2" height="4" fill="#6b7280"/>
                               <circle cx="12" cy="4" r="1" fill="#ef4444"/>
                               
                               {/* Circuit patterns */}
                               <rect x="6" y="8" width="2" height="1" fill="#fbbf24" opacity="0.8"/>
                               <rect x="16" y="8" width="2" height="1" fill="#fbbf24" opacity="0.8"/>
                               <rect x="6" y="18" width="2" height="1" fill="#fbbf24" opacity="0.8"/>
                               <rect x="16" y="18" width="2" height="1" fill="#fbbf24" opacity="0.8"/>
                             </svg>
                           </div>
                         </div>
                         <select className="bg-white/10 text-white px-3 py-2 rounded-lg border border-white/20">
                           <option>AI</option>
                         </select>
                       </div>
                   </div>
                  <div className="w-full">
                    <div className="bg-white/10 text-white/90 rounded-xl border border-white/20 p-4 min-h-[160px]">
                      <div className="font-semibold mb-2">Argument</div>
                      <div className="whitespace-pre-wrap text-sm opacity-90">{proArgument || ' '}</div>
                    </div>
                  </div>
                </div>
                
                                                                                                     {/* CON side */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                       <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-300 to-green-400 flex items-center justify-center shadow-lg border-2 border-green-200 transform hover:scale-105 transition-transform">
                         <div className="w-10 h-10 text-white">
                           <svg viewBox="0 0 24 24" fill="currentColor">
                             {/* 3D Robot head with depth */}
                             <defs>
                               <linearGradient id="robotGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                                 <stop offset="0%" style={{stopColor: "#ef4444", stopOpacity: 1}} />
                                 <stop offset="100%" style={{stopColor: "#dc2626", stopOpacity: 1}} />
                               </linearGradient>
                               <filter id="shadow2" x="-20%" y="-20%" width="140%" height="140%">
                                 <feDropShadow dx="2" dy="2" stdDeviation="1" floodColor="#000000" floodOpacity="0.3"/>
                               </filter>
                             </defs>
                             
                             {/* Main robot head with 3D effect */}
                             <rect x="4" y="6" width="16" height="16" rx="3" fill="url(#robotGradient2)" filter="url(#shadow2)"/>
                             
                             {/* 3D highlight on top */}
                             <rect x="4" y="6" width="16" height="4" rx="3" fill="#fca5a5" opacity="0.6"/>
                             
                             {/* Eyes with 3D effect */}
                             <circle cx="8" cy="12" r="2" fill="#f97316"/>
                             <circle cx="16" cy="12" r="2" fill="#f97316"/>
                             <circle cx="8" cy="12" r="1" fill="#fdba74"/>
                             <circle cx="16" cy="12" r="1" fill="#fdba74"/>
                             
                             {/* Mouth with 3D effect */}
                             <rect x="10" y="16" width="4" height="2" rx="1" fill="white"/>
                             <rect x="10" y="16" width="4" height="1" rx="0.5" fill="#e5e7eb"/>
                             
                             {/* Antenna with 3D effect */}
                             <rect x="11" y="4" width="2" height="4" fill="#6b7280"/>
                             <circle cx="12" cy="4" r="1" fill="#ef4444"/>
                             
                             {/* Circuit patterns */}
                             <rect x="6" y="8" width="2" height="1" fill="#fbbf24" opacity="0.8"/>
                             <rect x="16" y="8" width="2" height="1" fill="#fbbf24" opacity="0.8"/>
                             <rect x="6" y="18" width="2" height="1" fill="#fbbf24" opacity="0.8"/>
                             <rect x="16" y="18" width="2" height="1" fill="#fbbf24" opacity="0.8"/>
                           </svg>
                         </div>
                       </div>
                       <select className="bg-white/10 text-white px-3 py-2 rounded-lg border border-white/20">
                         <option>AI</option>
                       </select>
                     </div>
                   </div>
                  <div className="w-full">
                    <div className="bg-white/10 text-white/90 rounded-xl border border-white/20 p-4 min-h-[160px]">
                      <div className="font-semibold mb-2">Argument</div>
                      <div className="whitespace-pre-wrap text-sm opacity-90">{conArgument || ' '}</div>
                    </div>
                  </div>
                </div>
              </div>

                             {/* Generate Debate Button */}
               <div className="mt-6">
                                                    <button onClick={async ()=>{
                    const topic = currentDebate?.topic || 'Debate Topic';
                    await speakAgentsSequentially(topic);
                  }} disabled={isSpeaking || voiceStatus === 'unavailable'} className="w-full bg-gradient-to-r from-orange-200 via-orange-300 to-orange-400 hover:from-orange-300 hover:via-orange-400 hover:to-orange-500 text-orange-900 font-semibold py-3 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                    {isSpeaking ? 'Generating...' : 'Generate Debate'}
                  </button>
              </div>
            </div>
          </div>
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

export default DebateWithAI;
