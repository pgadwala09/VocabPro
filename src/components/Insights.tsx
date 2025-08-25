import React, { useMemo, useState, useEffect } from 'react';
import { useFeedback } from '../hooks/FeedbackContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Pie, Bar, Line } from 'react-chartjs-2';
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

  useEffect(() => {
    const q = new URLSearchParams(location.search).get('report') === '1';
    setShowReport(q);
  }, [location.search]);

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

  if (!showReport) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 py-12 px-4 relative z-40">
        <div className="max-w-md mx-auto relative z-40 pointer-events-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-yellow-400 text-indigo-900 font-extrabold flex items-center justify-center">🧠</div>
            <h1 className="text-3xl font-extrabold text-white">Learn Insights</h1>
          </div>
          <p className="text-blue-200 mb-6">Track your pronunciation progress and get personalized feedback to improve your speaking skills.</p>
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
          </div>
          <button
            type="button"
            onClick={() => navigate('/insights?report=1', { replace: false })}
            className="mt-8 w-full px-6 py-3 rounded-xl bg-blue-600 text-white font-bold shadow hover:bg-blue-500 cursor-pointer relative z-50"
          >
            View Detailed Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-extrabold text-white">Detailed Report</h2>
          <button onClick={() => navigate('/insights', { replace: true })} className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20">Back</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 rounded-xl p-4 text-white"><div className="text-sm text-blue-200">Avg Clarity</div><div className="text-3xl font-bold">{totals.avgClarity}%</div></div>
          <div className="bg-white/10 rounded-xl p-4 text-white"><div className="text-sm text-blue-200">Avg Stress</div><div className="text-3xl font-bold">{totals.avgStress}%</div></div>
          <div className="bg-white/10 rounded-xl p-4 text-white"><div className="text-sm text-blue-200">Avg Pace</div><div className="text-3xl font-bold">{totals.avgPace}%</div></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 rounded-xl p-4"><Pie data={pieData} /></div>
          <div className="bg-white/10 rounded-xl p-4"><Line data={lineData} /></div>
        </div>

        <div className="bg-white/10 rounded-xl p-4"><Bar data={barData} /></div>

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

<<<<<<< HEAD
export default Insights; 

=======
export default Insights; 
>>>>>>> origin/main
