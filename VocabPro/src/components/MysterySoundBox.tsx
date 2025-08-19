import React, { useState } from "react";

// Placeholder data: phonemes, words, phoneme audio, hints, and TTS text
const PHONEMES = [
  {
    symbol: "/s/",
    tts: "s",
    word: "snake",
    phonemeAudio: "https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae7e2.mp3",
    wordAudio: "https://ssl.gstatic.com/dictionary/static/sounds/oxford/snake--_gb_1.mp3",
    hint: "S _ _ _ _ (a long, slithery reptile)",
  },
  {
    symbol: "/th/",
    tts: "th",
    word: "thumb",
    phonemeAudio: "https://cdn.pixabay.com/audio/2022/03/15/audio_115b9e7e2c.mp3",
    wordAudio: "https://ssl.gstatic.com/dictionary/static/sounds/oxford/thumb--_gb_1.mp3",
    hint: "T _ _ _ _ (a finger on your hand)",
  },
  {
    symbol: "/ʃ/",
    tts: "sh",
    word: "shoe",
    phonemeAudio: "https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae7e2.mp3",
    wordAudio: "https://ssl.gstatic.com/dictionary/static/sounds/oxford/shoe--_gb_1.mp3",
    hint: "S _ _ _ (you wear this on your foot)",
  },
  {
    symbol: "/k/",
    tts: "k",
    word: "kite",
    phonemeAudio: "https://cdn.pixabay.com/audio/2022/03/15/audio_115b9e7e2c.mp3",
    wordAudio: "https://ssl.gstatic.com/dictionary/static/sounds/oxford/kite--_gb_1.mp3",
    hint: "K _ _ _ (flies in the sky on a string)",
  },
];

function getRandomPhoneme() {
  return PHONEMES[Math.floor(Math.random() * PHONEMES.length)];
}

const supportsSpeechRecognition = () => {
  return (
    typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  );
};

