import React, { useState, useEffect } from 'react';
import { Volume2, Mic, Star, StarOff, ArrowLeft, ArrowRight, X, Pencil, ArrowUp, ArrowDown, Camera } from 'lucide-react';
import { useVocabulary } from '../hooks/VocabularyContext';

const LOCAL_KEY = 'vocabpro_custom_words_v2';

const FlashcardTrainer: React.FC = () => {
  const { vocabList } = useVocabulary();
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
  const [loadingCustom, setLoadingCustom] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'custom') {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(customWords));
    }
  }, [customWords, mode]);

  const cards = mode === 'vocab' ? vocabList : customWords;
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

  // Add custom word with dictionary lookup
  const handleAddCustom = async () => {
    const word = customInput.trim();
    if (!word) return;
    setLoadingCustom(true);
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const data = await res.json();
      let meaning = '';
      let sentence = '';
      let image = 'https://cdn-icons-png.flaticon.com/512/616/616494.png'; // default image
      if (Array.isArray(data) && data[0]?.meanings) {
        for (const meaningObj of data[0].meanings) {
          for (const def of meaningObj.definitions) {
            if (!meaning && def.definition) meaning = def.definition;
            if (!sentence && def.example) sentence = def.example;
            if (meaning && sentence) break;
          }
          if (meaning && sentence) break;
        }
      }
      // Fetch a word-related image from Unsplash
      try {
        const imgRes = await fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(word)}&client_id=YOUR_UNSPLASH_ACCESS_KEY&orientation=squarish`);
        const imgData = await imgRes.json();
        if (imgData && imgData.urls && imgData.urls.small) {
          image = imgData.urls.small;
        }
      } catch (imgErr) {
        // fallback to default image
      }
      if (!meaning) meaning = `AI-generated meaning for "${word}"`;
      if (!sentence) sentence = `This is an AI-generated sentence for "${word}".`;
      setCustomWords(prev => [...prev, {
        word,
        image,
        meaning,
        sentence,
        isCustom: true,
      }]);
    } catch (e) {
      setCustomWords(prev => [...prev, {
        word,
        image: 'https://cdn-icons-png.flaticon.com/512/616/616494.png',
        meaning: `AI-generated meaning for "${word}"`,
        sentence: `This is an AI-generated sentence for "${word}".`,
        isCustom: true,
      }]);
    }
    setCustomInput('');
    setLoadingCustom(false);
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

  // Add this handler to update image for current card
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (mode === 'custom') {
        setCustomWords(prev => prev.map((w, i) => i === current ? { ...w, image: dataUrl } : w));
      } else {
        // vocabList is from context, so we need to update it via setVocabList if available
        if (typeof window !== 'undefined' && window.localStorage) {
          // Try to update in localStorage if needed, but context update is preferred
        }
        // Not implemented: vocabList image update (context is read-only here)
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200 p-4">
      <div className="w-full max-w-xs mx-auto bg-white rounded-3xl shadow-2xl p-6 flex flex-col items-center relative transition-all duration-500">
        {/* Mode Switch */}
        <div className="flex gap-4 mb-4">
          <button onClick={() => { setMode('vocab'); setCurrent(0); }} className={`px-4 py-2 rounded-lg font-bold ${mode === 'vocab' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-900'}`}>Vocabulary Words</button>
          <button onClick={() => { setMode('custom'); setCurrent(0); }} className={`px-4 py-2 rounded-lg font-bold ${mode === 'custom' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-900'}`}>Custom Words</button>
        </div>
        {/* Add custom word */}
        {mode === 'custom' && (
          <div className="w-full flex flex-col items-center mb-4">
            <div className="flex w-full gap-2 mb-2">
              <input
                className="flex-1 border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Add a word (e.g. serendipity)"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddCustom(); }}
                disabled={loadingCustom}
              />
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700"
                onClick={handleAddCustom}
                disabled={loadingCustom}
              >{loadingCustom ? 'Adding...' : 'Add'}</button>
            </div>
            {/* List custom words for removal and editing */}
            <div className="flex flex-wrap gap-2 w-full justify-center">
              {customWords.map((w, idx) => (
                <span key={w.word + idx} className={`flex items-center px-2 py-1 rounded bg-blue-100 text-blue-900 text-xs font-semibold ${idx === current ? 'ring-2 ring-blue-400' : ''}`}>
                  <div className="flex items-center gap-1">
                    <button className="text-gray-400 hover:text-blue-700 disabled:opacity-30" onClick={() => handleMoveUp(idx)} disabled={idx === 0} title="Move up">
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button className="text-gray-400 hover:text-blue-700 disabled:opacity-30" onClick={() => handleMoveDown(idx)} disabled={idx === customWords.length - 1} title="Move down">
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                  {editingIdx === idx ? (
                    <input
                      className="w-20 px-1 py-0.5 rounded border border-blue-300 text-xs font-semibold mr-1"
                      value={editingValue}
                      autoFocus
                      onChange={handleEditChange}
                      onBlur={() => handleEditSave(idx)}
                      onKeyDown={e => { if (e.key === 'Enter') handleEditSave(idx); if (e.key === 'Escape') { setEditingIdx(null); setEditingValue(''); } }}
                    />
                  ) : (
                    <>
                      {w.word}
                      <button className="ml-1 text-blue-500 hover:text-blue-700" onClick={() => handleEditCustom(idx)} title="Edit">
                        <Pencil className="w-3 h-3" />
                      </button>
                    </>
                  )}
                  <button className="ml-1 text-red-500 hover:text-red-700" onClick={() => handleRemoveCustom(idx)} title="Remove">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
        {/* Image */}
        {/* Removed image and camera button */}
        {/* Word Title */}
        <h2 className="text-3xl font-extrabold text-blue-900 mb-2 text-center">{card.word}</h2>
        {/* Meaning */}
        <div className="text-lg text-blue-800 text-center mb-2"><b>Meaning</b><br />{card.meaning}</div>
        {/* Sample Sentence */}
        <div className="text-base text-gray-700 text-center mb-4"><b>Sample sentence</b><br />{card.sentence}</div>
        {/* Audio & Speak/Repeat */}
        <div className="flex flex-row items-center justify-center gap-6 mb-4 w-full">
          <button
            className={`bg-blue-100 hover:bg-blue-200 rounded-full w-14 h-14 flex items-center justify-center shadow ${isSpeaking ? 'animate-pulse' : ''}`}
            onClick={playAudio}
            aria-label="Play pronunciation"
          >
            <Volume2 className="w-7 h-7 text-blue-700" />
          </button>
          <button
            className={`bg-purple-100 hover:bg-purple-200 rounded-full w-14 h-14 flex items-center justify-center shadow ${isRecording ? 'animate-pulse' : ''}`}
            onClick={handleSpeakRepeat}
            aria-label="Speak and repeat"
            disabled={isRecording}
          >
            <Mic className="w-7 h-7 text-purple-700" />
          </button>
        </div>
        {/* Feedback */}
        {feedback && (
          <div className={`mt-2 text-lg font-bold ${feedback === 'Good clarity!' ? 'text-green-600' : 'text-red-500'}`}>{feedback}</div>
        )}
        {/* Gamified streak */}
        {streak > 1 && (
          <div className="mt-2 text-yellow-500 font-bold text-base">🔥 {streak} in a row correct!</div>
        )}
        {/* Progress Controls */}
        <div className="flex flex-row items-center justify-between w-full mt-6">
          <button onClick={handlePrev} className="bg-gray-100 hover:bg-gray-200 rounded-full p-3 shadow">
            <ArrowLeft className="w-6 h-6 text-blue-700" />
          </button>
          <button onClick={toggleMastered} className="bg-white border-2 border-blue-200 rounded-full p-3 shadow mx-2">
            {mastered.includes(current) ? <Star className="w-6 h-6 text-yellow-400 fill-yellow-300" /> : <StarOff className="w-6 h-6 text-gray-400" />}
          </button>
          <button onClick={handleNext} className="bg-gray-100 hover:bg-gray-200 rounded-full p-3 shadow">
            <ArrowRight className="w-6 h-6 text-blue-700" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardTrainer; 