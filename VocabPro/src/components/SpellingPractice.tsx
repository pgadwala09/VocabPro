import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Lightbulb, CheckCircle, XCircle, Timer, Star, Sparkles, Brain } from 'lucide-react';
// import { fetchSpellingWords } from '../lib/supabase';

function speakWord(word: string) {
  if ('speechSynthesis' in window) {
    const utter = new window.SpeechSynthesisUtterance(word);
    utter.rate = 0.85;
    utter.pitch = 1.1;
    utter.lang = 'en-US';
    window.speechSynthesis.speak(utter);
  }
}

const QUIZ_TIME = 60; // seconds

// Hardcoded quiz words for frontend-only development
const HARDCODED_WORDS = [
  { word: 'apple', syllables: 'ap-ple', rhyme: 'snapple', image: '' },
  { word: 'banana', syllables: 'ba-na-na', rhyme: 'bandana', image: '' },
  { word: 'orange', syllables: 'or-ange', rhyme: 'door hinge', image: '' },
];

const SpellingPractice: React.FC = () => {
  const [words, setWords] = useState<any[]>(HARDCODED_WORDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState('');
  const [showHint, setShowHint] = useState({ first: false, syll: false, rhyme: false, image: false });
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUIZ_TIME);
  const [quizActive, setQuizActive] = useState(true);
  const [showTip, setShowTip] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Removed useEffect for Supabase fetching

  useEffect(() => {
    if (!quizActive) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setQuizActive(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [quizActive]);

  useEffect(() => {
    if (feedback) {
      const timeout = setTimeout(() => setFeedback(null), 1200);
      return () => clearTimeout(timeout);
    }
  }, [feedback]);

  useEffect(() => {
    if (quizActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [current, quizActive]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
          <div className="text-white mt-4 font-semibold">Loading quiz words...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-2xl font-bold text-red-600 mb-2">{error}</div>
          <div className="text-gray-700">Please try again later.</div>
        </div>
      </div>
    );
  }

  if (!words.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-2xl font-bold text-gray-700 mb-2">No quiz words found.</div>
          <div className="text-gray-500">Please add words to the spelling_words table in Supabase.</div>
        </div>
      </div>
    );
  }

  const handlePlay = () => {
    speakWord(words[current].word);
  };

  const handleCheck = () => {
    if (!quizActive) return;
    if (input.trim().toLowerCase() === words[current].word.toLowerCase()) {
      setFeedback('correct');
      setScore((s) => s + 1);
      setTimeout(() => {
        setInput('');
        setShowHint({ first: false, syll: false, rhyme: false, image: false });
        setCurrent((c) => (c + 1) % words.length);
      }, 900);
    } else {
      setFeedback('incorrect');
      setShowTip(true);
      setTimeout(() => setShowTip(false), 1200);
    }
  };

  const handleInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCheck();
  };

  const restartQuiz = () => {
    setCurrent(0);
    setInput('');
    setScore(0);
    setTimeLeft(QUIZ_TIME);
    setQuizActive(true);
    setShowHint({ first: false, syll: false, rhyme: false, image: false });
    setFeedback(null);
    setShowTip(false);
  };

  const word = words[current];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center relative">
        <div className="flex items-center gap-4 mb-6">
          <Timer className="w-6 h-6 text-blue-500" />
          <span className="font-semibold text-lg">{timeLeft}s</span>
          <Star className="w-6 h-6 text-yellow-400 ml-6" />
          <span className="font-semibold text-lg">{score}</span>
        </div>
        <button
          className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-5 mb-4 shadow-lg hover:scale-105 transition-transform"
          onClick={handlePlay}
          aria-label="Play word"
        >
          <Volume2 className="w-10 h-10 text-white animate-pulse" />
        </button>
        <input
          ref={inputRef}
          type="text"
          className={`w-full text-center text-2xl border-2 rounded-lg py-3 px-4 mb-4 focus:outline-none transition-all ${feedback === 'incorrect' ? 'border-red-400 bg-red-50 shake' : 'border-blue-300 focus:border-purple-500 bg-white'}`}
          placeholder="Type what you hear..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleInputKey}
          disabled={!quizActive}
          autoComplete="off"
        />
        <div className="flex gap-2 mb-4">
          <button
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${showHint.first ? 'bg-purple-100 border-purple-400' : 'bg-white border-gray-300'} transition`}
            onClick={() => setShowHint(h => ({ ...h, first: !h.first }))}
            disabled={!quizActive}
          >
            <Lightbulb className="w-4 h-4" /> First Letter
          </button>
          <button
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${showHint.syll ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-300'} transition`}
            onClick={() => setShowHint(h => ({ ...h, syll: !h.syll }))}
            disabled={!quizActive}
          >
            <Lightbulb className="w-4 h-4" /> Syllables
          </button>
          <button
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${showHint.rhyme ? 'bg-green-100 border-green-400' : 'bg-white border-gray-300'} transition`}
            onClick={() => setShowHint(h => ({ ...h, rhyme: !h.rhyme }))}
            disabled={!quizActive}
          >
            <Lightbulb className="w-4 h-4" /> Rhyme
          </button>
          <button
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${showHint.image ? 'bg-yellow-100 border-yellow-400' : 'bg-white border-gray-300'} transition`}
            onClick={() => setShowHint(h => ({ ...h, image: !h.image }))}
            disabled={!quizActive}
          >
            <Lightbulb className="w-4 h-4" /> Image
          </button>
        </div>
        <div className="mb-4 min-h-[32px]">
          {showHint.first && (
            <span className="inline-block mr-3 text-purple-700 font-semibold">First letter: <span className="bg-purple-100 px-2 py-1 rounded">{word.word[0]}</span></span>
          )}
          {showHint.syll && (
            <span className="inline-block mr-3 text-blue-700 font-semibold">Syllables: <span className="bg-blue-100 px-2 py-1 rounded">{word.syllables}</span></span>
          )}
          {showHint.rhyme && (
            <span className="inline-block mr-3 text-green-700 font-semibold">Rhymes with: <span className="bg-green-100 px-2 py-1 rounded">{word.rhyme}</span></span>
          )}
          {showHint.image && (
            <img src={word.image} alt="Hint" className="inline-block w-12 h-12 rounded shadow border border-yellow-200 align-middle" />
          )}
        </div>
        <button
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl font-bold py-3 rounded-lg shadow-lg hover:scale-105 transition mb-2 flex items-center justify-center gap-2"
          onClick={handleCheck}
          disabled={!quizActive}
        >
          <CheckCircle className="w-6 h-6" /> Check
        </button>
        {feedback === 'correct' && (
          <div className="flex flex-col items-center mt-2 animate-bounce">
            <Sparkles className="w-10 h-10 text-green-500" />
            <span className="text-green-700 font-bold text-lg">Great job!</span>
          </div>
        )}
        {feedback === 'incorrect' && (
          <div className="flex flex-col items-center mt-2 animate-shake">
            <XCircle className="w-10 h-10 text-red-400" />
            <span className="text-red-700 font-bold text-lg">Try again!</span>
            {showTip && (
              <span className="text-sm text-gray-500 mt-1">Tip: Listen again or use a hint!</span>
            )}
          </div>
        )}
        {!quizActive && (
          <div className="flex flex-col items-center mt-6">
            <span className="text-2xl font-bold text-purple-700 mb-2">Quiz Over!</span>
            <span className="text-lg text-gray-700 mb-4">Your Score: <span className="font-bold text-blue-600">{score}</span></span>
            <button
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-2 rounded-lg font-semibold shadow hover:scale-105 transition"
              onClick={restartQuiz}
            >
              Restart
            </button>
          </div>
        )}
      </div>
      <style>{`
        .shake { animation: shake 0.3s; }
        @keyframes shake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default SpellingPractice; 