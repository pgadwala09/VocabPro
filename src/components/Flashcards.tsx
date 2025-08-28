import React, { useState, useRef, useEffect } from 'react';
import { Volume2, ArrowRight, ArrowLeft, Mic, Play, Mic as MicIcon, RefreshCw } from 'lucide-react';
import { useVocabulary, VocabWord } from '../hooks/VocabularyContext';
import { useNavigate } from 'react-router-dom';

// Simple emoji/icon picker for demo
const getWordEmoji = (word: string) => {
  const lower = word.toLowerCase();
  if (lower.includes('garden')) return '🌻';
  if (lower.includes('apple')) return '🍎';
  if (lower.includes('vase')) return '🏺';
  if (lower.includes('cat')) return '🐱';
  if (lower.includes('dog')) return '🐶';
  if (lower.includes('book')) return '📚';
  if (lower.includes('car')) return '🚗';
  if (lower.includes('tree')) return '🌳';
  if (lower.includes('flower')) return '🌸';
  return '🃏';
};

interface FlashcardsProps {
  compact?: boolean;
}

const Flashcards: React.FC<FlashcardsProps> = ({ compact = false }) => {
  const { vocabList, setVocabList } = useVocabulary();
  const navigate = useNavigate();
  
  // Debug logging to see what's in the vocabulary list
  console.log('Flashcards - Current vocabList:', vocabList);
  console.log('Flashcards - Number of words:', vocabList.length);
  
  // Effect to reset current index when vocabList changes
  useEffect(() => {
    if (vocabList.length > 0 && current >= vocabList.length) {
      setCurrent(0);
    }
  }, [vocabList, current]);
  
  const [current, setCurrent] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<'vocab' | 'custom'>('vocab');
  const [customInput, setCustomInput] = useState('');
  const [customCards, setCustomCards] = useState<VocabWord[]>([]);
  const [showAddWord, setShowAddWord] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newSentence, setNewSentence] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Choose which list to use
  const cards = mode === 'vocab' ? vocabList : customCards;
  
  // Add sample words if vocabulary list is empty
  useEffect(() => {
    if (vocabList.length === 0) {
      const sampleWords: VocabWord[] = [
        {
          word: 'meticulous',
          meaning: 'Showing great attention to detail; very careful and precise.',
          sentence: 'She was meticulous in her research, checking every source twice.'
        },
        {
          word: 'ubiquitous',
          meaning: 'Present, appearing, or found everywhere.',
          sentence: 'Smartphones have become ubiquitous in modern society.'
        },
        {
          word: 'serendipity',
          meaning: 'The occurrence and development of events by chance in a happy or beneficial way.',
          sentence: 'Finding that job was pure serendipity.'
        },
        {
          word: 'ephemeral',
          meaning: 'Lasting for a very short time; transitory.',
          sentence: 'The beauty of cherry blossoms is ephemeral.'
        },
        {
          word: 'eloquent',
          meaning: 'Fluent or persuasive in speaking or writing.',
          sentence: 'Her eloquent speech moved the entire audience.'
        }
      ];
      setVocabList(sampleWords);
      console.log('Added sample words to vocabulary list');
    }
  }, [vocabList.length, setVocabList]);
  
  // Function to refresh vocabulary list from localStorage
  const refreshVocabList = () => {
    try {
      const stored = localStorage.getItem('vocabList');
      if (stored) {
        const parsedList = JSON.parse(stored);
        console.log('Refreshed vocab list from localStorage:', parsedList);
        // Force a re-render by updating the context
        setVocabList([...parsedList]);
      }
    } catch (error) {
      console.error('Error refreshing vocab list:', error);
    }
  };

  // Function to add test word (for debugging)
  const addTestWord = () => {
    const testWord: VocabWord = {
      word: 'meticulous',
      meaning: 'Showing great attention to detail; very careful and precise.',
      sentence: 'She was meticulous in her research, checking every source twice.'
    };
    const updatedList = [...vocabList, testWord];
    setVocabList(updatedList);
    console.log('Added test word "meticulous" to vocabulary list');
  };

  // Function to add a new word
  const handleAddWord = () => {
    if (newWord.trim() && newMeaning.trim() && newSentence.trim()) {
      const wordToAdd: VocabWord = {
        word: newWord.trim(),
        meaning: newMeaning.trim(),
        sentence: newSentence.trim()
      };
      const updatedList = [...vocabList, wordToAdd];
      setVocabList(updatedList);
      setNewWord('');
      setNewMeaning('');
      setNewSentence('');
      setShowAddWord(false);
      console.log('Added new word:', wordToAdd);
    } else {
      alert('Please fill in all fields (word, meaning, and sentence)');
    }
  };

  // Generate custom cards from input
  const handleGenerateCustom = () => {
    const words = customInput
      .split(/,|\n/)
      .map(w => w.trim())
      .filter(Boolean);
    setCustomCards(
      words.map(word => ({
        word,
        meaning: `Meaning for ${word}.`,
        sentence: `Sample sentence using ${word}.`,
      }))
    );
    setCurrent(0);
    setIsFlipped(false);
    setRecordedUrl(null);
  };

  if (!cards.length) {
    return (
      <div className={compact ? "flex flex-col items-center justify-center w-full h-full" : "min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-purple-100 flex flex-col items-center justify-center"}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col items-center">
          {/* Mode Switch */}
          <div className="flex gap-4 mb-6">
            <button onClick={() => setMode('vocab')} className={`px-4 py-2 rounded-lg font-bold ${mode === 'vocab' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-900'}`}>My Vocabulary</button>
            <button onClick={() => setMode('custom')} className={`px-4 py-2 rounded-lg font-bold ${mode === 'custom' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-900'}`}>Custom Words</button>
          </div>
          {mode === 'custom' && (
            <div className="w-full flex flex-col items-center">
              <textarea
                className="w-full border border-blue-300 rounded-lg px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows={3}
                placeholder="Enter words, separated by commas or new lines"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
              />
              <button onClick={handleGenerateCustom} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">Generate Flashcards</button>
            </div>
          )}
          <div className="text-xl text-blue-900 font-bold mt-4">No flashcards available.</div>
          <div className="text-sm text-blue-600 mt-2">Add words in Vocabulary Practice to get started!</div>
        </div>
      </div>
    );
  }

  const flashcard = cards[current];
  const emoji = getWordEmoji(flashcard.word);

  // Recording logic (same as before)
  const handleStartRecording = async () => {
    setRecordedUrl(null);
    audioChunks.current = [];
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
        setRecordedUrl(url);
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert('Microphone access denied or not available.');
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const handlePlayRecording = () => {
    if (audioRef.current && recordedUrl) {
      audioRef.current.play();
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
    setRecordedUrl(null);
    setCurrent((prev) => (prev + 1) % cards.length);
  };
  const handlePrev = () => {
    setIsFlipped(false);
    setRecordedUrl(null);
    setCurrent((prev) => (prev - 1 + cards.length) % cards.length);
  };

  return (
    <div className={compact ? "flex flex-col items-center justify-center w-full h-full" : "min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-purple-100 flex flex-col items-center justify-center"}>
      <div
        className={compact
          ? "w-full h-full flex flex-col items-center justify-center bg-transparent flex-1"
          : "bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col items-center"
        }
        style={compact ? { maxWidth: 500, maxHeight: 340, width: '100%', height: '100%', boxShadow: 'none', borderRadius: 0, background: 'transparent', padding: 0 } : {}}
      >
        {/* Mode Switch */}
        <div className={compact ? "flex gap-4 mb-2 mt-0" : "flex gap-4 mb-6"}>
          <button onClick={() => setMode('vocab')} className={`px-4 py-2 rounded-lg font-bold ${mode === 'vocab' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-900'}`}>My Vocabulary</button>
          <button onClick={() => setMode('custom')} className={`px-4 py-2 rounded-lg font-bold ${mode === 'custom' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-900'}`}>Custom Words</button>
                     {mode === 'vocab' && (
             <>
               <button 
                 onClick={refreshVocabList}
                 className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold flex items-center gap-2"
                 title="Refresh vocabulary list"
               >
                 <RefreshCw className="w-4 h-4" />
                 Refresh
               </button>
               <button 
                 onClick={addTestWord}
                 className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-2"
                 title="Add test word 'meticulous'"
               >
                 Add "Meticulous"
               </button>
               <button 
                 onClick={() => setShowAddWord(!showAddWord)}
                 className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold flex items-center gap-2"
                 title="Add a new word"
               >
                 Add Word
               </button>
             </>
           )}
        </div>
                 {mode === 'custom' && (
           <div className="w-full flex flex-col items-center mb-4">
             <textarea
               className="w-full border border-blue-300 rounded-lg px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
               rows={3}
               placeholder="Enter words, separated by commas or new lines"
               value={customInput}
               onChange={e => setCustomInput(e.target.value)}
             />
             <button onClick={handleGenerateCustom} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">Generate Flashcards</button>
           </div>
         )}
         
         {/* Add Word Form */}
         {mode === 'vocab' && showAddWord && (
           <div className="w-full bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
             <h3 className="text-lg font-bold text-blue-900 mb-3">Add New Word</h3>
             <div className="space-y-3">
               <input
                 type="text"
                 placeholder="Enter word"
                 value={newWord}
                 onChange={(e) => setNewWord(e.target.value)}
                 className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
               />
               <textarea
                 placeholder="Enter meaning"
                 value={newMeaning}
                 onChange={(e) => setNewMeaning(e.target.value)}
                 className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                 rows={2}
               />
               <textarea
                 placeholder="Enter sample sentence"
                 value={newSentence}
                 onChange={(e) => setNewSentence(e.target.value)}
                 className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                 rows={2}
               />
               <div className="flex gap-2">
                 <button
                   onClick={handleAddWord}
                   className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold"
                 >
                   Add Word
                 </button>
                 <button
                   onClick={() => setShowAddWord(false)}
                   className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold"
                 >
                   Cancel
                 </button>
               </div>
             </div>
           </div>
         )}
        {/* Word Selection Dropdown */}
        {mode === 'vocab' && cards.length > 1 && (
          <div className={compact ? "w-full mb-2" : "w-full mb-4"}>
            <select
              value={current}
              onChange={(e) => {
                setCurrent(parseInt(e.target.value));
                setIsFlipped(false);
                setRecordedUrl(null);
              }}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900 font-semibold"
            >
              {cards.map((card, index) => (
                <option key={index} value={index}>
                  {card.word} ({index + 1}/{cards.length})
                </option>
              ))}
            </select>
          </div>
        )}
        {/* Navigation */}
        <div className={compact ? "flex justify-between w-full mb-1" : "flex justify-between w-full mb-4"}>
          <button onClick={handlePrev} className="text-blue-700 font-bold flex items-center gap-1 hover:underline"><ArrowLeft className="w-5 h-5" />Prev</button>
          <span className="text-blue-900 font-semibold">{current + 1} / {cards.length}</span>
          <button onClick={handleNext} className="text-blue-700 font-bold flex items-center gap-1 hover:underline">Next<ArrowRight className="w-5 h-5" /></button>
        </div>
        {/* Flashcard front/back */}
        {!isFlipped ? (
          <div className="flex flex-col items-center justify-center w-full h-full flex-1">
            <div className={compact ? "text-3xl font-bold text-blue-900 mb-2 text-center" : "text-2xl font-bold text-blue-900 mb-2 text-center"}>{flashcard.word}</div>
            {/* Emoji/Icon */}
            <div className={compact ? "text-7xl mb-4" : "text-6xl mb-4"}>{emoji}</div>
            {/* Play button */}
            <button className={compact ? "bg-purple-500 hover:bg-purple-600 rounded-full w-16 h-16 flex items-center justify-center mb-4" : "bg-purple-500 hover:bg-purple-600 rounded-full w-14 h-14 flex items-center justify-center mb-4"}>
              <Volume2 className={compact ? "w-8 h-8 text-white" : "w-7 h-7 text-white"} />
            </button>
            {/* Flip button */}
            <button className={compact ? "flex items-center gap-2 text-blue-700 font-semibold mt-2 text-lg" : "flex items-center gap-2 text-blue-700 font-semibold mt-2"} onClick={() => setIsFlipped(true)}>
              Tap to Flip <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full flex-1">
            <div className={compact ? "text-3xl font-bold text-blue-900 mb-2 text-center" : "text-2xl font-bold text-blue-900 mb-2 text-center"}>{flashcard.word}</div>
            <div className={compact ? "text-lg text-gray-800 mb-2 text-center" : "text-base text-gray-800 mb-2 text-center"}>{flashcard.meaning}</div>
            <div className={compact ? "text-xl font-bold text-blue-900 mb-1 text-center" : "text-lg font-bold text-blue-900 mb-1 text-center"}>Sample Sentence</div>
            <div className={compact ? "text-base italic text-gray-700 mb-2 text-center" : "text-base italic text-gray-700 mb-2 text-center"}>{flashcard.sentence}</div>
            <div className={compact ? "text-lg font-bold text-blue-900 mb-1 text-center" : "text-lg font-bold text-blue-900 mb-1 text-center"}>Speak &amp; Repeat Prompt</div>
            <div className={compact ? "text-base italic text-blue-700 mb-2 text-center" : "text-base italic text-blue-700 mb-2 text-center"}>Now try saying it aloud</div>
            {/* Option buttons with background */}
            <div className="flex flex-col items-center w-full mb-2">
              <div className={compact ? "flex gap-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl px-8 py-5 items-center justify-center" : "flex gap-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl px-6 py-4 items-center justify-center"}>
                {/* Listen again */}
                <button className={compact ? "bg-purple-500 hover:bg-purple-600 rounded-full w-14 h-14 flex items-center justify-center" : "bg-purple-500 hover:bg-purple-600 rounded-full w-12 h-12 flex items-center justify-center"}>
                  <Volume2 className={compact ? "w-7 h-7 text-white" : "w-6 h-6 text-white"} />
                </button>
                {/* Record button */}
                {!isRecording ? (
                  <button className={compact ? "bg-blue-500 hover:bg-blue-600 rounded-full w-14 h-14 flex items-center justify-center" : "bg-blue-500 hover:bg-blue-600 rounded-full w-12 h-12 flex items-center justify-center"} onClick={handleStartRecording}>
                    <Mic className={compact ? "w-7 h-7 text-white" : "w-6 h-6 text-white"} />
                  </button>
                ) : (
                  <button className={compact ? "bg-red-500 hover:bg-red-600 rounded-full w-14 h-14 flex items-center justify-center" : "bg-red-500 hover:bg-red-600 rounded-full w-12 h-12 flex items-center justify-center"} onClick={handleStopRecording}>
                    <Mic className={compact ? "w-7 h-7 text-white animate-pulse" : "w-6 h-6 text-white animate-pulse"} />
                  </button>
                )}
              </div>
              {/* Practice Pronunciation Button */}
              <button 
                onClick={() => {
                  localStorage.setItem('selectedWord', flashcard.word);
                  navigate('/pronunciation');
                }}
                className={compact ? "mt-3 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold flex items-center gap-2 text-sm" : "mt-3 px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold flex items-center gap-2"}
              >
                <MicIcon className="w-4 h-4" />
                Practice Pronunciation
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Flashcards; 