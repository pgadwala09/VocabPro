import React, { useState, useRef } from 'react';
import { Volume2, ArrowRight, ArrowLeft, Mic, Play } from 'lucide-react';
import { useVocabulary, VocabWord } from '../hooks/VocabularyContext';

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

const Flashcards: React.FC = () => {
  const { vocabList } = useVocabulary();
  const [current, setCurrent] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<'vocab' | 'custom'>('vocab');
  const [customInput, setCustomInput] = useState('');
  const [customCards, setCustomCards] = useState<VocabWord[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Choose which list to use
  const cards = mode === 'vocab' ? vocabList : customCards;

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
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-purple-100 flex flex-col items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-purple-100 flex flex-col items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col items-center">
        {/* Mode Switch */}
        <div className="flex gap-4 mb-6">
          <button onClick={() => setMode('vocab')} className={`px-4 py-2 rounded-lg font-bold ${mode === 'vocab' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-900'}`}>My Vocabulary</button>
          <button onClick={() => setMode('custom')} className={`px-4 py-2 rounded-lg font-bold ${mode === 'custom' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-900'}`}>Custom Words</button>
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
        {/* Navigation */}
        <div className="flex justify-between w-full mb-4">
          <button onClick={handlePrev} className="text-blue-700 font-bold flex items-center gap-1 hover:underline"><ArrowLeft className="w-5 h-5" />Prev</button>
          <span className="text-blue-900 font-semibold">{current + 1} / {cards.length}</span>
          <button onClick={handleNext} className="text-blue-700 font-bold flex items-center gap-1 hover:underline">Next<ArrowRight className="w-5 h-5" /></button>
        </div>
        {/* Flashcard front/back */}
        {!isFlipped ? (
          <div className="flex flex-col items-center w-full">
            <div className="text-2xl font-bold text-blue-900 mb-2 text-center">{flashcard.word}</div>
            {/* Emoji/Icon */}
            <div className="text-6xl mb-4">{emoji}</div>
            {/* Play button */}
            <button className="bg-purple-500 hover:bg-purple-600 rounded-full w-14 h-14 flex items-center justify-center mb-4">
              <Volume2 className="w-7 h-7 text-white" />
            </button>
            {/* Flip button */}
            <button className="flex items-center gap-2 text-blue-700 font-semibold mt-2" onClick={() => setIsFlipped(true)}>
              Tap to Flip <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full">
            <div className="text-2xl font-bold text-blue-900 mb-2 text-center">{flashcard.word}</div>
            <div className="text-base text-gray-800 mb-2 text-center">{flashcard.meaning}</div>
            <div className="text-lg font-bold text-blue-900 mb-1 text-center">Sample Sentence</div>
            <div className="text-base italic text-gray-700 mb-2 text-center">{flashcard.sentence}</div>
            <div className="text-lg font-bold text-blue-900 mb-1 text-center">Speak &amp; Repeat Prompt</div>
            <div className="text-base italic text-blue-700 mb-2 text-center">Now try saying it aloud</div>
            {/* Option buttons with background */}
            <div className="flex flex-col items-center w-full mb-2">
              <div className="flex gap-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl px-6 py-4 items-center justify-center">
                {/* Listen again */}
                <button className="bg-purple-500 hover:bg-purple-600 rounded-full w-12 h-12 flex items-center justify-center">
                  <Volume2 className="w-6 h-6 text-white" />
                </button>
                {/* Record button */}
                {!isRecording ? (
                  <button className="bg-blue-500 hover:bg-blue-600 rounded-full w-12 h-12 flex items-center justify-center" onClick={handleStartRecording}>
                    <Mic className="w-6 h-6 text-white" />
                  </button>
                ) : (
                  <button className="bg-red-500 hover:bg-red-600 rounded-full w-12 h-12 flex items-center justify-center" onClick={handleStopRecording}>
                    <Mic className="w-6 h-6 text-white animate-pulse" />
                  </button>
                )}
                {/* Playback button for user's recording */}
                {recordedUrl && (
                  <button className="bg-green-500 hover:bg-green-600 rounded-full w-12 h-12 flex items-center justify-center" onClick={handlePlayRecording}>
                    <Play className="w-6 h-6 text-white" />
                    <audio ref={audioRef} src={recordedUrl} />
                  </button>
                )}
              </div>
              {isRecording && <div className="text-xs text-red-500 mt-2">Recording...</div>}
            </div>
            {/* Flip back button */}
            <button className="flex items-center gap-2 text-blue-700 font-semibold mt-2" onClick={() => setIsFlipped(false)}>
              <ArrowLeft className="w-5 h-5" /> Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Flashcards; 