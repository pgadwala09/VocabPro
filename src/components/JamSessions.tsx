import React, { useState, useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
// import { useNavigate } from 'react-router-dom';
import { Mic, StopCircle, Brain, Sparkles, FileText, BarChart3, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { firecrawlSearch, firecrawlScrape } from '../lib/firecrawl';
import { serpSearch } from '../lib/serp';
import { wikiBestArticle } from '../lib/wikipedia';
// import { generateElevenLabsSpeech, speakWithBrowser } from '../lib/tts';
import { generateStructuredNotes, transcribeAudioWhisper } from '../lib/insights';

// Custom CSS for enhanced talking animations
const talkingStyles = `
  @keyframes talkBounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  @keyframes mouthMove {
    0%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(1.2); }
  }
  
  @keyframes sparkleFloat {
    0% { transform: translateY(0px) rotate(0deg); opacity: 1; }
    50% { transform: translateY(-10px) rotate(180deg); opacity: 0.7; }
    100% { transform: translateY(0px) rotate(360deg); opacity: 1; }
  }
  
  @keyframes soundWave {
    0%, 100% { height: 4px; }
    50% { height: 16px; }
  }
  
  .talking-character {
    animation: talkBounce 0.8s ease-in-out infinite;
  }
  
  .mouth-animation {
    animation: mouthMove 0.6s ease-in-out infinite;
  }
  
  .sparkle-effect {
    animation: sparkleFloat 2s ease-in-out infinite;
  }
  
  .sound-wave {
    animation: soundWave 0.5s ease-in-out infinite;
  }
`;

const JamSessions: React.FC = () => {
  // Register Chart.js once
  useEffect(() => {
    try {
      ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, ChartTitle, Tooltip, Legend);
    } catch {}
  }, []);
  const [activeTab, setActiveTab] = useState('create');
  const [isRecording, setIsRecording] = useState(false);
  // const [currentWord] = useState('JAM Session');
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const [recordingWaveform, setRecordingWaveform] = useState<number[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Content creation state
  const [createdContent, setCreatedContent] = useState<any>(null);
  const [topicTitle, setTopicTitle] = useState<string>('');
  const [summary, setSummary] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [proficiencyLevel, setProficiencyLevel] = useState('');
  const [curriculum, setCurriculum] = useState('');
  const [recordedText, setRecordedText] = useState<string>(''); // used to compute insights
  const [speakingParas] = useState<string>('');

  // Recording Studio state
  const [selectedCharacter, setSelectedCharacter] = useState('superhero1');
  const [selectedTimer, setSelectedTimer] = useState('2');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [timerActive, setTimerActive] = useState(false);
  const [, setParticipants] = useState<number>(1);
  const [sharedNotes, setSharedNotes] = useState<string>('');
  const channelRef = useRef<any>(null);
  const [roomId] = useState<string>(() => new URLSearchParams(window.location.search).get('room') || 'default');
  const lastTimerRef = useRef<{ durationSeconds: number; startedAt: number } | null>(null);
  const timerActiveRef = useRef<boolean>(false);
  // Removed audio summary UI in Insights; keep placeholders unused
  // const [summaryAudioUrl, setSummaryAudioUrl] = useState<string | null>(null);
  // const [isSummarizing, setIsSummarizing] = useState(false);
  const [recordings, setRecordings] = useState<Array<{ id: string; url: string; title: string; createdAt: Date; transcript?: string; blob?: Blob }>>([]);
  const [recordingInsights, setRecordingInsights] = useState<Record<string, { words: number; durationSec: number; wpm: number; avgPitchHz: number; pitchLevel: 'Low'|'Medium'|'High'|'Unknown'; style: 'Informative'|'Persuasive'|'Narrative'|'Descriptive'|'Unknown'; pronunciation: 'Clear'|'Average'|'Needs practice'|'Unknown' }>>({});
  const [contentNotes, setContentNotes] = useState<string>('');
  const [isBionicMode, setIsBionicMode] = useState<boolean>(true);
  const [contentHistory, setContentHistory] = useState<Array<{ id: string; title: string; content: string; notes?: string; createdAt: Date }>>([]);
  
  const [isWebSearching, setIsWebSearching] = useState<boolean>(false);
  const [insightsModalOpen, setInsightsModalOpen] = useState<boolean>(false);
  const [insightsModalRecId, setInsightsModalRecId] = useState<string | null>(null);

  // Persist Create Content filters for a brief period, independent of Bionic Reading toggle
  const FILTERS_KEY = 'jam_filters_v1';
  const FILTERS_TTL_MS = 10 * 60 * 1000; // 10 minutes

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FILTERS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.savedAt) return;
      const isFresh = Date.now() - parsed.savedAt < FILTERS_TTL_MS;
      if (!isFresh) {
        localStorage.removeItem(FILTERS_KEY);
        return;
      }
      if (parsed.summary) setSummary(parsed.summary);
      if (parsed.ageGroup) setAgeGroup(parsed.ageGroup);
      if (parsed.proficiencyLevel) setProficiencyLevel(parsed.proficiencyLevel);
      if (parsed.curriculum) setCurriculum(parsed.curriculum);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const data = {
        summary,
        ageGroup,
        proficiencyLevel,
        curriculum,
        savedAt: Date.now()
      };
      localStorage.setItem(FILTERS_KEY, JSON.stringify(data));
    } catch {}
  }, [summary, ageGroup, proficiencyLevel, curriculum]);

  const handleClearFilters = () => {
    setSummary('');
    setAgeGroup('');
    setProficiencyLevel('');
    setCurriculum('');
    try { localStorage.removeItem(FILTERS_KEY); } catch {}
  };

  const addToContentHistory = (title: string, content: string, notes?: string) => {
    setContentHistory(prev => [
      { id: Date.now().toString(), title, content, notes, createdAt: new Date() },
      ...prev
    ]);
  };

  const handleSaveNotes = () => {
    const title = createdContent?.title || (summary ? `Notes: ${summary}` : 'My Notes');
    const content = createdContent?.content || '';
    addToContentHistory(title, content, contentNotes);
    alert('Saved to Recent Activity');
  };

  // When AI content becomes available, enable Bionic Reading by default
  useEffect(() => {
    if (createdContent && createdContent.content) {
      setIsBionicMode(true);
    }
  }, [createdContent]);

  // Helper to render text with Bionic Reading style (bold first 40% of each word)
  const renderBionicText = (text: string) => {
    const tokens = text.split(/(\s+)/);
    return (
      <>
        {tokens.map((token, idx) => {
          if (/^\s+$/.test(token)) return <span key={idx}>{token}</span>;
          const match = token.match(/^([A-Za-zÀ-ÖØ-öø-ÿ0-9]+)(.*)$/);
          if (!match) return <span key={idx}>{token}</span>;
          const word = match[1];
          const rest = match[2] || '';
          const boldLen = Math.max(1, Math.floor(word.length * 0.4));
          return (
            <span key={idx}>
              <span className="font-semibold">{word.slice(0, boldLen)}</span>
              {word.slice(boldLen)}
              {rest}
            </span>
          );
        })}
      </>
    );
  };

  // Build structured content based on filters with sections: Introduction, Beginner, Middle, Conclusion
  const buildStructuredContent = (
    topic: string,
    options: { ageGroup?: string; proficiencyLevel?: string; curriculum?: string; baseContent?: string }
  ): string => {
    const { baseContent } = options || {};

    const intro = `What is ${topic}? In this section, you’ll get a quick, clear picture of the idea, why it matters, and where you might see it in real life. Think of this as your friendly on‑ramp before we dive deeper.`;

    const beginner = `
• What it is: ${topic} explained with simple words and an everyday example.
• Try it: Do 1 tiny activity to notice ${topic} around you.
• Words to know: 3–5 helpful terms connected to ${topic}.`;

    const cleaned = (baseContent || '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^#+\s+/gm, '') // drop markdown headings
      .trim();
    const middle = cleaned && cleaned.length > 0
      ? cleaned
      : `Let’s explore ${topic} step by step with key points, a short story or use‑case, and one quick practice question.`;

    const conclusion = `
• Key takeaways: 2–3 points you should remember about ${topic}.
• Reflection: 1 quick question to check your understanding.
• Next step: A tiny challenge to apply ${topic} today.`;

    return [
      `Introduction\n\n${intro}`,
      `Beginner\n\n${beginner}`,
      `Middle\n\n${middle}`,
      `Conclusion\n\n${conclusion}`
    ].join('\n\n');
  };

  // Convert basic HTML to plain text when markdown scrape is missing/short
  const htmlToPlainText = (html: string) => {
    try {
      const div = document.createElement('div');
      div.innerHTML = html;
      const text = (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
      return text;
    } catch {
      return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
  };

  // Preset content feature removed

  const { user } = useAuth();
  // const navigate = useNavigate();

  // Character options with icons
  const characterOptions = [
    // Superhero Characters
    { id: 'superhero1', name: 'Captain Courage', icon: '🦸‍♀️', description: 'Brave superhero who protects the galaxy' },
    { id: 'superhero2', name: 'Lightning Bolt', icon: '⚡', description: 'Speedster who runs faster than light' },
    { id: 'superhero3', name: 'Aqua Girl', icon: '🧜‍♀️', description: 'Ocean guardian who talks to sea creatures' },
    { id: 'superhero4', name: 'Tech Whiz', icon: '🤖', description: 'Genius inventor with robot friends' },
    
    // Magical Characters
    { id: 'wizard', name: 'Merlin the Wise', icon: '🧙‍♂️', description: 'Ancient wizard who knows all spells' },
    { id: 'fairy', name: 'Sparkle the Fairy', icon: '🧚‍♀️', description: 'Magical fairy who grants wishes' },
    { id: 'dragon', name: 'Flame the Dragon', icon: '🐉', description: 'Friendly dragon who breathes rainbow fire' },
    { id: 'phoenix', name: 'Blaze the Phoenix', icon: '🦅', description: 'Mystical bird that rises from ashes' },
    
    // Space Explorers
    { id: 'astronaut', name: 'Star Explorer', icon: '👨‍🚀', description: 'Space adventurer who visits planets' },
    { id: 'alien', name: 'Ziggy the Alien', icon: '👽', description: 'Friendly alien from Planet Zog' },
    { id: 'robot', name: 'Beep the Robot', icon: '🤖', description: 'Smart robot who loves to learn' },
    { id: 'spaceship', name: 'Rocket Ship', icon: '🚀', description: 'Fastest spaceship in the universe' },
    
    // Animal Characters
    { id: 'lion', name: 'King Leo', icon: '🦁', description: 'Noble lion king of the jungle' },
    { id: 'elephant', name: 'Ellie the Wise', icon: '🐘', description: 'Gentle giant with amazing memory' },
    { id: 'dolphin', name: 'Splash the Dolphin', icon: '🐬', description: 'Playful dolphin who loves to swim' },
    { id: 'penguin', name: 'Waddle the Penguin', icon: '🐧', description: 'Adventurous penguin from Antarctica' },
    { id: 'giraffe', name: 'Tall Sally', icon: '🦒', description: 'Tallest giraffe who sees everything' },
    { id: 'koala', name: 'Cuddles the Koala', icon: '🐨', description: 'Sleepy koala who loves to hug' },
    { id: 'panda', name: 'Bamboo the Panda', icon: '🐼', description: 'Gentle panda who loves to eat bamboo' },
    { id: 'tiger', name: 'Stripe the Tiger', icon: '🐯', description: 'Brave tiger with orange stripes' },
    
    // Fantasy Characters
    { id: 'unicorn', name: 'Rainbow the Unicorn', icon: '🦄', description: 'Magical unicorn with rainbow mane' },
    { id: 'mermaid', name: 'Coral the Mermaid', icon: '🧜‍♀️', description: 'Beautiful mermaid who sings underwater' },
    { id: 'knight', name: 'Sir Braveheart', icon: '⚔️', description: 'Brave knight who protects the kingdom' },
    { id: 'ninja', name: 'Shadow the Ninja', icon: '🥷', description: 'Silent ninja who moves like wind' },
    
    // Fun Characters
    { id: 'clown', name: 'Giggles the Clown', icon: '🤡', description: 'Funny clown who makes everyone laugh' },
    { id: 'pirate', name: 'Captain Hook', icon: '🏴‍☠️', description: 'Adventurous pirate who hunts for treasure' },
    { id: 'cowboy', name: 'Wild West Will', icon: '🤠', description: 'Cowboy who rides horses in the desert' },
    { id: 'detective', name: 'Sherlock Junior', icon: '🔍', description: 'Smart detective who solves mysteries' },
    
    // Nature Characters
    { id: 'tree', name: 'Oak the Tree', icon: '🌳', description: 'Wise old tree who tells stories' },
    { id: 'flower', name: 'Blossom the Flower', icon: '🌸', description: 'Beautiful flower that blooms in spring' },
    { id: 'butterfly', name: 'Flutter the Butterfly', icon: '🦋', description: 'Colorful butterfly who loves to dance' },
    { id: 'bee', name: 'Buzz the Bee', icon: '🐝', description: 'Busy bee who makes honey' },
    
    // Food Characters
    { id: 'pizza', name: 'Pepperoni Pete', icon: '🍕', description: 'Delicious pizza who loves to share' },
    { id: 'icecream', name: 'Scoops the Ice Cream', icon: '🍦', description: 'Sweet ice cream who never melts' },
    { id: 'cookie', name: 'Chip the Cookie', icon: '🍪', description: 'Chocolate chip cookie who is always fresh' },
    { id: 'apple', name: 'Red Apple Annie', icon: '🍎', description: 'Healthy apple who keeps doctors away' },
    
    // 3D Animated Characters for Kids
    { id: 'minion', name: 'Bello the Minion', icon: '💛', description: 'Silly minion who loves bananas and fun' },
    { id: 'pikachu', name: 'Sparky the Pikachu', icon: '⚡', description: 'Electric Pokémon who loves adventures' },
    { id: 'mickey', name: 'Magic Mickey', icon: '🐭', description: 'Magical mouse who makes dreams come true' },
    { id: 'elsa', name: 'Princess Elsa', icon: '❄️', description: 'Ice princess with magical powers' },
    { id: 'spiderman', name: 'Webby Spider-Man', icon: '🕷️', description: 'Friendly neighborhood superhero' },
    { id: 'buzz', name: 'Space Ranger Buzz', icon: '🚀', description: 'Space ranger who protects the galaxy' },
    { id: 'woody', name: 'Sheriff Woody', icon: '🤠', description: 'Brave cowboy who leads the toys' },
    { id: 'nemo', name: 'Swimmy Nemo', icon: '🐠', description: 'Adventurous clownfish who explores the ocean' },
    { id: 'dory', name: 'Forgetful Dory', icon: '🐟', description: 'Friendly fish who helps friends' },
    { id: 'simba', name: 'King Simba', icon: '🦁', description: 'Lion king who rules the pride lands' },
    { id: 'ariel', name: 'Mermaid Ariel', icon: '🧜‍♀️', description: 'Curious mermaid who loves to sing' },
    { id: 'aladdin', name: 'Street Rat Aladdin', icon: '🕌', description: 'Clever boy who finds magic lamps' },
    { id: 'jasmine', name: 'Princess Jasmine', icon: '👑', description: 'Brave princess who seeks adventure' },
    { id: 'genie', name: 'Wishful Genie', icon: '🧞‍♂️', description: 'Magical genie who grants wishes' },
    { id: 'belle', name: 'Bookworm Belle', icon: '📚', description: 'Smart princess who loves to read' },
    { id: 'beast', name: 'Gentle Beast', icon: '🐻', description: 'Kind beast who learns to love' },
    { id: 'cinderella', name: 'Dreamy Cinderella', icon: '👗', description: 'Kind girl who never gives up' },
    { id: 'snowwhite', name: 'Sweet Snow White', icon: '🍎', description: 'Gentle princess who befriends animals' },
    { id: 'rapunzel', name: 'Long Hair Rapunzel', icon: '👸', description: 'Adventurous princess with magic hair' },
    { id: 'moana', name: 'Ocean Moana', icon: '🌊', description: 'Brave girl who saves her island' },
    { id: 'maui', name: 'Strong Maui', icon: '🏝️', description: 'Mighty demigod who shapes the world' },
    { id: 'anna', name: 'Sister Anna', icon: '❄️', description: 'Loving sister who never gives up' },
    { id: 'olaf', name: 'Warm Olaf', icon: '☃️', description: 'Friendly snowman who loves summer' },
    { id: 'sven', name: 'Loyal Sven', icon: '🦌', description: 'Faithful reindeer who helps friends' },
    { id: 'kristoff', name: 'Ice Man Kristoff', icon: '⛏️', description: 'Kind ice harvester who loves his reindeer' }
  ];

  // Timer options
  const timerOptions = [
    { value: '1', label: '1 minute' },
    { value: '2', label: '2 minutes' },
    { value: '3', label: '3 minutes' },
    { value: '5', label: '5 minutes' },
    { value: '7', label: '7 minutes' },
    { value: '10', label: '10 minutes' },
    { value: '20', label: '20 minutes' }
  ];

  // Cleanup effect
  useEffect(() => {
    // Setup Supabase Realtime channel for this JAM room
    const presenceKey = (user?.id as string) || Math.random().toString(36).slice(2);
    const channel = supabase.channel(`jam_session:${roomId}`, {
      config: { presence: { key: presenceKey } }
    });

    // Presence: track participant count
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      let count = 0;
      Object.values(state).forEach((arr: any) => { count += Array.isArray(arr) ? arr.length : 0; });
      setParticipants(Math.max(1, count));
    });

    // Receive timer start from others
    channel.on('broadcast', { event: 'timer_start' }, ({ payload }) => {
      try {
        const { durationSeconds, startedAt } = payload || {};
        if (!durationSeconds || !startedAt) return;
        lastTimerRef.current = { durationSeconds, startedAt };
        const now = Math.floor(Date.now() / 1000);
        const elapsed = now - Math.floor(startedAt / 1000);
        const remaining = Math.max(0, durationSeconds - Math.max(0, elapsed));
        if (remaining > 0) {
          setSelectedTimer(String(Math.ceil(durationSeconds / 60)));
          startCountdown(remaining);
        }
      } catch {}
    });

    // Receive timer stop
    channel.on('broadcast', { event: 'timer_stop' }, () => {
      setTimerActive(false);
      setTimeRemaining(0);
      lastTimerRef.current = null;
    });

    // Receive shared notes updates
    channel.on('broadcast', { event: 'notes_update' }, ({ payload }) => {
      if (typeof payload?.text === 'string') setSharedNotes(payload.text);
    });

    // Late joiners request current state
    channel.on('broadcast', { event: 'state_request' }, () => {
      const state = lastTimerRef.current;
      if (state && timerActiveRef.current) {
        channel.send({ type: 'broadcast', event: 'timer_start', payload: state });
      }
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.track({ online_at: Date.now() });
        // Ask others for current state if any
        channel.send({ type: 'broadcast', event: 'state_request', payload: {} });
      }
    });

    channelRef.current = channel;

    return () => {
      try { if (channel) supabase.removeChannel(channel); } catch {}
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const avatarUrl = user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name || user?.email || '';
  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const startWaveformAnalysis = (stream: MediaStream) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const source = audioContextRef.current.createMediaStreamSource(stream);
    const analyser = audioContextRef.current.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateWaveform = () => {
      if (!isRecording) return;
      
      analyser.getByteFrequencyData(dataArray);
      const waveformData = Array.from(dataArray).slice(0, 32);
      setRecordingWaveform(waveformData);
      
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    };
    
    updateWaveform();
  };

  // Helper: start a local countdown without starting recording
  const startCountdown = (seconds: number) => {
    setTimeRemaining(seconds);
    setTimerActive(true);
    const intervalId = window.setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    timerActiveRef.current = timerActive;
  }, [timerActive]);

  const stopWaveformAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setRecordingWaveform([]);
  };

  // Estimate average pitch (very rough) using time-domain autocorrelation on decoded audio buffer
  const estimateAveragePitchHz = async (input: string | Blob): Promise<{ avgHz: number; durationSec: number }> => {
    try {
      let arrayBuffer: ArrayBuffer;
      if (typeof input === 'string') {
        const res = await fetch(input);
        arrayBuffer = await res.arrayBuffer();
      } else {
        arrayBuffer = await input.arrayBuffer();
      }
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      let buffer: AudioBuffer | null = null;
      try {
        buffer = await ctx.decodeAudioData(arrayBuffer);
      } catch {
        buffer = null;
      }
      let avgHz = 0;
      let durationSec = 0;
      if (buffer) {
        const channel = buffer.getChannelData(0);
        const sampleRate = buffer.sampleRate;
        const frameSize = 2048;
        const hop = 1024;
        const minLag = Math.floor(sampleRate / 400); // 400 Hz
        const maxLag = Math.floor(sampleRate / 50);  // 50 Hz
        const freqs: number[] = [];
        for (let start = 0; start + frameSize < channel.length; start += hop) {
          let bestLag = 0;
          let bestCorr = 0;
          for (let lag = minLag; lag <= maxLag; lag++) {
            let corr = 0;
            for (let i = 0; i < frameSize - lag; i++) {
              corr += channel[start + i] * channel[start + i + lag];
            }
            if (corr > bestCorr) { bestCorr = corr; bestLag = lag; }
          }
          if (bestLag > 0 && bestCorr > 0.01) {
            freqs.push(sampleRate / bestLag);
          }
        }
        avgHz = freqs.length ? freqs.reduce((a, b) => a + b, 0) / freqs.length : 0;
        durationSec = buffer.duration;
      }
      try { ctx.close(); } catch {}
      // Fallback duration via HTMLAudioElement if decode failed
      if (!durationSec || !isFinite(durationSec)) {
        try {
          const a = document.createElement('audio');
          if (typeof input === 'string') a.src = input; else a.src = URL.createObjectURL(new Blob([arrayBuffer], { type: 'audio/webm' }));
          await new Promise<void>((resolve) => {
            a.onloadedmetadata = () => resolve();
            a.onerror = () => resolve();
          });
          if (a.duration && isFinite(a.duration)) durationSec = a.duration;
        } catch {}
      }
      return { avgHz, durationSec };
    } catch {
      return { avgHz: 0, durationSec: 0 };
    }
  };

  const classifyPitchLevel = (hz: number): 'Low'|'Medium'|'High'|'Unknown' => {
    if (!hz || !isFinite(hz)) return 'Unknown';
    if (hz < 140) return 'Low';
    if (hz < 220) return 'Medium';
    return 'High';
  };

  const classifyCommunicationStyle = (text?: string): 'Informative'|'Persuasive'|'Narrative'|'Descriptive'|'Unknown' => {
    if (!text) return 'Unknown';
    const t = text.toLowerCase();
    if (/i (believe|think|should|must)|convinc|argu|therefore|hence/.test(t)) return 'Persuasive';
    if (/(once|story|then|after|before|suddenly|finally)/.test(t)) return 'Narrative';
    if (/(imagine|looks like|sounds like|feels like|color|shape|texture)/.test(t)) return 'Descriptive';
    return 'Informative';
  };

  const estimatePronunciation = (text?: string): 'Clear'|'Average'|'Needs practice'|'Unknown' => {
    if (!text) return 'Unknown';
    const words = text.trim().split(/\s+/);
    const filler = (text.match(/\b(um|uh|like|you know|er)\b/gi) || []).length;
    const longWords = words.filter(w => w.length >= 8).length;
    const ratio = filler / Math.max(1, words.length);
    if (ratio < 0.01 && longWords / Math.max(1, words.length) > 0.08) return 'Clear';
    if (ratio < 0.03) return 'Average';
    return 'Needs practice';
  };

  const computeInsightsForRecording = async (rec: { id: string; url: string; transcript?: string; blob?: Blob }) => {
    const { avgHz, durationSec } = await estimateAveragePitchHz(rec.blob || rec.url);
    const words = (rec.transcript || '').trim().split(/\s+/).filter(Boolean).length;
    let minutes = durationSec > 0 ? durationSec / 60 : 0;
    if (!minutes || !isFinite(minutes)) minutes = 1 / 60; // prevent zero; assume 1s minimal
    const wpm = Math.round(words / minutes);
    const style = classifyCommunicationStyle(rec.transcript);
    const pronunciation = estimatePronunciation(rec.transcript);
    setRecordingInsights(prev => ({
      ...prev,
      [rec.id]: {
        words,
        durationSec: Math.round(durationSec),
        wpm,
        avgPitchHz: Math.round(avgHz),
        pitchLevel: classifyPitchLevel(avgHz),
        style,
        pronunciation,
      }
    }));
  };

  const buildFeedbackFromMetrics = (m?: { words: number; wpm: number; pitchLevel: 'Low'|'Medium'|'High'|'Unknown'; style: string; pronunciation: string }) => {
    if (!m) return 'No feedback available yet. Record something to see detailed feedback.';
    const tips: string[] = [];
    if (m.wpm > 170) tips.push('Slow down a little for clarity (aim 120–160 wpm).');
    if (m.wpm < 110) tips.push('Increase pace slightly to keep energy (aim 120–160 wpm).');
    if (m.pitchLevel === 'Low') tips.push('Vary pitch upwards to add enthusiasm.');
    if (m.pitchLevel === 'High') tips.push('Calm the pitch a bit for confidence.');
    if (m.pronunciation === 'Needs practice') tips.push('Open vowels and articulate endings; practice tricky words slowly.');
    if (tips.length === 0) tips.push('Great balance of pace and tone. Keep it up!');
    return `Style: ${m.style}. Pronunciation: ${m.pronunciation}. ${tips.join(' ')}`;
  };

  const buildAggregateFeedback = () => {
    const vals = recordings.map(r => recordingInsights[r.id]).filter(Boolean) as any[];
    if (!vals.length) return 'No recordings yet. Record a clip to see your feedback report.';
    const avgWpm = Math.round(vals.reduce((a, v) => a + (v.wpm || 0), 0) / vals.length);
    const avgPitch = Math.round(vals.reduce((a, v) => a + (v.avgPitchHz || 0), 0) / vals.length);
    const styleCounts: Record<string, number> = {};
    vals.forEach(v => { styleCounts[v.style] = (styleCounts[v.style] || 0) + 1; });
    const topStyle = Object.entries(styleCounts).sort((a,b) => b[1]-a[1])[0]?.[0] || 'Unknown';
    const pronCounts: Record<string, number> = {};
    vals.forEach(v => { pronCounts[v.pronunciation] = (pronCounts[v.pronunciation] || 0) + 1; });
    const mostPron = Object.entries(pronCounts).sort((a,b) => b[1]-a[1])[0]?.[0] || 'Unknown';
    const tips: string[] = [];
    if (avgWpm > 170) tips.push('Reduce pace slightly (target 120–160 wpm).');
    if (avgWpm < 110) tips.push('Increase pace for energy (target 120–160 wpm).');
    if (avgPitch < 140) tips.push('Lift pitch occasionally to sound more engaging.');
    if (avgPitch > 220) tips.push('Lower pitch slightly to convey confidence.');
    if (mostPron === 'Needs practice') tips.push('Practice articulation with tongue twisters and slow repetition.');
    if (tips.length === 0) tips.push('Great overall balance. Keep practicing consistently!');
    return `Average WPM: ${avgWpm}. Average Pitch: ${avgPitch} Hz. Predominant style: ${topStyle}. Pronunciation trend: ${mostPron}. ${tips.join(' ')}`;
  };

  const handleStartRecording = async () => {
    setAudioURL(null);
    setRecordedText('');
    audioChunks.current = [];
    setRecordingWaveform([]);
    
    // Start timer
    const selectedTimeInMinutes = parseInt(selectedTimer);
    const selectedTimeInSeconds = selectedTimeInMinutes * 60;
    setTimeRemaining(selectedTimeInSeconds);
    setTimerActive(true);
    
    // Broadcast timer start to the room and start local countdown
    const startedAt = Date.now();
    lastTimerRef.current = { durationSeconds: selectedTimeInSeconds, startedAt };
    channelRef.current?.send({ type: 'broadcast', event: 'timer_start', payload: { durationSeconds: selectedTimeInSeconds, startedAt } });
    // Timer countdown
    const timerInterval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          setTimerActive(false);
          // Auto-stop recording when timer reaches zero
          if (mediaRecorderRef.current && isRecording) {
            handleStopRecording();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
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
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        stream.getTracks().forEach(track => track.stop());
        stopWaveformAnalysis();
        setTimerActive(false);
        clearInterval(timerInterval);
        // save into recent recordings list
        const id = Date.now().toString();
        const rec = { id, url, title: topicTitle || 'JAM Session', createdAt: new Date(), transcript: '', blob };
        setRecordings(prev => [ rec, ...prev ]);
        
        // Transcribe using Whisper (via OpenAI API or configured proxy)
        setTimeout(async () => {
          try {
            const text = await transcribeAudioWhisper(blob);
            const transcript = text || '';
            setRecordedText(transcript);
            setRecordings(prev => prev.map(r => r.id === id ? { ...r, transcript } : r));
            computeInsightsForRecording({ id, url, transcript, blob });
          } catch {
            // Fallback to minimal placeholder if transcription fails
            const transcript = 'Recording captured. Enable VITE_OPENAI_API_KEY to transcribe with Whisper.';
            setRecordedText(transcript);
            setRecordings(prev => prev.map(r => r.id === id ? { ...r, transcript } : r));
            computeInsightsForRecording({ id, url, transcript, blob });
          }
        }, 300);
      };
      mediaRecorder.start();
      setIsRecording(true);
      startWaveformAnalysis(stream);
    } catch (err) {
      alert('Microphone access denied or not available.');
      setTimerActive(false);
      clearInterval(timerInterval);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopWaveformAnalysis();
    }
    // Broadcast timer stop to the room
    channelRef.current?.send({ type: 'broadcast', event: 'timer_stop', payload: {} });
  };

  // Helpers for sharing and downloading recordings
  const buildShareMessage = (rec: { title: string; createdAt: Date }) => {
    const dateStr = rec.createdAt.toLocaleString();
    return `Sharing my JAM session recording: "${rec.title}" (recorded on ${dateStr}).`;
  };

  const sanitizeFileName = (name: string) => name.replace(/[^a-z0-9\-_. ]/gi, '').replace(/\s+/g, '-');

  const handleDownloadRecording = (rec: { url: string; title: string; id: string }) => {
    try {
      const a = document.createElement('a');
      a.href = rec.url;
      a.download = `${sanitizeFileName(rec.title)}-${rec.id}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {}
  };

  const handleNativeShare = async (rec: { url: string; title: string; createdAt: Date }) => {
    try {
      // @ts-ignore - navigator.share files may not be in TS lib
      if (navigator && navigator.share) {
        const blob = await fetch(rec.url).then(r => r.blob());
        const file = new File([blob], `${sanitizeFileName(rec.title)}.webm`, { type: 'audio/webm' });
        // @ts-ignore
        await navigator.share({
          title: rec.title,
          text: buildShareMessage(rec),
          files: [file]
        });
      } else {
        alert('Native sharing is not supported on this device. Use WhatsApp or Email buttons.');
      }
    } catch {}
  };

  const handleClearRecording = () => {
    setAudioURL(null);
    setIsRecording(false);
    setRecordingWaveform([]);
    setRecordedText('');
    stopWaveformAnalysis();
  };

  // Removed Create Content flow as per request; we now focus only on Search the Web

  

  const handleSearchWeb = async () => {
    const query = (topicTitle || summary || '').trim();
    if (!query) {
      return;
    }
    // Keep UI title in sync with the search query
    setTopicTitle(query);
    const hasFirecrawl = Boolean((import.meta as any).env.VITE_FIRECRAWL_API_KEY);
    const hasSerp = Boolean((import.meta as any).env.VITE_SERPAPI_KEY);
    if (!hasFirecrawl && !hasSerp) {
      // No web search providers configured; gracefully fall back to Wikipedia
      try {
        const article = await wikiBestArticle(query);
        if (article) {
          const markdown = `# ${article.title}\n\n${article.extract}\n\nSource: ${article.url}`;
          const structuredWiki = buildStructuredContent(article.title, { ageGroup, proficiencyLevel, curriculum, baseContent: markdown });
        setCreatedContent({
            content: structuredWiki,
            title: article.title,
          createdAt: new Date().toLocaleString(),
            status: 'Wikipedia',
          isLoading: false
        });
          setTopicTitle(article.title);
          setContentHistory(prev => [{ id: `${Date.now()}-wiki-nokeys`, title: article.title, content: structuredWiki, createdAt: new Date() }, ...prev]);
      } else {
          // No keys and no Wikipedia result; do nothing visible
        }
      } catch {
        // Silent failure in no-key path
      }
      return;
    }
    setIsWebSearching(true);
    try {
      let scraped: Array<{ title: string; markdown: string }> = [];

      // First try Firecrawl search + scrape
      try {
        const hits = await firecrawlSearch({ q: query, limit: 3 });
        for (const h of hits) {
          if (!h.url) continue;
          const page = await firecrawlScrape({ url: h.url, formats: ['markdown', 'html'] });
          const mk = page?.markdown && page.markdown.trim().length > 120 ? page.markdown : '';
          const fallback = !mk && page?.html ? htmlToPlainText(page.html) : '';
          const body = mk || fallback;
          if (body) {
            scraped.push({ title: h.title || h.url, markdown: body });
          }
        }
      } catch (e) {
        console.warn('Firecrawl search failed', e);
      }

      // Fallback to SerpAPI if nothing was scraped
      let serpLinks: Array<{ title: string; link: string }> = [];
      if (scraped.length === 0) {
        try {
          const serp = await serpSearch({ q: query, num: 3, hl: 'en', gl: 'us' });
          serpLinks = serp.map(r => ({ title: r.title, link: r.link })).filter(r => !!r.link);
          for (const r of serp) {
            if (!r.link) continue;
            const page = await firecrawlScrape({ url: r.link, formats: ['markdown', 'html'] });
            const mk = page?.markdown && page.markdown.trim().length > 120 ? page.markdown : '';
            const fallback = !mk && page?.html ? htmlToPlainText(page.html) : '';
            const body = mk || fallback;
            if (body) {
              scraped.push({ title: r.title || r.link, markdown: body });
            }
          }
        } catch (e) {
          console.warn('SerpAPI fallback failed', e);
        }
      }

      if (scraped.length > 0) {
        // Show first scraped page in Content Notes
        let structuredFirst = buildStructuredContent(scraped[0].title, { ageGroup, proficiencyLevel, curriculum, baseContent: scraped[0].markdown });
        // Enhance with creative rewrite if OpenAI key available
        try {
          const ai = await generateStructuredNotes(scraped[0].title, scraped[0].markdown, ageGroup, proficiencyLevel, curriculum);
          if (ai) structuredFirst = ai;
        } catch {}
        setCreatedContent({
          content: structuredFirst,
          title: scraped[0].title,
          createdAt: new Date().toLocaleString(),
          status: 'Web',
          isLoading: false
        });
        setTopicTitle(scraped[0].title);
        // Add all scraped pages to Recent Activity
        const enriched = [] as Array<{ id: string; title: string; content: string; createdAt: Date }>;
        for (const s of scraped) {
          let c = buildStructuredContent(s.title, { ageGroup, proficiencyLevel, curriculum, baseContent: s.markdown });
          try {
            const ai = await generateStructuredNotes(s.title, s.markdown, ageGroup, proficiencyLevel, curriculum);
            if (ai) c = ai;
          } catch {}
          enriched.push({ id: `${Date.now()}-${Math.random()}`, title: s.title, content: c, createdAt: new Date() });
        }
        setContentHistory(prev => [ ...enriched, ...prev ]);
      } else {
        // If we couldn't scrape, still add the links to Recent Activity as plain text
        if (serpLinks.length > 0) {
          const asText = serpLinks.map(l => `- ${l.title || l.link}: ${l.link}`).join('\n');
          let structuredLinks = buildStructuredContent(query, { ageGroup, proficiencyLevel, curriculum, baseContent: `Web links for ${query}:\n\n${asText}` });
          try {
            const ai = await generateStructuredNotes(query, asText, ageGroup, proficiencyLevel, curriculum);
            if (ai) structuredLinks = ai;
          } catch {}
          setCreatedContent({
            content: structuredLinks,
            title: `Web results for "${query}"` ,
            createdAt: new Date().toLocaleString(),
            status: 'Web Links',
            isLoading: false
          });
          setTopicTitle(`Web results for "${query}"`);
          setContentHistory(prev => [{ id: `${Date.now()}-links`, title: `Web results for "${query}"`, content: structuredLinks, createdAt: new Date() }, ...prev]);
        } else {
          // Final fallback: Wikipedia summary (no API key needed)
          try {
            const article = await wikiBestArticle(query);
            if (article) {
              const markdown = `# ${article.title}\n\n${article.extract}\n\nSource: ${article.url}`;
              const structuredWiki = buildStructuredContent(article.title, { ageGroup, proficiencyLevel, curriculum, baseContent: markdown });
              setCreatedContent({
                content: structuredWiki,
                title: article.title,
                createdAt: new Date().toLocaleString(),
                status: 'Wikipedia',
                isLoading: false
              });
              setTopicTitle(article.title);
              setContentHistory(prev => [{ id: `${Date.now()}-wiki-fallback`, title: article.title, content: structuredWiki, createdAt: new Date() }, ...prev]);
            }
          } catch {}
        }
      }
    } catch (e) {
      console.warn('Web search failed', e);
    } finally {
      setIsWebSearching(false);
    }
  };

  // Removed Add from Wikipedia/Britannica flows as per request

  const renderCreateContentTab = () => (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-white/50 p-8">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Create Content</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Content Notes - dedicated notes box (left column) */}
          <div className="bg-white/10 rounded-lg p-6 border border-white/20 order-2 lg:order-2 lg:col-span-1 lg:h-[36rem] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-white">Content Notes</h3>
              <div className={`flex items-center gap-2 ${createdContent ? '' : ''}`}>
                <span className="text-sm text-gray-300">Bionic Reading</span>
                <button
                  onClick={() => setIsBionicMode((v) => !v)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${isBionicMode ? 'bg-indigo-600' : 'bg-gray-600'}`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isBionicMode ? 'translate-x-6' : ''}`}></span>
                </button>
              </div>
            </div>

            {/* If Bionic mode is ON and content exists, show AI content; otherwise show notes textarea or loading */}
            {isBionicMode && createdContent && typeof createdContent.content === 'string' && createdContent.content.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-lg p-4 border border-purple-500/30">
                  <h4 className="font-semibold text-white mb-3">{createdContent.title || 'Generated Content'}</h4>
                  <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">
                    {renderBionicText(createdContent.content)}
                  </div>
                </div>
                {speakingParas && (
                  <div className="bg-gradient-to-br from-indigo-900/40 to-violet-900/40 rounded-lg p-4 border border-indigo-500/30">
                    <h4 className="font-semibold text-white mb-2">Speaking Practice Paragraphs</h4>
                    <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">
                      {renderBionicText(speakingParas)}
                    </div>
                  </div>
                )}
              </div>
            ) : createdContent?.isLoading && isBionicMode ? (
              <div className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 rounded-lg p-4 border border-yellow-500/30">
                <h4 className="font-semibold text-white mb-2">Generating content…</h4>
                <div className="text-gray-200 text-sm">Please wait while we prepare your content.</div>
              </div>
            ) : (
              <div>
                <p className="text-gray-300 text-sm mb-3">Jot down your own notes about the selected content.</p>
                <textarea
                  value={contentNotes}
                  onChange={(e) => setContentNotes(e.target.value)}
                  placeholder="Write your notes here..."
                  className="w-full h-64 bg-black/30 border border-white/20 rounded p-3 text-white placeholder-gray-400"
                />
                <div className="mt-3 text-right">
                  <button onClick={handleSaveNotes} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">Save Notes</button>
                </div>
              </div>
            )}
          </div>

          {/* Content Creation Form (right column) */}
          <div className="bg-white/10 rounded-lg p-6 border border-white/20 order-1 lg:order-1 lg:col-span-2 lg:h-[36rem] overflow-hidden">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mr-3">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Content Creation</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-semibold mb-2">Summary</label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Enter your JAM session topic..."
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
                />
              </div>
              
              <div>
                <label className="block text-white text-sm font-semibold mb-2">Age Group</label>
                <select 
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="" className="bg-gray-800 text-white">Select age group...</option>
                  <option value="primary" className="bg-gray-800 text-white">Primary (6–10 years)</option>
                  <option value="secondary" className="bg-gray-800 text-white">Secondary (11–14 years)</option>
                  <option value="higher-secondary" className="bg-gray-800 text-white">Higher secondary / Adult learners</option>
                </select>
              </div>
              
              <div>
                <label className="block text-white text-sm font-semibold mb-2">Language Proficiency Level</label>
                <select 
                  value={proficiencyLevel}
                  onChange={(e) => setProficiencyLevel(e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="" className="bg-gray-800 text-white">Select proficiency level...</option>
                  <option value="beginner" className="bg-gray-800 text-white">Beginner</option>
                  <option value="intermediate" className="bg-gray-800 text-white">Intermediate</option>
                  <option value="advanced" className="bg-gray-800 text-white">Advanced</option>
                </select>
              </div>
              
              <div>
                <label className="block text-white text-sm font-semibold mb-2">Curriculum</label>
                <select 
                  value={curriculum}
                  onChange={(e) => setCurriculum(e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="" className="bg-gray-800 text-white">Select curriculum...</option>
                  <option value="ib-pyp" className="bg-gray-800 text-white">IB PYP</option>
                  <option value="ib-myp" className="bg-gray-800 text-white">IB MYP</option>
                  <option value="ib-dp" className="bg-gray-800 text-white">IB DP</option>
                  <option value="cbse" className="bg-gray-800 text-white">CBSE</option>
                  <option value="cambridge" className="bg-gray-800 text-white">Cambridge</option>
                </select>
              </div>
            
              <button
                onClick={handleSearchWeb}
                disabled={isWebSearching}
                className="w-full mt-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-60"
              >
                {isWebSearching ? 'Searching the Web…' : 'Search the Web'}
              </button>
              
              <button
                onClick={handleClearFilters}
                className="w-full mt-2 px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                Clear
              </button>
      </div>

            {/* Generated content moved into the Content Notes box */}
                </div>
            </div>
          </div>

      {/* Recent Activity - list of generated/searched content with share/download options */}
      {contentHistory.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-white/50 p-8">
          <h2 className="text-3xl font-bold text-white mb-6">Recent Activity</h2>
          <ul className="divide-y divide-white/20">
            {contentHistory.map(item => {
              const combined = `${item.title}\n\n${item.content}\n\nMy Notes:\n${contentNotes || ''}`;
              const message = `JAM Content: "${item.title}"\n\n${combined}`;
              const waHref = `https://wa.me/?text=${encodeURIComponent(message)}`;
              const mailHref = `mailto:?subject=${encodeURIComponent('JAM Content: ' + item.title)}&body=${encodeURIComponent(message)}`;
              const blob = new Blob([combined], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              return (
                <li key={item.id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold truncate" title={item.title}>{item.title}</div>
                    <div className="text-gray-300 text-xs">{item.createdAt.toLocaleString()}</div>
              </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <a href={url} download={`${item.title.replace(/[^a-z0-9\-_. ]/gi, '').replace(/\s+/g, '-')}.txt`} className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium">Download</a>
                    <a href={waHref} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">WhatsApp</a>
                    <a href={mailHref} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">Email</a>
              </div>
                </li>
              );
            })}
          </ul>
            </div>
      )}
    </div>
  );

  const renderRecordingStudioTab = () => (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-white/50 p-8">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Recording Studio</h2>
        
        <div className="space-y-8">
          {/* Unified Recording Interface */}
          <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg p-8 border border-purple-500/30 relative">
            {/* Character and Timer Selection */}
            {/* Topic Title row */}
            <div className="w-full mb-4 text-center">
              <div className="inline-block px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xl font-semibold">
                {topicTitle || 'Healthy Food'}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Character Selection Dropdown */}
              <div>
                <label className="block text-white text-sm font-semibold mb-3">Choose Your Character</label>
                <select 
                  value={selectedCharacter}
                  onChange={(e) => setSelectedCharacter(e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  {characterOptions.map((character) => (
                    <option key={character.id} value={character.id} className="bg-gray-800 text-white text-lg py-2">
                      <span className="text-2xl mr-3">{character.icon}</span> {character.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Timer Selection Dropdown */}
              <div>
                <label className="block text-white text-sm font-semibold mb-3">Session Duration</label>
                <select 
                  value={selectedTimer}
                  onChange={(e) => setSelectedTimer(e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-green-400"
                >
                  {timerOptions.map((timer) => (
                    <option key={timer.value} value={timer.value} className="bg-gray-800 text-white">
                      {timer.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Character Display */}
            <div className="mb-8 flex items-center justify-center relative">
              <div className={`relative transition-all duration-300 ${
                isRecording ? 'scale-110' : 'scale-100'
              }`}>
                {/* Character Icon with Enhanced Talking Animation */}
                <div className="relative">
                  <span className={`text-9xl transition-all duration-300 ${
                    isRecording ? 'animate-bounce talking-character' : ''
                  }`}>
                    {characterOptions.find(c => c.id === selectedCharacter)?.icon}
                  </span>
                  
                  {/* Enhanced Talking Animation - Mouth Movement Effect */}
                  {isRecording && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/20 rounded-full animate-ping opacity-75 mouth-animation"></div>
                    </div>
                  )}
                </div>
                
                {/* Character-specific talking effects */}
                {isRecording && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Sparkle effects for magical characters */}
                    {['wizard', 'fairy', 'unicorn', 'phoenix', 'genie', 'elsa', 'ariel', 'rapunzel'].includes(selectedCharacter) && (
                      <div className="absolute -top-4 -right-4">
                        <div className="text-yellow-300 text-lg sparkle-effect">✨</div>
                      </div>
                    )}
                    
                    {/* Lightning effects for superhero characters */}
                    {['superhero1', 'superhero2', 'superhero3', 'superhero4', 'spiderman', 'pikachu'].includes(selectedCharacter) && (
                      <div className="absolute -top-2 -left-2">
                        <div className="text-yellow-400 text-sm animate-pulse">⚡</div>
                      </div>
                    )}
                    
                    {/* Water effects for ocean characters */}
                    {['dolphin', 'mermaid', 'nemo', 'dory', 'aqua'].includes(selectedCharacter) && (
                      <div className="absolute -bottom-2 -left-2">
                        <div className="text-blue-400 text-sm animate-bounce" style={{ animationDuration: '1s' }}>💧</div>
                      </div>
                    )}
                    
                    {/* Fire effects for dragon and phoenix */}
                    {['dragon', 'phoenix'].includes(selectedCharacter) && (
                      <div className="absolute -top-2 -right-2">
                        <div className="text-orange-500 text-sm animate-pulse">🔥</div>
                      </div>
                    )}
                    
                    {/* Robot effects for robot characters */}
                    {['robot', 'buzz', 'tech'].includes(selectedCharacter) && (
                      <div className="absolute -top-3 -left-3">
                        <div className="text-cyan-400 text-sm animate-pulse">⚙️</div>
                      </div>
                    )}
                    
                    {/* Space effects for space characters */}
                    {['astronaut', 'alien', 'spaceship'].includes(selectedCharacter) && (
                      <div className="absolute -top-2 -right-2">
                        <div className="text-purple-400 text-sm animate-pulse">🚀</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Timer Display - Top right of robot with participants */}
              {timerActive && (
                <div className="absolute -top-4 -right-4 text-2xl font-bold text-red-400 bg-black/50 rounded-full px-3 py-1">
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </div>
              )}
              {/* Removed participants count */}
            </div>

            {/* Animated Waveform */}
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="flex items-end space-x-1 h-16">
                {isRecording ? (
                  // Animated waveform during recording
                  Array.from({ length: 20 }, (_, i) => (
                    <div
                      key={i}
                      className="bg-gradient-to-t from-cyan-400 to-pink-400 rounded-sm animate-pulse"
                      style={{
                        width: '4px',
                        height: `${Math.random() * 60 + 10}px`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))
                ) : recordingWaveform.length > 0 ? (
                  // Static waveform from recorded audio
                  recordingWaveform.map((value, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-t from-cyan-400 to-pink-400 rounded-sm"
                      style={{
                        width: '4px',
                        height: `${(value / 255) * 60}px`,
                        minHeight: '4px'
                      }}
                    />
                  ))
                ) : (
                  // Placeholder waveform
                  Array.from({ length: 20 }, (_, i) => (
                    <div
                      key={i}
                      className="bg-gray-400 rounded-sm"
                      style={{
                        width: '4px',
                        height: '8px'
                      }}
                    />
                  ))
                )}
              </div>
            </div>
            
            {/* Recording Controls - Centered */}
            <div className="flex flex-col items-center space-y-4">
              {/* Record Button - Centered */}
              <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                  isRecording 
                    ? 'bg-white animate-pulse' 
                    : 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                }`}
              >
                {isRecording ? (
                  <StopCircle className="w-8 h-8 text-red-600" />
                ) : (
                  <Mic className="w-8 h-8 text-white" />
                )}
              </button>
            </div>
            
            {/* Shared Notes (Realtime synced) */}
            <div className="mt-6 bg-white/10 rounded-lg p-4 border border-white/20">
              <div className="text-white font-semibold mb-2">Shared Notes (synced)</div>
              <textarea
                value={sharedNotes}
                onChange={(e) => {
                  const val = e.target.value;
                  setSharedNotes(val);
                  channelRef.current?.send({ type: 'broadcast', event: 'notes_update', payload: { text: val } });
                }}
                placeholder="Type notes visible to everyone in this room..."
                className="w-full h-24 bg-black/30 border border-white/20 rounded p-2 text-white"
              />
            </div>

            {/* Audio Playback - Only show when audio is available */}
            {audioURL && (
              <div className="mt-6 bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="text-center mb-3">
                  <h4 className="text-white font-semibold text-lg">Recording Complete!</h4>
                  <p className="text-gray-300 text-sm">Your audio is ready to play</p>
                </div>
                <div className="bg-black/40 rounded-lg p-3 border border-white/20">
                  <audio 
                    controls 
                    src={audioURL} 
                    className="w-full"
                  />
                </div>
                <div className="flex justify-center mt-3">
                  <button
                    onClick={handleClearRecording}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                  >
                    Record New Session
                  </button>
                </div>
              </div>
            )}
      </div>

              </div>
              </div>
      {/* My Recordings - outside and below the Recording Studio box, list format with share options */}
      {recordings.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-white/50 p-8">
          <h3 className="text-2xl font-bold text-white mb-6">My Recordings</h3>
          <ul className="divide-y divide-white/20">
            {recordings.map((rec) => {
              const message = buildShareMessage(rec);
              const waHref = `https://wa.me/?text=${encodeURIComponent(message)}`;
              const mailHref = `mailto:?subject=${encodeURIComponent('JAM Session Recording: ' + rec.title)}&body=${encodeURIComponent(message)}`;
              return (
                <li key={rec.id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold truncate" title={rec.title}>{rec.title}</div>
                    <div className="text-gray-300 text-xs">{rec.createdAt.toLocaleString()}</div>
                    <div className="mt-2">
                      <audio controls src={rec.url} className="w-full md:w-[28rem]" />
            </div>
          </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button onClick={() => handleDownloadRecording(rec)} className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium">Download</button>
                    <button onClick={() => handleNativeShare(rec)} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">Share</button>
                    <a href={waHref} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">WhatsApp</a>
                    <a href={mailHref} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">Email</a>
              </div>
                </li>
              );
            })}
          </ul>
              </div>
      )}
      
    </div>
  );

  const renderInsightsTab = () => (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-white/50 p-8">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Insights</h2>
        
        {/* Speak AI style insights derived from current content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/20 rounded-lg p-6">
            <div className="text-xs text-gray-200 uppercase tracking-wide mb-1">Overall Tone</div>
            <div className="text-2xl font-bold text-green-300">Positive</div>
            <div className="text-gray-200 text-sm mt-2">Friendly, encouraging language with clear explanations.</div>
          </div>
          <div className="bg-white/20 rounded-lg p-6">
            <div className="text-xs text-gray-200 uppercase tracking-wide mb-1">Key Concepts</div>
            <ul className="text-gray-100 text-sm list-disc pl-5 space-y-1">
              <li>Core definition and purpose</li>
              <li>Real‑life example</li>
              <li>Mini activity to apply</li>
            </ul>
          </div>
          <div className="bg-white/20 rounded-lg p-6">
            <div className="text-xs text-gray-200 uppercase tracking-wide mb-1">Next Best Steps</div>
            <ul className="text-gray-100 text-sm list-disc pl-5 space-y-1">
              <li>Explain the topic in your own words</li>
              <li>Find one new example around you</li>
              <li>Teach a friend in 3 bullets</li>
            </ul>
          </div>
        </div>

          <div className="bg-white/10 rounded-lg p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">AI Summary</h3>
          <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">
            {createdContent?.content
              ? `Here’s a concise Speak‑style recap of “${createdContent.title}”. Focus on the big idea, a vivid example, and one tiny action you can do now.

${createdContent.content.split('\n').slice(0, 8).join('\n')}`
              : 'Generate or search content to view insights.'}
                </div>
                </div>

        {/* Overall Report (aggregate) */}
        {recordings.length > 0 && (
          <div className="bg-gradient-to-br from-cyan-500/10 via-fuchsia-500/10 to-violet-500/10 rounded-2xl p-6 border border-white/20 shadow-xl mt-6">
            <h3 className="text-xl font-bold text-white mb-2">Overall Report</h3>
            <div className="text-gray-200 text-sm mb-4">{buildAggregateFeedback()}</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(() => {
                const vals = recordings.map(r => recordingInsights[r.id]).filter(Boolean) as any[];
                const totalMin = Math.round(vals.reduce((a, v) => a + (v?.durationSec || 0), 0) / 60);
                const avgWpm = vals.length ? Math.round(vals.reduce((a, v) => a + (v?.wpm || 0), 0) / vals.length) : 0;
                const avgPitch = vals.length ? Math.round(vals.reduce((a, v) => a + (v?.avgPitchHz || 0), 0) / vals.length) : 0;
                const bestWpm = vals.reduce((m, v) => Math.max(m, v?.wpm || 0), 0);
                const tiles = [
                  { label: 'Total Minutes', value: `${totalMin}m`, bg: 'from-cyan-500/20 to-blue-500/20' },
                  { label: 'Avg WPM', value: `${avgWpm}`, bg: 'from-pink-500/20 to-fuchsia-500/20' },
                  { label: 'Avg Pitch', value: `${avgPitch} Hz`, bg: 'from-emerald-500/20 to-teal-500/20' },
                  { label: 'Best WPM', value: `${bestWpm}`, bg: 'from-amber-500/20 to-orange-500/20' },
                ];
                return tiles.map(t => (
                  <div key={t.label} className={`bg-gradient-to-br ${t.bg} rounded-xl p-4 border border-white/20 shadow-lg backdrop-blur-sm`}> 
                    <div className="text-gray-300 text-xs uppercase tracking-wide">{t.label}</div>
                    <div className="text-white text-2xl font-extrabold mt-1 drop-shadow">{t.value}</div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Recording insights table */}
        {recordings.length > 0 && (
          <div className="bg-white/10 rounded-lg p-6 border border-white/20 mt-6">
            <h3 className="text-xl font-bold text-white mb-4">Recording Insights</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-gray-100">
                <thead>
                  <tr className="text-left">
                    <th className="pb-2 pr-4">Title</th>
                    <th className="pb-2 pr-4">Words</th>
                    <th className="pb-2 pr-4">Duration</th>
                    <th className="pb-2 pr-4">WPM</th>
                    <th className="pb-2 pr-4">Avg Pitch (Hz)</th>
                    <th className="pb-2 pr-4">Pitch Level</th>
                    <th className="pb-2 pr-4">Style</th>
                    <th className="pb-2 pr-4">Pronunciation</th>
                  </tr>
                </thead>
                <tbody>
                  {recordings.map(r => {
                    const m = recordingInsights[r.id];
                    return (
                      <tr key={r.id} className="border-t border-white/10">
                        <td className="py-2 pr-4">{r.title}</td>
                        <td className="py-2 pr-4">{m?.words ?? '-'}</td>
                        <td className="py-2 pr-4">{m?.durationSec ? `${m.durationSec}s` : '-'}</td>
                        <td className="py-2 pr-4">{m?.wpm ?? '-'}</td>
                        <td className="py-2 pr-4">{m?.avgPitchHz ?? '-'}</td>
                        <td className="py-2 pr-4">{m?.pitchLevel ?? '-'}</td>
                        <td className="py-2 pr-4">{m?.style ?? '-'}</td>
                        <td className="py-2 pr-4">{m?.pronunciation ?? '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="text-white font-semibold mb-2">Words per Recording</div>
                <Bar
                  data={{
                    labels: recordings.map(r => r.title.length > 14 ? r.title.slice(0,14) + '…' : r.title),
                    datasets: [{
                      label: 'Words',
                      data: recordings.map(r => recordingInsights[r.id]?.words ?? 0),
                      backgroundColor: ['#22d3ee']
                    }]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false, labels: { color: '#e5e7eb', font: { size: 12 } } },
                      tooltip: { enabled: true }
                    },
                    scales: {
                      x: { ticks: { color: '#e5e7eb' } },
                      y: { ticks: { color: '#e5e7eb' } }
                    }
                  }}
                />
                </div>
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="text-white font-semibold mb-2">Average Pitch (Hz)</div>
                <Line
                  data={{
                    labels: recordings.map(r => r.title.length > 14 ? r.title.slice(0,14) + '…' : r.title),
                    datasets: [{
                      label: 'Avg Pitch (Hz)',
                      data: recordings.map(r => recordingInsights[r.id]?.avgPitchHz ?? 0),
                      borderColor: '#f472b6',
                      backgroundColor: 'rgba(244,114,182,0.25)',
                      tension: 0.3,
                      fill: true
                    }]
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false, labels: { color: '#e5e7eb', font: { size: 12 } } } },
                    scales: { x: { ticks: { color: '#e5e7eb' } }, y: { ticks: { color: '#e5e7eb' } } }
                  }}
                />
                </div>
              <div className="bg-white/10 rounded-lg p-4 border border-white/20 md:col-span-2">
                <div className="text-white font-semibold mb-2">Communication Style Distribution</div>
                <Pie
                  data={{
                    labels: ['Informative','Persuasive','Narrative','Descriptive','Unknown'],
                    datasets: [{
                      label: 'Style',
                      data: ['Informative','Persuasive','Narrative','Descriptive','Unknown'].map(s => recordings.reduce((acc, r) => acc + ((recordingInsights[r.id]?.style === s) ? 1 : 0), 0)),
                      backgroundColor: ['#22d3ee','#f472b6','#f59e0b','#34d399','#94a3b8']
                    }]
                  }}
                  options={{ responsive: true, plugins: { legend: { labels: { color: '#e5e7eb', font: { size: 12 } } } } }}
                />
              </div>
              {/* Recent recordings quick list with hover feedback */}
              <div className="bg-white/10 rounded-lg p-4 border border-white/20 md:col-span-2">
                <div className="text-white font-semibold mb-2">Recent Recordings</div>
                <ul className="divide-y divide-white/10">
                  {recordings.map(r => {
                    const m = recordingInsights[r.id];
                    const tip = buildFeedbackFromMetrics(m);
                    return (
                      <li key={r.id} className="py-2 text-gray-100 flex items-center justify-between" title={tip}>
                        <span className="truncate mr-4" style={{ maxWidth: '70%' }}>{r.title}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-300 text-xs">{m ? `${m.words}w • ${m.wpm}wpm • ${m.avgPitchHz}Hz` : 'processing…'}</span>
                          <button
                            onClick={() => { setInsightsModalRecId(r.id); setInsightsModalOpen(true); }}
                            className="px-2 py-1 rounded bg-gradient-to-r from-pink-500 to-violet-500 text-white text-xs shadow-md hover:from-pink-400 hover:to-violet-400"
                          >
                            Insights
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
                </div>
                </div>
        )}
      </div>
      {/* Glossy modal for per-recording insights */}
      {insightsModalOpen && insightsModalRecId && (() => {
        const r = recordings.find(x => x.id === insightsModalRecId);
        const m = r ? recordingInsights[r.id] : undefined;
        if (!r) return null;
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="w-full max-w-2xl bg-gradient-to-br from-indigo-900/80 to-purple-900/80 border border-white/30 rounded-2xl shadow-2xl p-6 relative">
              <button className="absolute top-3 right-3 text-white/80 hover:text-white" onClick={() => setInsightsModalOpen(false)}>✕</button>
              <div className="text-2xl font-bold text-white mb-2">{r.title}</div>
              <div className="text-gray-300 text-sm mb-4">{new Date(r.createdAt).toLocaleString()}</div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <div className="text-gray-300 text-xs uppercase">Words</div>
                  <div className="text-white text-xl font-bold">{m?.words ?? '-'}</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <div className="text-gray-300 text-xs uppercase">WPM</div>
                  <div className="text-white text-xl font-bold">{m?.wpm ?? '-'}</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <div className="text-gray-300 text-xs uppercase">Avg Pitch</div>
                  <div className="text-white text-xl font-bold">{m?.avgPitchHz ?? '-'} Hz</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <div className="text-gray-300 text-xs uppercase">Pitch Level</div>
                  <div className="text-white text-xl font-bold">{m?.pitchLevel ?? '-'}</div>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 border border-white/20 mb-3">
                <div className="text-gray-300 text-xs uppercase mb-1">Style & Pronunciation</div>
                <div className="text-white">Style: {m?.style ?? '-'} • Pronunciation: {m?.pronunciation ?? '-'}</div>
              </div>
              <div className="bg-gradient-to-r from-pink-500/20 to-violet-500/20 rounded-lg p-4 border border-pink-400/30">
                <div className="text-white font-semibold mb-1">Feedback</div>
                <div className="text-gray-100 text-sm">{buildFeedbackFromMetrics(m)}</div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Custom CSS for talking animations */}
      <style dangerouslySetInnerHTML={{ __html: talkingStyles }} />
      
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
          <h1 className="text-5xl font-bold text-white">JAM Sessions</h1>
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
      <main className="flex-1 flex justify-center pt-12 px-4">
        <div className="max-w-8xl w-full flex justify-center gap-12">
          {/* Left Section */}
          <div className="flex flex-col items-center flex-1 max-w-7xl">
            {/* Tab Bar */}
            <div className="flex gap-6 mb-4 mt-8">
              {[
                { id: 'create', label: 'Create Content', icon: Plus },
                { id: 'record', label: 'Recording Studio', icon: Mic },
                { id: 'insights', label: 'Insights', icon: BarChart3 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-8 py-3 rounded-lg font-semibold text-xl transition-all duration-300 whitespace-nowrap ${
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
              {activeTab === 'create' && renderCreateContentTab()}
              {activeTab === 'record' && renderRecordingStudioTab()}
              {activeTab === 'insights' && renderInsightsTab()}
            </div>
          </div>

          {/* Right Sidebar removed for Insights */}
        </div>
      </main>
    </div>
  );
};

export default JamSessions;

