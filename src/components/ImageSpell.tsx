import React, { useState, useEffect, useRef } from 'react';
import { Mic, CheckCircle, XCircle, Timer, Star, Sparkles } from 'lucide-react';

const IMAGE_WORDS = [
  { word: 'apple', image: 'https://img.icons8.com/color/480/apple.png' },
  { word: 'rainbow', image: 'https://img.icons8.com/color/480/rainbow.png' },
  { word: 'elephant', image: 'https://img.icons8.com/color/480/elephant.png' },
];
const TOTAL_QUESTIONS = 10;
const QUIZ_TIME = 30;

function shuffle<T>(arr: T[]): T[] {
  return arr
    .map((v) => [Math.random(), v] as [number, T])
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => v);
}

const ImageSpell: React.FC = () => {
  // Shuffle the words once at the start
  const [shuffledWords, setShuffledWords] = useState(() => shuffle([...IMAGE_WORDS]));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState(1);
  const [timer, setTimer] = useState(QUIZ_TIME);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'almost' | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timer > 0) {
      timerRef.current = setTimeout(() => setTimer(timer - 1), 1000);
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
  }, [currentIndex]);

  const currentWord = shuffledWords[currentIndex % shuffledWords.length];

  const handleCheck = () => {
    if (input.trim().toLowerCase() === currentWord.word.toLowerCase()) {
      setFeedback('correct');
      setScore((s) => s + 1);
      setTimeout(() => {
        setInput('');
        setQuestion((q) => q + 1);
        setCurrentIndex((i) => (i + 1) % shuffledWords.length);
        setFeedback(null);
        setTimer(QUIZ_TIME);
      }, 900);
    } else if (input.trim().length > 1 && currentWord.word.startsWith(input.trim().toLowerCase())) {
      setFeedback('almost');
      setTimeout(() => setFeedback(null), 1200);
    } else {
      setFeedback('incorrect');
      setTimeout(() => setFeedback(null), 1200);
    }
  };

  const handleInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCheck();
  };

  // Placeholder for voice button
  const handleVoice = () => {
    // Optionally implement speech-to-text
    alert('Voice input coming soon!');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center relative">
        <h2 className="text-3xl font-extrabold text-purple-800 mb-4 tracking-tight text-center rounded-xl bg-purple-100 px-6 py-2">Image Spell Mode</h2>
        {/* Large Central Image */}
        <img src={currentWord.image} alt="spell" className="w-48 h-48 object-contain rounded-2xl shadow mb-6 bg-gradient-to-br from-pink-100 to-yellow-100" />
        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          className={`w-full text-center text-2xl font-bold border-0 rounded-2xl py-3 px-4 mb-4 shadow focus:outline-none transition-all ${feedback === 'incorrect' ? 'bg-red-100 text-red-600' : feedback === 'almost' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}
          placeholder="Guess the word"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleInputKey}
          autoComplete="off"
        />
        {/* Voice Button, Timer, Score */}
        <div className="flex flex-row items-center justify-between w-full mb-4 gap-4">
          <button
            className="bg-blue-500 hover:bg-blue-600 rounded-full p-3 shadow flex items-center justify-center"
            aria-label="Voice input"
            onClick={handleVoice}
          >
            <Mic className="w-7 h-7 text-white" />
          </button>
          <div className="flex flex-col items-center">
            <span className="flex items-center gap-1 text-lg font-bold text-blue-900"><Timer className="w-5 h-5" /> {String(timer).padStart(2, '0')}</span>
            <span className="flex items-center gap-1 text-lg font-bold text-blue-900"><Star className="w-5 h-5 text-yellow-400" /> {question}/{TOTAL_QUESTIONS}</span>
          </div>
        </div>
        {/* Check Button */}
        <button
          className={`w-full py-3 rounded-2xl text-2xl font-bold shadow transition-all ${feedback === 'correct' ? 'bg-green-400 text-green-900' : 'bg-green-500 hover:bg-green-600 text-white'}`}
          onClick={handleCheck}
        >
          Check <CheckCircle className="inline w-7 h-7 ml-2 align-middle" />
        </button>
        {/* Feedback Animations */}
        {feedback === 'correct' && (
          <div className="flex flex-col items-center mt-4 animate-bounce">
            <span className="text-green-700 font-bold text-lg">Correct!</span>
            {showConfetti && <Sparkles className="w-10 h-10 text-yellow-400 animate-spin" />}
          </div>
        )}
        {feedback === 'almost' && (
          <div className="flex flex-col items-center mt-4 animate-pulse">
            <span className="text-yellow-700 font-bold text-lg">Almost there!</span>
          </div>
        )}
        {feedback === 'incorrect' && (
          <div className="flex flex-col items-center mt-4 animate-shake">
            <XCircle className="w-10 h-10 text-red-400 mb-2" />
            <span className="text-red-700 font-bold text-lg">Try again!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageSpell; 