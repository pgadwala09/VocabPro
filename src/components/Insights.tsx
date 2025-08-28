import React, { useMemo, useState, useEffect } from 'react';
import { useFeedback } from '../hooks/FeedbackContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { Download, Share2, Mail, MessageCircle, Play, Pause } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
);

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

interface Debate {
  id: string;
  topic: string;
  created_at: string;
  status: 'active' | 'completed' | 'paused';
  pro_argument?: string;
  con_argument?: string;
  selected_rounds: number;
  selected_time: number;
}

interface DebateTurn {
  id: string;
  debate_id: string;
  turn_number: number;
  speaker: 'user_pro' | 'ai_con';
  transcript?: string;
  audio_url?: string;
  duration?: number;
  created_at: string;
}

interface DebateAnalytics {
  totalDebates: number;
  completedDebates: number;
  totalDuration: number;
  averageDuration: number;
  totalTurns: number;
  averageTurnsPerDebate: number;
  topicsByFrequency: Array<{topic: string, count: number}>;
  debatesByDate: Array<{date: string, count: number}>;
  userVsAIStats: {
    userTurns: number;
    aiTurns: number;
    userWinRate: number;
  };
}

const FeedbackCard = ({ feedback }) => (
  <div className="bg-gradient-to-br from-blue-900 to-purple-800 rounded-2xl shadow-xl p-8 w-full max-w-md mx-auto mb-8 text-white relative">
    <h2 className="text-2xl font-bold mb-4 text-center">Pronunciation Insights</h2>
    <div className="flex flex-col items-center mb-6">
      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-5xl font-bold border-8 border-blue-200 mb-2">
        {feedback.score}
      </div>
      <div className="text-lg font-semibold text-blue-100">/100</div>
      <div className="text-lg font-bold mt-2">{feedback.word}</div>
    </div>
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-xl">🎤</span>
        <div className="flex-1">
          <div className="font-semibold">Clarity</div>
          <div className="text-blue-200 text-sm">How clear was my pronunciation?</div>
        </div>
        <div className="flex-1 flex flex-col items-end">
          <div className="w-32 h-2 bg-blue-200/30 rounded-full overflow-hidden mb-1">
            <div className="h-2 bg-blue-400 rounded-full" style={{ width: `${feedback.clarity.value * 10}%` }}></div>
          </div>
          <div className="text-xs text-blue-100">{feedback.clarity.text}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xl">🎵</span>
        <div className="flex-1">
          <div className="font-semibold">Word Stress</div>
          <div className="text-blue-200 text-sm">Did I stress the syllables correctly?</div>
        </div>
        <div className="flex-1 flex flex-col items-end">
          <div className="w-32 h-2 bg-blue-200/30 rounded-full overflow-hidden mb-1">
            <div className="h-2 bg-blue-400 rounded-full" style={{ width: `${feedback.wordStress.value * 10}%` }}></div>
          </div>
          <div className="text-xs text-blue-100">{feedback.wordStress.text}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xl">⏱️</span>
        <div className="flex-1">
          <div className="font-semibold">Pace</div>
          <div className="text-blue-200 text-sm">Was I speaking at an appropriate speed?</div>
        </div>
        <div className="flex-1 flex flex-col items-end">
          <div className="w-32 h-2 bg-blue-200/30 rounded-full overflow-hidden mb-1">
            <div className="h-2 bg-blue-400 rounded-full" style={{ width: `${feedback.pace.value * 10}%` }}></div>
          </div>
          <div className="text-xs text-blue-100">{feedback.pace.text}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xl">🎶</span>
        <div className="flex-1">
          <div className="font-semibold">Phoneme Accuracy</div>
          <div className="text-blue-200 text-sm">How precise were my sounds?</div>
        </div>
        <div className="flex-1 flex flex-col items-end">
          <div className="w-32 h-2 bg-blue-200/30 rounded-full overflow-hidden mb-1">
            <div className="h-2 bg-blue-400 rounded-full" style={{ width: `${feedback.phonemeAccuracy.value * 10}%` }}></div>
          </div>
          <div className="text-xs text-blue-100">{feedback.phonemeAccuracy.text}</div>
        </div>
      </div>
      <div className="mt-6">
        <div className="font-semibold mb-2">Suggestions</div>
        <ul className="list-disc list-inside text-blue-100 text-sm space-y-1">
          {feedback.suggestions.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>
    </div>
    <div className="flex justify-center mt-8">
      <button className="px-8 py-3 bg-blue-400 hover:bg-blue-500 text-white font-bold rounded-lg text-lg shadow">Re-practice Now</button>
    </div>
  </div>
);

const Insights = () => {
  const { feedbacks } = useFeedback();
  const location = useLocation();
  const navigate = useNavigate();
  const [showReport, setShowReport] = useState<boolean>(() => new URLSearchParams(location.search).get('report') === '1');
  const [debateRecordings, setDebateRecordings] = useState<DebateRecording[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(true);
  const [debates, setDebates] = useState<Debate[]>([]);
  const [debateTurns, setDebateTurns] = useState<DebateTurn[]>([]);
  const [debateAnalytics, setDebateAnalytics] = useState<DebateAnalytics | null>(null);
  const [loadingDebates, setLoadingDebates] = useState(true);

  useEffect(() => {
    const q = new URLSearchParams(location.search).get('report') === '1';
    setShowReport(q);
  }, [location.search]);

  // Load debate recordings
  useEffect(() => {
    const loadDebateRecordings = async () => {
      console.log('🔄 Insights: Loading debate recordings...');
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('❌ Insights: No user found');
          setLoadingRecordings(false);
          return;
        }

        console.log('👤 Insights: Loading for user:', user.id);
        const { data, error } = await supabase
          .from('debate_recordings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Insights: Error loading debate recordings:', error);
        } else {
          console.log('✅ Insights: Loaded recordings:', data?.length || 0);
          console.log('📋 Insights: Recordings data:', data);
          setDebateRecordings(data || []);
        }
      } catch (error) {
        console.error('❌ Insights: Error loading debate recordings:', error);
      } finally {
        setLoadingRecordings(false);
        console.log('🏁 Insights: Finished loading debate recordings');
      }
    };

    loadDebateRecordings();
  }, []);

  // Debug effect to log state changes
  useEffect(() => {
    console.log('🔍 Insights Debug State:', {
      debateRecordings: debateRecordings.length,
      feedbacks: feedbacks.length,
      loadingRecordings,
      loadingDebates,
      debateAnalytics: !!debateAnalytics
    });
  }, [debateRecordings.length, feedbacks.length, loadingRecordings, loadingDebates, debateAnalytics]);

  // Load debate analytics data
  useEffect(() => {
    const loadDebateAnalytics = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoadingDebates(false);
          return;
        }

        // Load debates
        const { data: debatesData, error: debatesError } = await supabase
          .from('debates')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (debatesError) {
          console.error('Error loading debates:', debatesError);
        } else {
          setDebates(debatesData || []);
        }

        // Load debate turns
        const { data: turnsData, error: turnsError } = await supabase
          .from('debate_turns')
          .select('*')
          .in('debate_id', debatesData?.map(d => d.id) || [])
          .order('created_at', { ascending: false });

        if (turnsError) {
          console.error('Error loading debate turns:', turnsError);
        } else {
          setDebateTurns(turnsData || []);
        }

        // Calculate analytics
        if (debatesData && turnsData) {
          const analytics = calculateDebateAnalytics(debatesData, turnsData, debateRecordings);
          setDebateAnalytics(analytics);
        }

      } catch (error) {
        console.error('Error loading debate analytics:', error);
      } finally {
        setLoadingDebates(false);
      }
    };

    loadDebateAnalytics();
  }, [debateRecordings]); // Recalculate when recordings change

  const calculateDebateAnalytics = (debates: Debate[], turns: DebateTurn[], recordings: DebateRecording[]): DebateAnalytics => {
    // Combine debates from both tables
    const totalDebates = debates.length + recordings.length;
    const completedDebates = debates.filter(d => d.status === 'completed').length + recordings.length;
    
    // Calculate duration from both sources
    const debateDuration = debates.reduce((sum, d) => sum + (d.selected_time || 0), 0);
    const recordingDuration = recordings.reduce((sum, r) => sum + (r.duration || 0), 0);
    const totalDuration = debateDuration + recordingDuration;
    const averageDuration = totalDebates > 0 ? Math.round(totalDuration / totalDebates) : 0;
    
    const totalTurns = turns.length;
    const averageTurnsPerDebate = totalDebates > 0 ? Math.round(totalTurns / totalDebates) : 0;

    // Topics by frequency (combine from both sources)
    const topicCounts: Record<string, number> = {};
    debates.forEach(d => {
      topicCounts[d.topic] = (topicCounts[d.topic] || 0) + 1;
    });
    recordings.forEach(r => {
      topicCounts[r.topic] = (topicCounts[r.topic] || 0) + 1;
    });
    const topicsByFrequency = Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Debates by date (combine from both sources)
    const dateCounts: Record<string, number> = {};
    debates.forEach(d => {
      const date = new Date(d.created_at).toLocaleDateString();
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });
    recordings.forEach(r => {
      const date = new Date(r.created_at).toLocaleDateString();
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });
    const debatesByDate = Object.entries(dateCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 days

    // User vs AI stats
    const userTurns = turns.filter(t => t.speaker === 'user_pro').length;
    const aiTurns = turns.filter(t => t.speaker === 'ai_con').length;
    const userWinRate = totalTurns > 0 ? Math.round((userTurns / totalTurns) * 100) : 0;

    return {
      totalDebates,
      completedDebates,
      totalDuration,
      averageDuration,
      totalTurns,
      averageTurnsPerDebate,
      topicsByFrequency,
      debatesByDate,
      userVsAIStats: {
        userTurns,
        aiTurns,
        userWinRate
      }
    };
  };

  const totals = useMemo(() => {
    const count = feedbacks.length;
    const avg = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);
    return {
      count,
      avgScore: avg(feedbacks.map(f => f.score)),
      avgClarity: avg(feedbacks.map(f => f.clarity.value)),
      avgStress: avg(feedbacks.map(f => f.wordStress.value)),
      avgPace: avg(feedbacks.map(f => f.pace.value)),
      avgPhoneme: avg(feedbacks.map(f => f.phonemeAccuracy.value))
    };
  }, [feedbacks]);

  const wordsPerDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const f of feedbacks) {
      const day = new Date(f.date).toLocaleDateString();
      map[day] = (map[day] || 0) + 1;
    }
    const labels = Object.keys(map);
    return {
      labels,
      data: labels.map(l => map[l])
    };
  }, [feedbacks]);

  const pieData = useMemo(() => ({
    labels: ['Clarity', 'Word Stress', 'Pace', 'Phoneme'],
    datasets: [{
      data: [totals.avgClarity, totals.avgStress, totals.avgPace, totals.avgPhoneme],
      backgroundColor: ['#60a5fa', '#a78bfa', '#34d399', '#fbbf24']
    }]
  }), [totals]);

  const barData = useMemo(() => ({
    labels: feedbacks.map(f => f.word),
    datasets: [{
      label: 'Score',
      data: feedbacks.map(f => f.score),
      backgroundColor: '#6366f1'
    }]
  }), [feedbacks]);

  const lineData = useMemo(() => ({
    labels: wordsPerDay.labels,
    datasets: [{ label: 'Words per day', data: wordsPerDay.data, borderColor: '#22d3ee', backgroundColor: 'rgba(34,211,238,0.3)' }]
  }), [wordsPerDay]);

  // Debate analytics charts
  const debateTopicsData = useMemo(() => ({
    labels: debateAnalytics?.topicsByFrequency.map(t => t.topic) || [],
    datasets: [{
      label: 'Debates per Topic',
      data: debateAnalytics?.topicsByFrequency.map(t => t.count) || [],
      backgroundColor: ['#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#f87171']
    }]
  }), [debateAnalytics]);

  const debateActivityData = useMemo(() => ({
    labels: debateAnalytics?.debatesByDate.map(d => d.date) || [],
    datasets: [{
      label: 'Debates per Day',
      data: debateAnalytics?.debatesByDate.map(d => d.count) || [],
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139,92,246,0.3)'
    }]
  }), [debateAnalytics]);

  const userVsAIData = useMemo(() => ({
    labels: ['Your Turns', 'AI Turns'],
    datasets: [{
      data: [
        debateAnalytics?.userVsAIStats.userTurns || 0,
        debateAnalytics?.userVsAIStats.aiTurns || 0
      ],
      backgroundColor: ['#3b82f6', '#ef4444']
    }]
  }), [debateAnalytics]);

  if (!showReport) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 py-12 px-4 relative z-40">
        <div className="max-w-md mx-auto relative z-40 pointer-events-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-yellow-400 text-indigo-900 font-extrabold flex items-center justify-center">🧠</div>
            <h1 className="text-3xl font-extrabold text-white">Learn Insights</h1>
          </div>
          <p className="text-blue-200 mb-6">Track your pronunciation progress and get personalized feedback to improve your speaking skills.</p>
          
          {/* Loading State */}
          {(loadingRecordings || loadingDebates) && (
            <div className="bg-white/10 rounded-xl p-6 text-white text-center mb-6">
              <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-blue-200">Loading your insights...</p>
            </div>
          )}
          
          {/* No Data State */}
          {!loadingRecordings && !loadingDebates && debateRecordings.length === 0 && feedbacks.length === 0 && (
            <div className="bg-white/10 rounded-xl p-6 text-white text-center mb-6">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-2">No Data Available</h3>
              <p className="text-blue-200 mb-4">Start practicing to see your insights!</p>
              <div className="space-y-2 text-sm text-blue-300">
                <p>• Record debates in Debate Tournament</p>
                <p>• Practice pronunciation in Pronunciation Practice</p>
                <p>• Create JAM sessions in Recording Studio</p>
              </div>
              
              {/* Debug Info */}
              <div className="mt-4 p-3 bg-blue-900/30 rounded-lg text-xs text-blue-300">
                <p>Debug: Recordings: {debateRecordings.length}, Feedbacks: {feedbacks.length}</p>
                <p>Loading: Recordings: {loadingRecordings ? 'Yes' : 'No'}, Debates: {loadingDebates ? 'Yes' : 'No'}</p>
              </div>
            </div>
          )}
          
          {/* Data Display */}
          {(debateRecordings.length > 0 || feedbacks.length > 0) && (
            <div className="space-y-4">
              <div className="bg-white/10 rounded-xl p-4 text-white">
                <div className="text-sm text-blue-200">Accuracy Score</div>
                <div className="text-3xl font-extrabold text-green-400">{totals.avgScore}%</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-white">
                <div className="text-sm text-blue-200">Words Practiced</div>
                <div className="text-3xl font-extrabold text-blue-300">{totals.count}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-white">
                <div className="text-sm text-blue-200">Practice Time</div>
                <div className="text-3xl font-extrabold text-purple-300">~{Math.ceil(totals.count * 1.2)}m</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-white">
                <div className="text-sm text-blue-200">Total Debates</div>
                <div className="text-3xl font-extrabold text-orange-400">{debateAnalytics?.totalDebates || 0}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-white">
                <div className="text-sm text-blue-200">AI Debate Recordings</div>
                <div className="text-3xl font-extrabold text-green-400">{debateRecordings.length}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-white">
                <div className="text-sm text-blue-200">Debate Time</div>
                <div className="text-3xl font-extrabold text-indigo-400">~{Math.round((debateAnalytics?.totalDuration || 0) / 60)}m</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-white">
                <div className="text-sm text-blue-200">Win Rate</div>
                <div className="text-3xl font-extrabold text-emerald-400">{debateAnalytics?.userVsAIStats.userWinRate || 0}%</div>
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-8">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 rounded-xl bg-gray-600 text-white font-bold shadow hover:bg-gray-500 cursor-pointer relative z-50"
            >
              ← Back to Dashboard
            </button>
            <button
              type="button"
              onClick={() => navigate('/insights?report=1', { replace: false })}
              className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold shadow hover:bg-blue-500 cursor-pointer relative z-50"
            >
              View Detailed Report
            </button>
            <button
              type="button"
              onClick={async () => {
                console.log('🔄 Manual refresh triggered...');
                setLoadingRecordings(true);
                setLoadingDebates(true);
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  const { data } = await supabase
                    .from('debate_recordings')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });
                  setDebateRecordings(data || []);
                  console.log('✅ Manual refresh completed. Recordings:', data?.length || 0);
                }
                setLoadingRecordings(false);
                setLoadingDebates(false);
              }}
              className="px-4 py-3 rounded-xl bg-green-600 text-white font-bold shadow hover:bg-green-500 cursor-pointer relative z-50"
            >
              {loadingRecordings ? '🔄' : '🔄'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 flex items-center gap-2"
            >
              ← Back to Dashboard
            </button>
            <h2 className="text-3xl font-extrabold text-white">Detailed Report</h2>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setLoadingRecordings(true);
                setLoadingDebates(true);
                // Reload data
                const loadData = async () => {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) {
                    // Reload recordings
                    const { data: recordingsData } = await supabase
                      .from('debate_recordings')
                      .select('*')
                      .eq('user_id', user.id)
                      .order('created_at', { ascending: false })
                      .limit(10);
                    setDebateRecordings(recordingsData || []);
                    setLoadingRecordings(false);
                    
                    // Reload debates
                    const { data: debatesData } = await supabase
                      .from('debates')
                      .select('*')
                      .eq('user_id', user.id)
                      .order('created_at', { ascending: false });
                    setDebates(debatesData || []);
                    
                    // Reload turns
                    const { data: turnsData } = await supabase
                      .from('debate_turns')
                      .select('*')
                      .in('debate_id', debatesData?.map(d => d.id) || [])
                      .order('created_at', { ascending: false });
                    setDebateTurns(turnsData || []);
                    
                    // Recalculate analytics
                    if (debatesData && turnsData) {
                      const analytics = calculateDebateAnalytics(debatesData, turnsData, recordingsData || []);
                      setDebateAnalytics(analytics);
                    }
                    setLoadingDebates(false);
                  }
                };
                loadData();
              }} 
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button onClick={() => navigate('/insights', { replace: true })} className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20">Back</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 rounded-xl p-4 text-white"><div className="text-sm text-blue-200">Avg Clarity</div><div className="text-3xl font-bold">{totals.avgClarity}%</div></div>
          <div className="bg-white/10 rounded-xl p-4 text-white"><div className="text-sm text-blue-200">Avg Stress</div><div className="text-3xl font-bold">{totals.avgStress}%</div></div>
          <div className="bg-white/10 rounded-xl p-4 text-white"><div className="text-sm text-blue-200">Avg Pace</div><div className="text-3xl font-bold">{totals.avgPace}%</div></div>
        </div>

        {/* Debate Analytics Overview */}
        {debateAnalytics && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-white/10 rounded-xl p-4 text-white">
              <div className="text-sm text-blue-200">Total Debates</div>
              <div className="text-3xl font-bold text-orange-400">{debateAnalytics.totalDebates}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-white">
              <div className="text-sm text-blue-200">AI Debate Recordings</div>
              <div className="text-3xl font-bold text-green-400">{debateRecordings.length}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-white">
              <div className="text-sm text-blue-200">Completed</div>
              <div className="text-3xl font-bold text-green-400">{debateAnalytics.completedDebates}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-white">
              <div className="text-sm text-blue-200">Avg Duration</div>
              <div className="text-3xl font-bold text-purple-400">{Math.round(debateAnalytics.averageDuration / 60)}m</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-white">
              <div className="text-sm text-blue-200">Total Turns</div>
              <div className="text-3xl font-bold text-indigo-400">{debateAnalytics.totalTurns}</div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        {(feedbacks.length > 0 || debateRecordings.length > 0) ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/10 rounded-xl p-4"><Pie data={pieData} /></div>
              <div className="bg-white/10 rounded-xl p-4"><Line data={lineData} /></div>
            </div>

            <div className="bg-white/10 rounded-xl p-4"><Bar data={barData} /></div>
          </>
        ) : (
          <div className="bg-white/10 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">No Data Available</h3>
            <p className="text-blue-200 mb-4">Start practicing to see your detailed insights!</p>
            <div className="space-y-2 text-sm text-blue-300">
              <p>• Record debates in Debate Tournament</p>
              <p>• Practice pronunciation in Pronunciation Practice</p>
              <p>• Create JAM sessions in Recording Studio</p>
            </div>
          </div>
        )}

        {/* Debate Analytics Charts */}
        {debateAnalytics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/10 rounded-xl p-4">
                <h3 className="text-xl font-bold text-white mb-4">Popular Debate Topics</h3>
                <Bar data={debateTopicsData} />
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <h3 className="text-xl font-bold text-white mb-4">You vs AI Turns</h3>
                <Pie data={userVsAIData} />
              </div>
            </div>
            
            <div className="bg-white/10 rounded-xl p-4">
              <h3 className="text-xl font-bold text-white mb-4">Debate Activity (Last 7 Days)</h3>
              <Line data={debateActivityData} />
            </div>
          </>
        )}

        <div className="bg-white/10 rounded-xl p-4 text-white">
          <h3 className="text-xl font-bold mb-3">All Words</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {feedbacks.map((f, i) => (
              <div key={f.word + f.date + i} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">{f.word}</div>
                  <div className="text-xs text-blue-200">{new Date(f.date).toLocaleString()}</div>
                </div>
                <div className="text-blue-200 text-sm">Score: <span className="text-white font-bold">{f.score}</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Debates List */}
        {debates.length > 0 && (
          <div className="bg-white/10 rounded-xl p-4 text-white">
            <h3 className="text-xl font-bold mb-3">Recent Debates</h3>
            <div className="space-y-3">
              {debates.slice(0, 10).map((debate) => (
                <div key={debate.id} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-white">{debate.topic}</div>
                    <div className="text-xs text-blue-200">
                      {new Date(debate.created_at).toLocaleString()} • {debate.selected_rounds} rounds • {Math.round(debate.selected_time / 60)}m
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      debate.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                      debate.status === 'active' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {debate.status}
                    </div>
                    <div className="text-blue-200 text-sm">
                      {debateTurns.filter(t => t.debate_id === debate.id).length} turns
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Debate Recordings Section */}
        <div className="bg-white/10 rounded-xl p-6 text-white">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Recent Debate Recordings
          </h3>
          
          {loadingRecordings ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              <p className="text-blue-200 mt-2">Loading recordings...</p>
            </div>
          ) : debateRecordings.length > 0 ? (
            <div className="space-y-4">
              {debateRecordings.map((recording) => (
                <div key={recording.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold text-lg">{recording.topic}</h4>
                      <p className="text-gray-300 text-sm">
                        {new Date(recording.created_at).toLocaleDateString()} • {Math.round(recording.duration / 60)}:{(recording.duration % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = recording.audio_url;
                          link.download = `debate-${recording.topic}-${new Date(recording.created_at).toISOString().split('T')[0]}.webm`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: `Debate: ${recording.topic}`,
                              text: `Check out this AI debate about ${recording.topic}`,
                              url: recording.audio_url
                            });
                          } else {
                            navigator.clipboard.writeText(recording.audio_url);
                            alert('Recording URL copied to clipboard!');
                          }
                        }}
                        className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                        title="Share"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          const text = `Check out this AI debate about ${recording.topic}: ${recording.audio_url}`;
                          const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                          window.open(url, '_blank');
                        }}
                        className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        title="Share to WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          const subject = `AI Debate: ${recording.topic}`;
                          const body = `Hi,\n\nI wanted to share this AI debate about ${recording.topic} with you.\n\nRecording: ${recording.audio_url}\n\nBest regards`;
                          const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                          window.open(url);
                        }}
                        className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                        title="Share via Email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Audio Player */}
                  <div className="mt-3">
                    <audio 
                      controls 
                      className="w-full"
                      src={recording.audio_url}
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                  
                  {/* Arguments Preview */}
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-blue-500/10 rounded p-2">
                      <div className="text-blue-300 font-medium mb-1">PRO Argument</div>
                      <div className="text-blue-200 text-xs line-clamp-2">
                        {recording.pro_argument || 'No argument recorded'}
                      </div>
                    </div>
                    <div className="bg-purple-500/10 rounded p-2">
                      <div className="text-purple-300 font-medium mb-1">CON Argument</div>
                      <div className="text-purple-200 text-xs line-clamp-2">
                        {recording.con_argument || 'No argument recorded'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-blue-200">No debate recordings yet. Start a debate to see your recordings here!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const InsightsSingleCard = () => {
  const { feedbacks } = useFeedback();
  if (!feedbacks || feedbacks.length === 0) {
    return <div className="text-blue-200 text-base mt-8">No feedback yet. Practice words in Echo Match to see your insights!</div>;
  }
  const latest = feedbacks[feedbacks.length - 1];
  return <FeedbackCard feedback={latest} />;
};

export default Insights; 