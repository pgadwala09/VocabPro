import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Lightbulb, CheckCircle, XCircle, Timer, Star, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QUIZ_TIME = 60;
const QUIZ_WORDS = [
  { word: 'elephant', syllables: 'el-e-phant', rhyme: 'relevant', image: '' },
  { word: 'giraffe', syllables: 'gi-raffe', rhyme: 'staff', image: '' },
  { word: 'umbrella', syllables: 'um-brel-la', rhyme: 'fella', image: '' },
];

function speakWord(word: string) {
  if ('speechSynthesis' in window) {
    const utter = new window.SpeechSynthesisUtterance(word);
    utter.lang = 'en-US';
    window.speechSynthesis.speak(utter);
  }
}

const DictationQuiz: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(QUIZ_TIME);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showHint, setShowHint] = useState({ first: false, syll: false, rhyme: false, image: false });
  const [showConfetti, setShowConfetti] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (timer > 0) {
      timerRef.current = setTimeout(() => setTimer(timer - 1), 1000);
    } else {
      clearTimeout(timerRef.current!);
    }
    return () => clearTimeout(timerRef.current!);
  }, [timer]);

  useEffect(() => {
    if (feedback === 'correct') {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 1200);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [current]);

  const wordObj = QUIZ_WORDS[current % QUIZ_WORDS.length];

  const handlePlay = () => {
    speakWord(wordObj.word);
  };

  const handleCheck = () => {
    if (input.trim().toLowerCase() === wordObj.word.toLowerCase()) {
      setFeedback('correct');
      setScore((s) => s + 1);
      setTimeout(() => {
        setInput('');
        setShowHint({ first: false, syll: false, rhyme: false, image: false });
        setCurrent((c) => c + 1);
        setFeedback(null);
      }, 900);
    } else {
      setFeedback('incorrect');
      setTimeout(() => setFeedback(null), 1200);
    }
  };

  const handleInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCheck();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 px-4 py-8">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-10 flex flex-col items-center relative">
        <h2 className="text-3xl font-bold text-purple-900 mb-6">Dictation Quiz</h2>
        {/* Speaker Button */}
        <button
          className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-6 mb-6 shadow-lg hover:scale-105 transition-transform"
          onClick={handlePlay}
          aria-label="Play word"
        >
          <Volume2 className="w-12 h-12 text-white animate-pulse" />
        </button>
        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          className={`w-full text-center text-2xl border-2 rounded-lg py-3 px-4 mb-4 focus:outline-none transition-all ${feedback === 'incorrect' ? 'border-red-400 bg-red-50 shake' : 'border-blue-300 focus:border-purple-500 bg-white'}`}
          placeholder="Type the word you hear..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleInputKey}
          autoComplete="off"
        />
        {/* Hints */}
        <div className="flex gap-2 mb-4">
          <button
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${showHint.first ? 'bg-purple-100 border-purple-400' : 'bg-white border-gray-300'} transition`}
            onClick={() => setShowHint(h => ({ ...h, first: !h.first }))}
          >
            <Lightbulb className="w-4 h-4" /> First Letter
          </button>
          <button
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${showHint.syll ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-300'} transition`}
            onClick={() => setShowHint(h => ({ ...h, syll: !h.syll }))}
          >
            <Lightbulb className="w-4 h-4" /> Syllables
          </button>
          <button
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${showHint.rhyme ? 'bg-green-100 border-green-400' : 'bg-white border-gray-300'} transition`}
            onClick={() => setShowHint(h => ({ ...h, rhyme: !h.rhyme }))}
          >
            <Lightbulb className="w-4 h-4" /> Rhyme
          </button>
        </div>
        {/* Show Hints */}
        <div className="mb-4 text-center min-h-[24px]">
          {showHint.first && (
            <div className="text-purple-700 font-semibold">First letter: {wordObj.word[0]}</div>
          )}
          {showHint.syll && (
            <div className="text-blue-700 font-semibold">Syllables: {wordObj.syllables}</div>
          )}
          {showHint.rhyme && (
            <div className="text-green-700 font-semibold">Rhymes with: {wordObj.rhyme}</div>
          )}
        </div>
        {/* Check Button */}
        <button
          className="w-full bg-gradient-to-r from-green-400 to-blue-400 hover:from-green-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl text-lg shadow mb-4"
          onClick={handleCheck}
        >
          Check
        </button>
        {/* Timer and Score */}
        <div className="flex flex-row items-center justify-center gap-8 mt-2 mb-2">
          <div className="flex items-center gap-2">
            <Timer className="w-6 h-6 text-blue-500" />
            <span className="font-semibold text-lg">{String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-400" />
            <span className="font-semibold text-lg">{score}</span>
          </div>
        </div>
        {/* Feedback Animations */}
        {feedback === 'correct' && (
          <div className="flex flex-col items-center mt-2 animate-bounce">
            <CheckCircle className="w-10 h-10 text-green-500 mb-2" />
            <span className="text-green-700 font-bold text-lg">Correct!</span>
            {showConfetti && <Sparkles className="w-8 h-8 text-yellow-400 animate-spin" />}
          </div>
        )}
        {feedback === 'incorrect' && (
          <div className="flex flex-col items-center mt-2 animate-shake">
            <XCircle className="w-10 h-10 text-red-500 mb-2" />
            <span className="text-red-700 font-bold text-lg">Try again!</span>
          </div>
        )}
      </div>
      {/* Next Section Button */}
      <button
        className="mt-10 bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-4 rounded-xl text-lg shadow"
        onClick={() => navigate('/spelling-practice')}
      >
        Next
      </button>
    </div>
  );
};

export default DictationQuiz; 