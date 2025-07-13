import React from 'react';
import { useNavigate } from 'react-router-dom';

const SoundSafari: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-200 via-yellow-100 to-green-100 p-4 relative overflow-hidden">
      {/* Jungle vines top border */}
      <div className="absolute top-0 left-0 w-full flex justify-between px-4 z-10">
        <span className="text-3xl md:text-4xl animate-bounce">🌿</span>
        <span className="text-3xl md:text-4xl animate-bounce delay-200">🍃</span>
        <span className="text-3xl md:text-4xl animate-bounce delay-400">🌴</span>
        <span className="text-3xl md:text-4xl animate-bounce delay-700">🪴</span>
      </div>
      {/* Animal and sound icons */}
      <span className="absolute left-4 top-20 text-5xl animate-wiggle-slow">🦜</span>
      <span className="absolute right-6 top-32 text-5xl animate-wiggle">🐒</span>
      <span className="absolute left-10 bottom-10 text-4xl animate-bounce">🥁</span>
      <span className="absolute right-10 bottom-8 text-4xl animate-spin-slow">🎶</span>
      <h1 className="text-4xl font-extrabold text-green-900 mb-4 mt-20 text-center drop-shadow-lg font-sans">Sound Safari</h1>
      <p className="text-lg text-green-800 text-center font-semibold mb-8 font-sans bg-white/60 rounded-xl px-4 py-2 shadow">Explore and mimic fun sounds to train your ear and voice. Tap the treasure box to start the Mystery Sound Box game!</p>
      <button
        onClick={() => navigate('/mystery-sound-box')}
        className="mt-8 focus:outline-none"
        aria-label="Start Mystery Sound Box"
      >
        <div className="transition-all duration-500 hover:scale-110">
          <svg width="180" height="120" viewBox="0 0 140 100">
            <rect x="20" y="40" width="100" height="50" rx="10" fill="#FFD966" stroke="#7C3AED" strokeWidth="6" />
            <rect x="20" y="30" width="100" height="20" rx="10" fill="#A78BFA" />
            <rect x="55" y="60" width="30" height="25" rx="6" fill="#FBBF24" stroke="#7C3AED" strokeWidth="4" />
            <circle cx="70" cy="72" r="6" fill="#7C3AED" />
          </svg>
        </div>
        <div className="mt-4 bg-yellow-300 hover:bg-yellow-400 text-yellow-900 font-extrabold py-3 px-10 rounded-full text-2xl shadow-xl transition-all border-4 border-yellow-500 animate-bounce animate-glow">
          Start Mystery Sound Box!
        </div>
      </button>
    </div>
  );
};

export default SoundSafari; 