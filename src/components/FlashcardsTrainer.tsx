import React, { useState, useEffect } from 'react';
import { Volume2, Mic, Star, StarOff, ArrowLeft, ArrowRight, X, Pencil, ArrowUp, ArrowDown } from 'lucide-react';

const SAMPLE_WORDS = [
  {
    word: 'Eloquent',
    image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    meaning: 'Fluent or persuasive in speaking.',
    sentence: 'The mayor gave an eloquent speech about the importance of community.',
    isCustom: false,
  },
  {
    word: 'Brisk',
    image: 'https://cdn-icons-png.flaticon.com/512/168/168726.png',
    meaning: 'Quick and energetic.',
    sentence: 'He took a brisk walk every morning.',
    isCustom: false,
  },
  {
    word: 'Illuminate',
    image: 'https://cdn-icons-png.flaticon.com/512/616/616494.png',
    meaning: 'To light up or make clear.',
    sentence: 'The lanterns illuminate the path at night.',
    isCustom: false,
  },
];

const LOCAL_KEY = 'vocabpro_custom_words_v2';

const FlashcardTrainer: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [mastered, setMastered] = useState<number[]>([]);
  const [feedback, setFeedback] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [streak, setStreak] = useState(0);
  const [mode, setMode] = useState<'vocab' | 'custom'>('vocab');
  const [customWords, setCustomWords] = useState<any[]>(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [customInput, setCustomInput] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  useEffect(() => {
    if (mode === 'custom') {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(customWords));
    }
  }, [customWords, mode]);

  const cards = mode === 'vocab' ? SAMPLE_WORDS : customWords;
  const card = cards[current] || {};

  // Play pronunciation (TTS)
  const playAudio = () => {
    if ('speechSynthesis' in window && card.word) {
      setIsSpeaking(true);
      const utter = new window.SpeechSynthesisUtterance(card.word);
      utter.lang = 'en-US';
      utter.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utter);
    }
  };

  // Simulate AI feedback for demo
  const handleSpeakRepeat = () => {
    setIsRecording(true);
    setTimeout(() => {
      const good = Math.random() > 0.3;
      setFeedback(good ? 'Good clarity!' : 'Try again');
      setIsRecording(false);
      setStreak(good ? streak + 1 : 0);
    }, 1200);
  };

  // Navigation
  const handlePrev = () => {
    setFeedback('');
    setCurrent((prev) => (prev - 1 + cards.length) % cards.length);
  };
  const handleNext = () => {
    setFeedback('');
    setCurrent((prev) => (prev + 1) % cards.length);
  };

  // Mark as mastered
  const toggleMastered = () => {
    setMastered((prev) =>
      prev.includes(current)
        ? prev.filter((i) => i !== current)
        : [...prev, current]
    );
  };

  // Add custom word
  const handleAddCustom = () => {
    const word = customInput.trim();
    if (!word) return;
    setCustomWords(prev => [...prev, {
      word,
      image: 'https://cdn-icons-png.flaticon.com/512/616/616494.png',
      meaning: `AI-generated meaning for "${word}"`,
      sentence: `This is an AI-generated sentence for "${word}".`,
      isCustom: true,
    }]);
    setCustomInput('');
    setTimeout(() => setCurrent(customWords.length), 100); // Go to new word
  };

  // Remove custom word
  const handleRemoveCustom = (idx: number) => {
    setCustomWords(prev => prev.filter((_, i) => i !== idx));
    setCurrent(0);
  };

  // Edit custom word
  const handleEditCustom = (idx: number) => {
    setEditingIdx(idx);
    setEditingValue(customWords[idx].word);
  };
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingValue(e.target.value);
  };
  const handleEditSave = (idx: number) => {
    const newWord = editingValue.trim();
    if (!newWord) {
      setEditingIdx(null);
      setEditingValue('');
      return;
    }
    setCustomWords(prev => prev.map((w, i) => i === idx ? { ...w, word: newWord } : w));
    setEditingIdx(null);
    setEditingValue('');
    setTimeout(() => setCurrent(idx), 100);
  };

  // Move custom word up
  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    setCustomWords(prev => {
      const arr = [...prev];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return arr;
    });
    setCurrent(idx - 1);
  };
  // Move custom word down
  const handleMoveDown = (idx: number) => {
    if (idx === customWords.length - 1) return;
    setCustomWords(prev => {
      const arr = [...prev];
      [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
      return arr;
    });
    setCurrent(idx + 1);
  };

  return <div style={{ fontSize: 32, color: 'red' }}>Hello from FlashcardTrainer</div>;
};

export default FlashcardTrainer; 