import React, { useState } from 'react';
import SimpleDebatePanel from './SimpleDebatePanel';

const DebateDemo: React.FC = () => {
  const [showDebate, setShowDebate] = useState(false);
  const [topic, setTopic] = useState('Should schools adopt AI-assisted learning?');
  const [duration, setDuration] = useState(60); // seconds
  const [rounds, setRounds] = useState(4);

  const predefinedTopics = [
    'Should schools adopt AI-assisted learning?',
    'Is remote work better than office work?',
    'Should social media be regulated more strictly?',
    'Are electric vehicles truly environmentally friendly?',
    'Should college education be free?'
  ];

  const handleStartDebate = () => {
    setShowDebate(true);
  };

  const handleReset = () => {
    setShowDebate(false);
  };

  if (showDebate) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              ← Back to Setup
            </button>
          </div>
          <MinimalDebatePanel
            topic={topic}
            duration={duration}
            rounds={rounds}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Debate Demo</h1>
            <p className="text-gray-600">Configure your 1-on-1 debate with AI</p>
          </div>

          {/* Topic Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Debate Topic
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {predefinedTopics.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Or type your own topic below
            </p>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter custom topic..."
              className="w-full p-3 border border-gray-300 rounded-lg mt-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Duration Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Turn Duration: {duration} seconds
            </label>
            <input
              type="range"
              min="30"
              max="300"
              step="30"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>30s</span>
              <span>1m</span>
              <span>2m</span>
              <span>3m</span>
              <span>5m</span>
            </div>
          </div>

          {/* Rounds Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Rounds: {rounds}
            </label>
            <input
              type="range"
              min="2"
              max="8"
              step="1"
              value={rounds}
              onChange={(e) => setRounds(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>2</span>
              <span>4</span>
              <span>6</span>
              <span>8</span>
            </div>
          </div>

          {/* Start Button */}
          <div className="text-center">
            <button
              onClick={handleStartDebate}
              className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-lg transition-colors"
            >
              Start Debate
            </button>
            <p className="text-sm text-gray-500 mt-2">
              You'll be PRO, AI will be CON
            </p>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">How it works:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Click "Start Recording" when it's your turn</li>
              <li>• Speak your argument within the time limit</li>
              <li>• AI will respond automatically</li>
              <li>• Take turns until all rounds are complete</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebateDemo;
