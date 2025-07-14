import React, { useState, useEffect } from 'react';
import { Mic, CheckCircle, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useVocabulary } from '../hooks/VocabularyContext';

// Add speakWord function for text-to-speech
function speakWord(word: string) {
  if ('speechSynthesis' in window) {
    const utter = new window.SpeechSynthesisUtterance(word);
    utter.lang = 'en-US';
    window.speechSynthesis.speak(utter);
  }
}

const MODES = [
  { label: 'Dictation Quiz', color: 'from-blue-500 to-blue-400', text: 'text-white' },
  { label: 'Word Flashcards', color: 'from-purple-500 to-purple-400', text: 'text-white' },
  { label: 'Image Spell', color: 'from-green-400 to-yellow-300', text: 'text-gray-900' }
] as const;
type Mode = typeof MODES[number]['label'];

const QUIZ_TIME = 60;
const AI_WORDS = [
  { word: 'elephant', image: 'https://images.pexels.com/photos/674010/pexels-photo-674010.jpeg?auto=compress&w=200&h=200&fit=crop' },
  { word: 'giraffe', image: 'https://images.pexels.com/photos/667205/pexels-photo-667205.jpeg?auto=compress&w=200&h=200&fit=crop' },
  { word: 'umbrella', image: 'https://images.pexels.com/photos/532220/pexels-photo-532220.jpeg?auto=compress&w=200&h=200&fit=crop' },
];

function shuffle<T>(arr: T[]): T[] {
  return arr
    .map((v) => [Math.random(), v] as [number, T])
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => v);
}