const MysterySoundBox: React.FC = () => {
  const [boxOpen, setBoxOpen] = useState(false);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [current, setCurrent] = useState(getRandomPhoneme());
  const [feedback, setFeedback] = useState("");
  const [progress, setProgress] = useState(0);
  const [listening, setListening] = useState(false);
  const [wordRevealed, setWordRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micSupported, setMicSupported] = useState(supportsSpeechRecognition());
  const [micPermission, setMicPermission] = useState(true);

  // Play phoneme audio, fallback to TTS if fails
  const playPhonemeAudio = () => {
    if (current.phonemeAudio) {
      const audio = new Audio(current.phonemeAudio);
      audio.onerror = () => {
        // Fallback to TTS
        if ('speechSynthesis' in window) {
          const utter = new window.SpeechSynthesisUtterance(current.tts || current.symbol);
          utter.lang = 'en-US';
          window.speechSynthesis.speak(utter);
        } else {
          setError('Audio and TTS not supported in this browser.');
        }
      };
      audio.onplay = () => setError(null);
      audio.play().catch(() => {
        // Fallback to TTS
        if ('speechSynthesis' in window) {
          const utter = new window.SpeechSynthesisUtterance(current.tts || current.symbol);
          utter.lang = 'en-US';
          window.speechSynthesis.speak(utter);
        } else {
          setError('Audio and TTS not supported in this browser.');
        }
      });
    } else if ('speechSynthesis' in window) {
      const utter = new window.SpeechSynthesisUtterance(current.tts || current.symbol);
      utter.lang = 'en-US';
      window.speechSynthesis.speak(utter);
    } else {
      setError('Audio and TTS not supported in this browser.');
    }
  };

  // Play word audio, fallback to TTS if fails
  const playWordAudio = () => {
    if (current.wordAudio) {
      const audio = new Audio(current.wordAudio);
      audio.onerror = () => {
        if ('speechSynthesis' in window) {
          const utter = new window.SpeechSynthesisUtterance(current.word);
          utter.lang = 'en-US';
          window.speechSynthesis.speak(utter);
        } else {
          setError('Audio and TTS not supported in this browser.');
        }
      };
      audio.onplay = () => setError(null);
      audio.play().catch(() => {
        if ('speechSynthesis' in window) {
          const utter = new window.SpeechSynthesisUtterance(current.word);
          utter.lang = 'en-US';
          window.speechSynthesis.speak(utter);
        } else {
          setError('Audio and TTS not supported in this browser.');
        }
      });
    } else if ('speechSynthesis' in window) {
      const utter = new window.SpeechSynthesisUtterance(current.word);
      utter.lang = 'en-US';
      window.speechSynthesis.speak(utter);
    } else {
      setError('Audio and TTS not supported in this browser.');
    }
  };

  // Voice input logic (Web Speech API)
  const handleListen = () => {
    setError(null);
    if (!supportsSpeechRecognition()) {
      setMicSupported(false);
      setError('Speech recognition is not supported in this browser. Please use Google Chrome on desktop.');
      return;
    }
    setListening(true);
    setFeedback("");
    // @ts-ignore
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    // @ts-ignore
    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      if (transcript.includes(current.word.toLowerCase())) {
        setFeedback("success");
        setProgress((p) => p + 1);
        setWordRevealed(true);
        setTimeout(() => playWordAudio(), 600);
      } else {
        setFeedback("try-again");
      }
      setListening(false);
    };
    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed' || event.error === 'denied') {
        setMicPermission(false);
        setError('Microphone access denied. Please allow mic access in your browser settings.');
      } else {
        setError('Speech recognition error: ' + event.error);
      }
      setFeedback("try-again");
      setListening(false);
    };
    try {
      recognition.start();
    } catch (e) {
      setError('Could not start speech recognition.');
      setListening(false);
    }
  };

  // Handle box tap
  const handleBoxTap = () => {
    setBoxOpen(true);
    setTimeout(() => setCardFlipped(true), 600); // Delay for box open animation
    setTimeout(() => playPhonemeAudio(), 1200); // Play phoneme audio after card flip
  };

  // Next word
  const handleNext = () => {
    setBoxOpen(false);
    setCardFlipped(false);
    setFeedback("");
    setWordRevealed(false);
    setError(null);
    setTimeout(() => {
      setCurrent(getRandomPhoneme());
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow">Mystery Sound Box</h1>
        <p className="text-lg text-blue-100">Tap the box to reveal a sound and a clue. Pronounce the word to solve the mystery!</p>
      </div>
      {/* Error/Support Warnings */}
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded shadow max-w-md text-center">
          {error}
        </div>
      )}
      {!micSupported && (
        <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded shadow max-w-md text-center">
          Speech recognition is not supported in your browser. Please use Google Chrome on desktop for the best experience.
        </div>
      )}
      {!micPermission && (
        <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded shadow max-w-md text-center">
          Microphone access denied. Please allow mic access in your browser settings.
        </div>
      )}
      {/* Progress bar/gems */}
      <div className="flex items-center mb-4">
        {[...Array(progress)].map((_, i) => (
          <span key={i} className="text-yellow-300 text-2xl mx-1">💎</span>
        ))}
      </div>
      {/* Treasure Box */}
      <div className="relative flex flex-col items-center">
        <button
          className={`focus:outline-none ${boxOpen ? 'pointer-events-none' : ''}`}
          onClick={handleBoxTap}
          aria-label="Tap to open the mystery box"
        >
          {/* Box SVG (closed/open) */}
          <div className={`transition-all duration-500 ${boxOpen ? 'translate-y-8 scale-110' : ''}`}>
            {/* Placeholder SVG for treasure box */}
            <svg width="140" height="100" viewBox="0 0 140 100">
              <rect x="20" y="40" width="100" height="50" rx="10" fill="#FFD966" stroke="#7C3AED" strokeWidth="6" />
              <rect x="20" y="30" width="100" height="20" rx="10" fill="#A78BFA" />
              <rect x="55" y="60" width="30" height="25" rx="6" fill="#FBBF24" stroke="#7C3AED" strokeWidth="4" />
              <circle cx="70" cy="72" r="6" fill="#7C3AED" />
            </svg>
            {/* Question mark above box */}
            {!boxOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 -top-10">
                <div className="bg-purple-500 rounded-full w-10 h-10 flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl font-bold">?</span>
                </div>
              </div>
            )}
          </div>
        </button>
        {/* Tap to Open button */}
        {!boxOpen && (
          <button
            className="mt-8 bg-cyan-300 hover:bg-cyan-400 text-cyan-900 font-bold py-3 px-10 rounded-full text-xl shadow-lg transition-all"
            onClick={handleBoxTap}
          >
            Tap to Open
          </button>
        )}
        {/* Card Flip Animation */}
        <div className={`absolute left-1/2 -translate-x-1/2 top-0 transition-transform duration-700 ${cardFlipped ? 'translate-y-[-120px] rotate-x-0' : 'translate-y-0 rotate-x-90'} origin-bottom`}
          style={{ perspective: 600 }}
        >
          {boxOpen && (
            <div className="w-80 h-64 bg-white rounded-xl shadow-xl flex flex-col items-center justify-between border-4 border-purple-400 p-8 z-20" style={{ position: 'relative' }}>
              <div className="text-3xl font-bold text-purple-600 text-center mt-2">{current.symbol}</div>
              <div className="text-lg text-blue-700 font-semibold text-center break-words max-w-[220px] mb-4">{current.hint}</div>
              <button
                className="mt-2 bg-blue-200 hover:bg-blue-300 text-blue-800 rounded-full px-4 py-1 text-lg mb-1"
                onClick={playPhonemeAudio}
                aria-label="Listen to the sound again"
              >🔊 Listen Again</button>
              {/* Reveal word only after correct pronunciation */}
              {wordRevealed && (
                <div className="mt-3 text-2xl text-green-700 font-bold capitalize animate-bounce">{current.word}</div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Voice Input and Feedback */}
      {cardFlipped && (
        <div className="flex flex-col items-center mt-32">
          <button
            className={`mt-4 bg-pink-400 hover:bg-pink-500 text-white rounded-full p-6 text-3xl shadow-lg transition-all ${listening ? 'animate-pulse' : ''}`}
            onClick={handleListen}
            disabled={listening || wordRevealed || !micSupported || !micPermission}
            aria-label="Speak now"
          >
            🎤
          </button>
          <span className="mt-2 text-white text-lg">Tap the mic and say the word!</span>
          {/* Feedback */}
          {feedback === "success" && (
            <div className="mt-4 flex flex-col items-center animate-bounce">
              <span className="text-4xl">✨🌟✨</span>
              <span className="text-green-200 font-bold text-xl mt-2">Great job! The word was <span className="capitalize">{current.word}</span>!</span>
              <button
                className="mt-4 bg-green-300 hover:bg-green-400 text-green-900 font-bold py-2 px-8 rounded-full text-lg shadow-lg"
                onClick={handleNext}
              >
                Next Word
              </button>
              <button
                className="mt-2 bg-blue-200 hover:bg-blue-300 text-blue-800 rounded-full px-4 py-1 text-lg"
                onClick={playWordAudio}
                aria-label="Listen to the word"
              >🔊 Listen to the Word</button>
            </div>
          )}
          {feedback === "try-again" && (
            <div className="mt-4 flex flex-col items-center">
              <span className="text-3xl">🔄</span>
              <span className="text-red-200 font-bold text-lg mt-2">Try again!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MysterySoundBox; 