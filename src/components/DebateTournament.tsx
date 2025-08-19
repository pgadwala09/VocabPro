import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Brain, Sparkles, Users, MessageSquare, ArrowLeft, Mic, MicOff, Play, Pause, Trophy, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { googleCloudTts } from '../lib/tts';
import { generateDebateTurn } from '../lib/insights';
import EmojiPickerLib from 'emoji-picker-react';


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
  const [isPaused, setIsPaused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [builderTime, setBuilderTime] = useState(0);
  const [breakerTime, setBreakerTime] = useState(0);
  const [activeRole, setActiveRole] = useState<'builder' | 'breaker' | null>(null);
  // Refs to avoid stale closures in the timer interval
  const builderTimeRef = useRef(0);
  const breakerTimeRef = useRef(0);
  const activeRoleRef = useRef<'builder' | 'breaker' | null>(null);
  const startedRef = useRef(false);
  const pausedRef = useRef(false);

  useEffect(() => { builderTimeRef.current = builderTime; }, [builderTime]);
  useEffect(() => { breakerTimeRef.current = breakerTime; }, [breakerTime]);
  useEffect(() => { activeRoleRef.current = activeRole; }, [activeRole]);
  useEffect(() => { startedRef.current = isDebateStarted; }, [isDebateStarted]);
  useEffect(() => { pausedRef.current = isPaused; }, [isPaused]);
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
  const SUMMARY_BUCKET = 'debate-summaries';
  const debateAudioPartsRef = useRef<string[]>([]);

  // Single shared audio element to avoid overlapping playback
  const sharedAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // UI controls: round and timer minutes
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(5);

  // Helpers for sequential agent speaking with GCP fallback
  const ensureAudio = () => {
    if (!sharedAudioRef.current) {
      sharedAudioRef.current = new Audio();
    }
    return sharedAudioRef.current as HTMLAudioElement;
  };

  type AudioPart = { url: string; b64?: string };

  const playPart = async (part: AudioPart) => {
    const { url, b64 } = part;
    try {
      const audio = ensureAudio();
      audio.pause();
      audio.src = url;
      audio.preload = 'auto';
      audio.load();
      await new Promise<void>((resolve)=>{
        if (audio.readyState >= 3) { resolve(); return; }
        let settled = false;
        const done = () => { if (settled) return; settled = true; cleanup(); resolve(); };
        const cleanup = () => {
          audio.removeEventListener('canplaythrough', done);
          audio.removeEventListener('canplay', done);
          audio.removeEventListener('loadeddata', done);
          audio.removeEventListener('error', done);
        };
        const timer = setTimeout(done, 800);
        const wrapped = () => { clearTimeout(timer); done(); };
        audio.addEventListener('canplaythrough', wrapped, { once: true });
        audio.addEventListener('canplay', wrapped, { once: true });
        audio.addEventListener('loadeddata', wrapped, { once: true });
        audio.addEventListener('error', wrapped, { once: true });
      });
      await audio.play().catch(() => {});
      // capture the audio data for archival
      try {
        if (b64) {
          debateAudioPartsRef.current.push(b64);
        } else {
          const buf = await fetch(url).then(r=>r.arrayBuffer());
          const b64buf = btoa(String.fromCharCode(...new Uint8Array(buf)));
          debateAudioPartsRef.current.push(b64buf);
        }
      } catch {}
      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
      });
    } catch {}
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

  const fetchAgentAudio = async (side: 'pro' | 'con', text: string): Promise<AudioPart | null> => {
    try {
      const base = (import.meta.env.VITE_PROXY_BASE || 'http://127.0.0.1:8787');
      const session = `${roomId}-${selectedRound}`;
      const r = await fetch(base + '/elevenlabs/agent-turn', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ side, text, session, topic: currentDebate?.topic || 'Debate Topic' })
      });
      if (!r.ok) return null;
      const buf = await r.arrayBuffer();
      const url = URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }));
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      return { url, b64 };
    } catch {
      return null;
    }
  };

  const synthesizeGcp = async (text: string): Promise<AudioPart | null> => {
    try {
      const base = (import.meta.env.VITE_GCP_TTS_PROXY || 'http://127.0.0.1:8789');
      const r = await fetch(base + '/gcp/tts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text, voiceName: 'en-US-Standard-A' })
      });
      if (!r.ok) return null;
      const buf = await r.arrayBuffer();
      const url = URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }));
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      return { url, b64 };
    } catch {
      return null;
    }
  };

  // Run a timed debate for the configured duration (minutes). Alternates turns until time elapses.
  const speakAgentsSequentially = async (topic: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const minutes = selectedMinutes || (typeof currentDebate?.duration === 'number' && currentDebate.duration > 0 ? currentDebate.duration : 5);
      const endTs = Date.now() + minutes * 60 * 1000;
      setRemainingSeconds(Math.ceil((endTs - Date.now()) / 1000));
      const tickTimer = setInterval(()=>{
        const s = Math.max(0, Math.ceil((endTs - Date.now()) / 1000));
        setRemainingSeconds(s);
        if (s <= 0) clearInterval(tickTimer);
      }, 1000);
      let lastPro: string | null = null;
      let lastCon: string | null = null;
      let turn: 'pro' | 'con' = 'pro';

      let idx = 0;
      while (Date.now() < endTs) {
        if (turn === 'pro') {
          const theme = proThemes[idx % proThemes.length];
          const generated = await generateDebateTurn('pro', topic, lastCon || undefined);
          const text = generated || buildProFallback(topic, theme);
          const agent = await fetchAgentAudio('pro', text);
          if (agent) { await playPart(agent); } else { const g = await synthesizeGcp(text); if (g) await playPart(g); }
          setProArgument(text);
          lastPro = text;
          turn = 'con';
        } else {
          const theme = conThemes[idx % conThemes.length];
          const generated = await generateDebateTurn('con', topic, lastPro || undefined);
          const text = generated || buildConFallback(topic, theme, lastPro);
          const agent = await fetchAgentAudio('con', text);
          if (agent) { await playPart(agent); } else { const g = await synthesizeGcp(text); if (g) await playPart(g); }
          setConArgument(text);
          lastCon = text;
          turn = 'pro';
        }
        idx += 1;
        await new Promise((r) => setTimeout(r, 200));
      }
    } finally {
      setIsSpeaking(false);
      setRemainingSeconds(null);
      // send parts to backend to concatenate and store locally in memory; then upload to Supabase as one file
      try {
        const parts = debateAudioPartsRef.current.splice(0);
        if (parts.length > 0) {
          const base = (import.meta.env.VITE_PROXY_BASE || 'http://127.0.0.1:8787');
          const r = await fetch(base + '/debate/concat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ parts }) });
          if (r.ok) {
            const buf = await r.arrayBuffer();
            const mp3 = new Blob([buf], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(mp3);
            setSummaryAudioUrl(url);
            // try to upload to Supabase bucket
            try {
              setSummaryUploading(true);
              const path = `${currentDebate?.id || 'debate'}/debate-${Date.now()}.mp3`;
              const { error: uploadError } = await supabase.storage.from(SUMMARY_BUCKET).upload(path, mp3, { contentType: 'audio/mpeg', upsert: true });
              if (!uploadError) {
                const { data: pub } = supabase.storage.from(SUMMARY_BUCKET).getPublicUrl(path);
                if (pub?.publicUrl) {
                  // push into recent activity list
                  setLiveDebates(prev => {
                    const topic = currentDebate?.topic || 'Debate';
                    const existing = prev.findIndex(d => d.topic === topic);
                    const rec = { id: Date.now().toString(), url: pub.publicUrl, timestamp: new Date(), role: 'builder' as const };
                    if (existing >= 0) {
                      const clone = [...prev];
                      clone[existing] = { ...clone[existing], recordings: [...clone[existing].recordings, rec] };
                      return clone;
                    }
                    return [...prev, { id: Date.now().toString(), topic, timestamp: new Date(), builderCharacter: currentDebate?.builderCharacter || 'Builder', breakerCharacter: currentDebate?.breakerCharacter || 'Breaker', duration: String(selectedMinutes), recordings: [rec] }];
                  });
                }
              }
            } finally { setSummaryUploading(false); }
          }
        }
      } catch {}
    }
  };

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
  // Debate UI states
  const [proArgument, setProArgument] = useState<string>('');
  const [conArgument, setConArgument] = useState<string>('');
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
  const [uploading, setUploading] = useState(false);
  const SUPABASE_BUCKET = 'debate-recordings';

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

  // Resolve room id from ?room= param or fallback to debate id
  const roomId = useMemo(() => {
    const q = new URLSearchParams(window.location.search).get('room');
    return q || currentDebate?.id || 'default';
  }, [currentDebate?.id]);

  // Realtime: join room and sync state
  useEffect(() => {
    if (!currentDebate) return;
    const room = `debate:${roomId}`;
    const presenceKey = (user?.id as string) || Math.random().toString(36).slice(2);
    const channel = supabase.channel(room, { config: { presence: { key: presenceKey } } });

    // presence
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      let count = 0;
      Object.values(state).forEach((arr: any) => { count += Array.isArray(arr) ? arr.length : 0; });
      setParticipants(Math.max(1, count));
    });

    // state sync request
    channel.on('broadcast', { event: 'state_request' }, () => {
      const snapshot = buildSnapshot();
      channel.send({ type: 'broadcast', event: 'state_sync', payload: snapshot });
    });

    // receive full state
    channel.on('broadcast', { event: 'state_sync' }, ({ payload }) => {
      if (!payload) return;
      setIsDebateStarted(!!payload.isDebateStarted);
      setIsPaused(!!payload.isPaused);
      setActiveRole(payload.activeRole ?? null);
      if (typeof payload.builderTime === 'number') setBuilderTime(payload.builderTime);
      if (typeof payload.breakerTime === 'number') setBreakerTime(payload.breakerTime);
      if (typeof payload.builderScore === 'number') setBuilderScore(payload.builderScore);
      if (typeof payload.breakerScore === 'number') setBreakerScore(payload.breakerScore);
    });

    // simple update events
    channel.on('broadcast', { event: 'score_update' }, ({ payload }) => {
      if (payload?.side === 'builder') setBuilderScore(payload.value ?? 0);
      if (payload?.side === 'breaker') setBreakerScore(payload.value ?? 0);
    });
    channel.on('broadcast', { event: 'role_update' }, ({ payload }) => {
      setActiveRole(payload?.role ?? null);
    });
    channel.on('broadcast', { event: 'start_stop' }, ({ payload }) => {
      setIsDebateStarted(!!payload?.started);
      if (!payload?.started) setIsPaused(false);
    });

    // pause/resume updates
    channel.on('broadcast', { event: 'pause_state' }, ({ payload }) => {
      setIsPaused(!!payload?.paused);
    });

    // chat: receive message
    channel.on('broadcast', { event: 'chat_message' }, ({ payload }) => {
      if (!payload?.id || !payload?.text) return;
      setMessages((prev) => [...prev, payload]);
    });

    // chat: receive reaction
    channel.on('broadcast', { event: 'reaction' }, ({ payload }) => {
      const { messageId, emoji, user: actor } = payload || {};
      if (!messageId || !emoji) return;
      setMessages((prev) => {
        const updated = prev.map((msg) => {
          if (msg.id !== messageId) return msg;
          const existing = msg.reactions?.find((r) => r.emoji === emoji);
          if (existing) {
            const has = existing.users.includes(actor);
            const users = has ? existing.users.filter((u) => u !== actor) : [...existing.users, actor];
            const count = Math.max(0, has ? existing.count - 1 : existing.count + 1);
            const reactions = users.length === 0
              ? msg.reactions?.filter((r) => r.emoji !== emoji) || []
              : (msg.reactions || []).map((r) => (r.emoji === emoji ? { ...r, users, count } : r));
            return { ...msg, reactions };
          }
          // create new reaction
          const reactions = [ ...(msg.reactions || []), { emoji, count: 1, users: [actor] } ];
          return { ...msg, reactions };
        });
        return updated;
      });
    });

    // followers receive authoritative ticks
    channel.on('broadcast', { event: 'tick' }, ({ payload }) => {
      if (!leaderRef.current) {
        if (typeof payload?.builderTime === 'number') {
          builderTimeRef.current = payload.builderTime;
          setBuilderTime(payload.builderTime);
        }
        if (typeof payload?.breakerTime === 'number') {
          breakerTimeRef.current = payload.breakerTime;
          setBreakerTime(payload.breakerTime);
        }
        if (payload?.activeRole === 'builder' || payload?.activeRole === 'breaker' || payload?.activeRole === null) {
          activeRoleRef.current = payload.activeRole;
          setActiveRole(payload.activeRole);
        }
      }
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.track({ online_at: Date.now() });
        channel.send({ type: 'broadcast', event: 'state_request', payload: {} });
      }
    });

    channelRef.current = channel;

    // try to upsert debate metadata (if table exists)
    (async () => {
      try {
        await supabase.from('debates').upsert({
          id: currentDebate.id,
          topic: currentDebate.topic,
          debate_style: currentDebate.debateStyle,
          duration: currentDebate.duration,
          created_at: currentDebate.createdAt?.toISOString?.() || new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch {}
    })();

    return () => {
      try { if (channel) supabase.removeChannel(channel); } catch {}
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const buildSnapshot = () => ({
    isDebateStarted,
    isPaused,
    activeRole,
    builderTime,
    breakerTime,
    builderScore,
    breakerScore,
    ts: Date.now(),
  });

  const broadcast = (event: string, payload: any) => {
    channelRef.current?.send({ type: 'broadcast', event, payload });
    // best-effort persistence (ignore if table missing)
    try {
      supabase.from('debate_events').insert({
        debate_id: currentDebate?.id,
        event_type: event,
        payload,
        created_at: new Date().toISOString(),
      });
    } catch {}
  };

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

  // Leader-only ticking loop broadcasting authoritative state
  useEffect(() => {
    if (leaderRef.current && startedRef.current && activeRoleRef.current && !pausedRef.current) {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = setInterval(() => {
        const role = activeRoleRef.current;
        if (role === 'builder') {
          if (builderTimeRef.current > 0) builderTimeRef.current -= 1;
          else if (breakerTimeRef.current > 0) {
            activeRoleRef.current = 'breaker';
            broadcast('role_update', { role: 'breaker' });
          }
        } else if (role === 'breaker') {
          if (breakerTimeRef.current > 0) breakerTimeRef.current -= 1;
          else if (builderTimeRef.current > 0) {
            activeRoleRef.current = 'builder';
            broadcast('role_update', { role: 'builder' });
          }
        }

        // reflect locally
        setBuilderTime(builderTimeRef.current);
        setBreakerTime(breakerTimeRef.current);
        setActiveRole(activeRoleRef.current);

        // broadcast authoritative tick
        broadcast('tick', {
          builderTime: builderTimeRef.current,
          breakerTime: breakerTimeRef.current,
          activeRole: activeRoleRef.current,
        });

        if (builderTimeRef.current <= 0 && breakerTimeRef.current <= 0) {
          if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
          tickIntervalRef.current = null;
          leaderRef.current = false;
          setIsDebateStarted(false);
          setActiveRole(null);
          broadcast('start_stop', { started: false });
          stopRecording();
        }
      }, 1000);
      return () => { if (tickIntervalRef.current) { clearInterval(tickIntervalRef.current); tickIntervalRef.current = null; } };
    }
    // when not leader, ensure no local interval stays around
    if (tickIntervalRef.current) { clearInterval(tickIntervalRef.current); tickIntervalRef.current = null; }
  }, [isDebateStarted, activeRole, isPaused]);

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
        const localUrl = URL.createObjectURL(audioBlob);
        const newRecording = {
          id: Date.now().toString(),
          url: localUrl,
          timestamp: new Date(),
          role: activeRole || 'builder'
        };

        (async () => {
          try {
            setUploading(true);
            const ts = newRecording.timestamp.toISOString().replace(/[:.]/g, '-');
            const path = `${currentDebate?.id || 'debate'}/${newRecording.role}-${ts}.webm`;
            const { error: uploadError } = await supabase
              .storage
              .from(SUPABASE_BUCKET)
              .upload(path, audioBlob, { contentType: 'audio/webm', upsert: true });
            if (uploadError) {
              console.warn('Upload to Supabase failed:', uploadError.message);
            } else {
              const { data: pub } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
              if (pub?.publicUrl) {
                newRecording.url = pub.publicUrl;
              }
            }
          } catch (e) {
            console.warn('Upload error:', e);
          } finally {
            setUploading(false);
          }
        })();

        // Update live debates
        setLiveDebates(prev => {
          const topic = currentDebate?.topic || 'Debate';
          const builderChar = currentDebate?.builderCharacter || 'Builder';
          const breakerChar = currentDebate?.breakerCharacter || 'Breaker';
          const durationStr = String(currentDebate?.duration ?? 0);
          const existingDebateIndex = prev.findIndex(d => d.topic === topic);
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
              topic,
              timestamp: new Date(),
              builderCharacter: builderChar,
              breakerCharacter: breakerChar,
              duration: durationStr,
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
  const EmojiPicker = ({ messageId, onEmojiSelect }: { messageId: string; onEmojiSelect: (msgId: string, emoji: string) => void }) => {
    const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🎉', '🔥', '💯', '🤔', '👀'];
    
         return (
       <div className="emoji-picker-container absolute bottom-full left-0 mb-2 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 p-3 z-10">
        <div className="grid grid-cols-4 gap-2">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onEmojiSelect(messageId, emoji)}
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
          const userIndex = existingReaction.users.indexOf(currentDebate?.builderCharacter || 'User');
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
            existingReaction.users.push(currentDebate?.builderCharacter || 'User');
            existingReaction.count++;
          }
        } else {
          // Create new reaction
          const newReaction = {
            emoji,
            count: 1,
            users: [currentDebate?.builderCharacter || 'User']
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

        {/* Debate with AI simplified panel */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
          <div className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-4xl font-bold text-white">Debate with AI</h2>
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
              {/* vertical divider */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20 pointer-events-none" />
              {/* PRO side */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-full border border-white/30 bg-white/20 flex items-center justify-center text-white text-2xl">👤</div>
                  <select className="bg-white/10 text-white px-3 py-2 rounded-lg border border-white/20">
                    <option>AI</option>
                  </select>
                </div>
                <div className="w-full">
                  <div className="bg-white/10 text-white/90 rounded-xl border border-white/20 p-4 min-h-[160px]">
                    <div className="font-semibold mb-2">Argument</div>
                    <div className="whitespace-pre-wrap text-sm opacity-90">{proArgument || ' '}</div>
                  </div>
                  {/* Button removed; unified button below */}
                </div>
              </div>
              {/* CON side */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-full border border-white/30 bg-white/20 flex items-center justify-center text-white text-2xl">👤</div>
                  <select className="bg-white/10 text-white px-3 py-2 rounded-lg border border-white/20">
                    <option>AI</option>
                  </select>
                </div>
                <div className="w-full">
                  <div className="bg-white/10 text-white/90 rounded-xl border border-white/20 p-4 min-h-[160px]">
                    <div className="font-semibold mb-2">Argument</div>
                    <div className="whitespace-pre-wrap text-sm opacity-90">{conArgument || ' '}</div>
                  </div>
                  {/* Button removed; unified button below */}
                </div>
              </div>
            </div>
            {/* Unified Generate button */}
            <div className="mt-6">
              <button onClick={async ()=>{
                const topic = currentDebate?.topic || 'Debate Topic';
                await speakAgentsSequentially(topic);
              }} disabled={isSpeaking} className="w-full bg-white text-purple-900 font-semibold py-3 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed">Generate</button>
            </div>
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
                        <div className="flex flex-wrap gap-1 mt-2 overflow-visible">
                          {msg.reactions.map((reaction, index) => (
                            <div key={index} className="relative group inline-block">
                              <button
                                onClick={() => handleEmojiReaction(msg.id, reaction.emoji)}
                                title={`${reaction.emoji} • ${reaction.users.join(', ') || 'You'}`}
                                aria-label={`${reaction.emoji} reacted by ${reaction.users.join(', ') || 'You'}`}
                                className={`peer px-2 py-1 rounded-full text-xs transition-all duration-200 ${
                                  reaction.users.includes(currentDebate?.builderCharacter || '')
                                    ? 'bg-white/30 text-white'
                                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                                }`}
                              >
                                {reaction.emoji} {reaction.count}
                              </button>
                              <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 peer-hover:opacity-100 z-50">
                                {reaction.users.length ? reaction.users.join(', ') : 'You'}
                              </div>
                            </div>
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
                       <div className="emoji-picker-container absolute bottom-full right-0 mb-2 z-10">
                         <EmojiPickerLib
                           onEmojiClick={(emojiData: any) => {
                             const emoji = emojiData.emoji;
                             handleEmojiReaction(msg.id, emoji);
                             setShowEmojiPicker(null);
                             channelRef.current?.send({ type: 'broadcast', event: 'reaction', payload: { messageId: msg.id, emoji, user: fullName || 'User' } });
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
                  sender: currentDebate?.builderCharacter || 'User',
                  reactions: [] as any[],
                };

                const updatedMessages = [...messages, newMessage];
                setMessages(updatedMessages);
                localStorage.setItem('chatMessages', JSON.stringify(updatedMessages));
                // broadcast to room
                channelRef.current?.send({ type: 'broadcast', event: 'chat_message', payload: newMessage });
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
          {([
            { id: 'live' as const, label: 'Live Debates', icon: Users },
            { id: 'chat' as const, label: 'Chat Debates', icon: MessageSquare }
          ]).map((tab) => (
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