const SpellingPracticeTrainer: React.FC = () => {
  const [mode, setMode] = useState<Mode>('Image Spell');
  const [input, setInput] = useState('');
  const [timer, setTimer] = useState(QUIZ_TIME);
  const [score, setScore] = useState(0);
  const navigate = useNavigate();
  const { vocabList } = useVocabulary();

  // Get last 5 user words (most recent first)
  const userWords = vocabList.slice(-5).reverse().map(w => ({ word: w.word, image: undefined }));
  // Combine with AI words and shuffle
  const quizWords = shuffle([...userWords, ...AI_WORDS]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer]);

  const SPELLING_WORD = quizWords[current % quizWords.length] || { word: '', image: '' };

  // Auto-play the word when a new word appears
  useEffect(() => {
    if (SPELLING_WORD.word) {
      speakWord(SPELLING_WORD.word);
    }
    // eslint-disable-next-line
  }, [current]);

  const handleCheck = () => {
    if (input.trim().toLowerCase() === SPELLING_WORD.word.toLowerCase()) {
      setScore(score + 1);
      setInput('');
      setTimer(QUIZ_TIME);
      setCurrent((c) => c + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex justify-center mt-8 mb-10">
        <div className="bg-white/70 rounded-xl px-12 py-3 shadow">
          <h1 className="text-4xl font-bold text-purple-900 tracking-tight text-center">Spelling Practice</h1>
        </div>
      </div>
      {/* Main Card Row */}
      <div className="flex flex-row gap-8 w-full max-w-6xl mb-8 mt-8">
        {/* Main Card */}
        <div className="flex flex-col w-[700px] h-[540px] bg-gradient-to-br from-blue-800 to-blue-600 border-2 border-white rounded-2xl p-0 relative" style={{boxShadow: '0 4px 40px 0 rgba(0,0,0,0.15)'}}>
          {/* Tabs */}
          <div className="flex gap-4 justify-center mt-8 mb-8">
            {MODES.map((m) => (
              <button
                key={m.label}
                className={`px-7 py-2 rounded-lg font-bold text-lg shadow transition-all duration-200
                  ${mode === m.label
                    ? `bg-gradient-to-r ${m.color} ${m.text}`
                    : 'bg-white text-blue-900 hover:bg-blue-50'}
                `}
                onClick={() => {
                  if (m.label === 'Dictation Quiz') {
                    navigate('/dictation-quiz');
                  } else {
                    setMode(m.label);
                  }
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
          {/* Practice Area */}
          <div className="flex flex-row gap-8 justify-center items-center flex-1 px-10">
            {/* Practice Card */}
            <div className="flex flex-col items-center bg-blue-900 rounded-2xl p-8 w-[270px] h-[340px] shadow-lg">
              {SPELLING_WORD.image && (
                <img src={SPELLING_WORD.image} alt={SPELLING_WORD.word} className="w-32 h-32 object-contain rounded-xl bg-white mb-6" />
              )}
              {/* Play (🔊) button to speak the word */}
              <button
                className="bg-purple-500 hover:bg-purple-600 rounded-full p-3 shadow mb-4"
                aria-label="Play word"
                onClick={() => speakWord(SPELLING_WORD.word)}
              >
                <span role="img" aria-label="speaker">🔊</span>
              </button>
              <input
                className="text-2xl px-4 py-2 rounded-lg border-none font-bold text-center bg-white w-full mb-4"
                placeholder="Type the word..."
                value={input}
                onChange={e => setInput(e.target.value)}
                autoFocus
              />
              <button className="bg-blue-600 hover:bg-blue-700 rounded-full p-3 shadow mb-4" aria-label="Speech to text">
                <Mic className="w-7 h-7 text-white" />
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-xl text-lg shadow w-full" onClick={handleCheck}>
                Check
              </button>
            </div>
            {/* Timer/Score/Check */}
            <div className="flex flex-col items-center justify-center gap-6">
              <h2 className="text-2xl font-bold text-white mb-2">Spelling Practice</h2>
              <div className="flex flex-row items-center gap-2">
                <Timer className="w-7 h-7 text-white" />
                <span className="text-2xl font-bold text-white">
                  {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
                </span>
              </div>
              <div className="bg-white rounded-xl px-6 py-2 text-2xl font-bold text-blue-900 shadow mb-2">
                {score}
              </div>
              <button className="bg-green-400 hover:bg-green-500 text-green-900 font-bold px-8 py-3 rounded-xl text-xl shadow flex items-center gap-2 w-full justify-center" onClick={handleCheck}>
                Check <CheckCircle className="w-6 h-6" />
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl text-xl shadow flex items-center gap-2 w-full justify-center" onClick={handleCheck}>
                Check
              </button>
            </div>
          </div>
        </div>
        {/* Insights Panel */}
        <div className="flex flex-col items-center justify-start w-[220px] h-[540px] bg-gradient-to-br from-purple-400 to-blue-400 border-2 border-white rounded-2xl p-8 shadow-lg mt-2">
          <div className="flex flex-row items-center gap-2 mb-4">
            <span className="text-yellow-400 text-2xl">💡</span>
            <h2 className="text-2xl font-bold text-white">Learn Insights</h2>
          </div>
          <p className="text-white text-base mb-6">Get tips and feedback on your spelling skills.</p>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-lg shadow transition-all duration-200">
            View Insights
          </button>
        </div>
      </div>
      {/* Recent Activity Section */}
      <div className="w-full max-w-4xl mt-8">
        <div className="flex items-center mb-4">
          <span className="text-xl font-bold text-white mr-3">Recent Activity</span>
          <span className="text-base text-blue-200">- Words you have entered</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {userWords.map((item, idx) => (
            <div
              key={item.word + idx}
              className="flex flex-col bg-gray-100 rounded-lg shadow p-4 gap-2 border-2 border-blue-200"
            >
              <span className="font-semibold text-gray-800 text-lg">{item.word}</span>
              <span className="text-xs text-gray-500 capitalize">Text</span>
            </div>
          ))}
          {userWords.length === 0 && (
            <div className="col-span-5 text-center text-gray-400 py-8">No recent activity.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpellingPracticeTrainer; 