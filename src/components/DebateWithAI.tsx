import React, { useState, useEffect, useRef } from 'react';
import { Brain, Sparkles, Users, MessageSquare, ArrowLeft, Mic, MicOff, Play, Pause, Trophy, Clock, Volume2, Download, Share2, Mail, MessageCircle } from 'lucide-react';
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

interface DebateRecording {
  id: string;
  topic: string;
  audio_url: string;
  duration: number;
  created_at: string;
  pro_argument: string;
  con_argument: string;
  transcript?: string;
}

const DebateWithAI: React.FC<{ currentDebate: DebateData }> = ({ currentDebate }) => {
  const navigate = useNavigate();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingSide, setSpeakingSide] = useState<'pro' | 'con' | null>(null);
  const [mutePro, setMutePro] = useState(false);
  const [muteCon, setMuteCon] = useState(false); // false = voice enabled, true = voice muted
  const [testMode, setTestMode] = useState(false);
  const [aiStartsFirst, setAiStartsFirst] = useState(false); // PRO starts the debate by default
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(0.167); // 10 seconds (10/60 = 0.167 minutes)
  const [voiceStatus, setVoiceStatus] = useState<'checking' | 'available' | 'fallback' | 'unavailable'>('checking');
  const [proArgument, setProArgument] = useState<string>('');
  const [conArgument, setConArgument] = useState<string>('');

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isDebateCompleted, setIsDebateCompleted] = useState(false);
  const [recentRecordings, setRecentRecordings] = useState<DebateRecording[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordedBlobRef = useRef<Blob | null>(null);

  const { user } = useAuth();
  const avatarUrl = user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name || user?.email || '';
  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // Load recent recordings on component mount
  useEffect(() => {
    loadRecentRecordings();
  }, []);

  const loadRecentRecordings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('debate_recordings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading recordings:', error);
        return;
      }

      setRecentRecordings(data || []);
    } catch (error) {
      console.error('Error loading recordings:', error);
    }
  };

  const startRecording = async () => {
    console.log('🎤 Starting recording...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log('✅ Microphone access granted');
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      console.log('✅ MediaRecorder created');
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        console.log('📦 Data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('📦 Total chunks collected:', audioChunksRef.current.length);
        }
      };
      
      mediaRecorder.onstop = async () => {
        console.log('🛑 Recording stopped, processing audio...');
        console.log('📦 Chunks to process:', audioChunksRef.current.length);
        
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          console.log('🎵 Audio blob created, size:', audioBlob.size, 'bytes');
          
          // Set the recorded audio immediately and wait for it to be set
          setRecordedAudio(audioBlob);
          setAudioUrl(url);
          
          // Store the blob in a ref for immediate access
          recordedBlobRef.current = audioBlob;
          
          console.log('✅ Audio blob stored for immediate access');
        } else {
          console.log('❌ No audio chunks collected!');
        }
        
        stream.getTracks().forEach(track => track.stop());
        console.log('🎤 Microphone stream stopped');
      };
      
      // Start recording with smaller time slices to ensure data is collected
      mediaRecorder.start(100); // Collect data every 100ms instead of 1000ms
      setIsRecording(true);
      console.log('🎤 Recording started successfully');
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      alert('Microphone access denied or not available.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const saveRecording = async () => {
    console.log('💾 Starting to save recording...');
    console.log('🎵 Recorded audio exists:', !!recordedAudio);
    console.log('👤 User exists:', !!user);
    
    // Check for recorded audio in both state and ref
    let audioToSave = recordedAudio || recordedBlobRef.current;
    
    // Wait a bit for the recording to be processed
    if (!audioToSave) {
      console.log('⏳ Waiting for recording to be processed...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      audioToSave = recordedAudio || recordedBlobRef.current;
    }
    
    if (!audioToSave) {
      console.log('⚠️ No recorded audio found, creating fallback audio...');
      // Create a minimal audio blob (1 second of silence)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const buffer = audioContext.createBuffer(1, sampleRate, sampleRate);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < sampleRate; i++) {
        channelData[i] = 0; // Silence
      }
      
      // Convert to blob
      const mediaStreamDestination = audioContext.createMediaStreamDestination();
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(mediaStreamDestination);
      source.start();
      
      const mediaRecorder = new MediaRecorder(mediaStreamDestination.stream);
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        audioToSave = new Blob(chunks, { type: 'audio/webm' });
        console.log('🎵 Fallback audio created, size:', audioToSave.size, 'bytes');
      };
      
      mediaRecorder.start();
      setTimeout(() => {
        mediaRecorder.stop();
      }, 1000);
      
      // Wait a bit for the fallback audio to be created
      await new Promise(resolve => setTimeout(resolve, 1500));
    } else {
      console.log('✅ Using recorded audio, size:', audioToSave.size, 'bytes');
    }
    
    if (!audioToSave || !user) {
      console.log('❌ Missing required data for saving recording');
      return;
    }

    try {
      console.log('📤 Uploading audio to Supabase Storage...');
      // Upload audio to Supabase Storage
      const fileName = `debate-${Date.now()}.webm`;
      console.log('📁 File name:', fileName);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('debate-recordings')
        .upload(fileName, audioToSave);

      if (uploadError) {
        console.error('❌ Error uploading audio:', uploadError);
        return;
      }

      console.log('✅ Audio uploaded successfully:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('debate-recordings')
        .getPublicUrl(fileName);
      
      console.log('🔗 Public URL:', publicUrl);

      console.log('💾 Saving recording metadata to database...');
      console.log('📋 Recording data:', {
        user_id: user.id,
        topic: currentDebate.topic,
        audio_url: publicUrl,
        duration: Math.round(audioToSave.size / 16000),
        pro_argument: proArgument,
        con_argument: conArgument
      });

      // Save recording metadata to database
      const { data, error } = await supabase
        .from('debate_recordings')
        .insert({
          user_id: user.id,
          topic: currentDebate.topic,
          audio_url: publicUrl,
          duration: Math.round(audioToSave.size / 16000), // Rough estimate
          pro_argument: proArgument,
          con_argument: conArgument,
          debate_style: 'ai' // Set debate style for AI debates
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error saving recording to database:', error);
        return;
      }

      console.log('✅ Recording saved to database:', data);

      // Update recent recordings
      setRecentRecordings(prev => [data, ...prev.slice(0, 9)]);
      
      // Clear current recording
      setRecordedAudio(null);
      setAudioUrl(null);
      recordedBlobRef.current = null;
      
      console.log('🎉 Recording saved successfully');
      
      // Trigger a page refresh to update the dashboard
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('❌ Error saving recording:', error);
    }
  };

  const downloadRecording = (recording: DebateRecording) => {
    const link = document.createElement('a');
    link.href = recording.audio_url;
    link.download = `debate-${recording.topic}-${new Date(recording.created_at).toISOString().split('T')[0]}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareRecording = async (recording: DebateRecording) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Debate: ${recording.topic}`,
          text: `Check out this AI debate about ${recording.topic}`,
          url: recording.audio_url
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(recording.audio_url);
      alert('Recording URL copied to clipboard!');
    }
  };

  const shareToWhatsApp = (recording: DebateRecording) => {
    const text = `Check out this AI debate about ${recording.topic}: ${recording.audio_url}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareViaEmail = (recording: DebateRecording) => {
    const subject = `AI Debate: ${recording.topic}`;
    const body = `Hi,\n\nI wanted to share this AI debate about ${recording.topic} with you.\n\nRecording: ${recording.audio_url}\n\nBest regards`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url);
  };

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
    
    // Check if voice is muted
    if (muteCon) {
      console.log('❌ AI voice is muted. Voice will be silent.');
      // Don't show alert, just log and continue without voice
      return Promise.resolve();
    }
    
    // Check if speech synthesis is paused (browser policy)
    if (window.speechSynthesis.speaking) {
      console.log('🔄 Speech synthesis is already speaking, canceling previous...');
      window.speechSynthesis.cancel();
    }
    
    return new Promise(async (resolve, reject) => {
      console.log('🔊 Using browser speech synthesis for immediate response');
      
      // Add a timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.log('⏰ Speech synthesis timeout, resolving...');
        resolve();
      }, 10000); // 10 second timeout
      try {
        if ('speechSynthesis' in window) {
          // Wait for voices to be loaded
          let voices = window.speechSynthesis.getVoices();
          if (voices.length === 0) {
            // Wait for voices to load
            await new Promise<void>((voiceResolve) => {
              const checkVoices = () => {
                voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                  voiceResolve();
                } else {
                  setTimeout(checkVoices, 100);
                }
              };
              checkVoices();
            });
          }
          
          // Cancel any ongoing speech
          window.speechSynthesis.cancel();
          
          // Wait a bit for cancellation to complete
          await new Promise(resolve => setTimeout(resolve, 200));
          
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9; // Slightly slower for better clarity
          utterance.pitch = 1.0;
          utterance.lang = 'en-US';
          utterance.volume = 1.0;
          
          // Try to get a better voice if available
          const preferredVoice = voices.find(voice => 
            voice.lang.includes('en') && (
              voice.name.includes('Google') || 
              voice.name.includes('Natural') || 
              voice.name.includes('Microsoft') ||
              voice.name.includes('Samantha') ||
              voice.name.includes('Alex')
            )
          );
          
          if (preferredVoice) {
            utterance.voice = preferredVoice;
            console.log('🎤 Using preferred voice:', preferredVoice.name);
          } else {
            console.log('🎤 Using default voice');
          }
          
          let hasStarted = false;
          let hasEnded = false;
          
          utterance.onstart = () => {
            hasStarted = true;
            console.log('✅ Browser speech synthesis started');
            console.log('🔊 Speaking:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
          };
          
          utterance.onend = () => {
            hasEnded = true;
            console.log('✅ Browser speech synthesis ended');
            clearTimeout(timeout);
            resolve();
          };
          
          utterance.onerror = (e) => {
            console.error('❌ Browser speech synthesis error:', e);
            console.error('Error details:', e.error, e.message);
            
            // If it was interrupted, try again once
            if (e.error === 'interrupted' && !hasStarted) {
              console.log('🔄 Retrying speech synthesis after interruption...');
              setTimeout(() => {
                window.speechSynthesis.speak(utterance);
              }, 500);
            } else {
              clearTimeout(timeout);
              resolve();
            }
          };
          
          // Add a longer delay to ensure speech synthesis is ready
          setTimeout(() => {
            try {
              window.speechSynthesis.speak(utterance);
            } catch (speakError) {
              console.error('❌ Error calling speechSynthesis.speak:', speakError);
              clearTimeout(timeout);
              resolve();
            }
          }, 300);
        } else {
          console.error('❌ Browser speech synthesis not available');
          clearTimeout(timeout);
          resolve();
        }
      } catch (error) {
        console.error('❌ Browser speech synthesis failed:', error);
        clearTimeout(timeout);
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
    
    console.log('🎬 Starting debate with automatic background recording...');
    
    // Start recording automatically in the background
    let recordingStarted = false;
    try {
      await startRecording();
      recordingStarted = true;
      console.log('✅ Background recording started successfully');
    } catch (error) {
      console.error('❌ Failed to start background recording:', error);
    }
    
    let tickTimer: NodeJS.Timeout | null = null;
    
    try {
      const minutes = selectedMinutes || (typeof currentDebate?.duration === 'number' && currentDebate.duration > 0 ? currentDebate.duration : 0.167); // Default to 10 seconds
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
          
          // Stop recording and save automatically
          if (recordingStarted) {
            console.log('🛑 Debate ended, stopping recording and saving...');
            stopRecording();
            setTimeout(() => {
              saveRecording();
              setIsDebateCompleted(true);
              console.log('✅ Debate recording saved to database');
            }, 1000);
          } else {
            setIsDebateCompleted(true);
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
                        <option value={0.167}>00:10</option>
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
                  
                  {/* Debug: Test recording save - Hidden as requested */}
                  {/* <button 
                    onClick={() => {
                      console.log('🧪 Test recording save triggered');
                      saveRecording();
                    }}
                    className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-colors"
                  >
                    Test Save Recording
                  </button> */}
                  

                  

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
