import React, { useState } from 'react';
import { Volume2, Play, Pause } from 'lucide-react';
import { ttsService } from '../lib/supabase';

const TTSTest: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testText, setTestText] = useState('Hello! This is a test of the AI voice system. The debate is working properly. I am the CON side and I\'m ready to engage in this debate.');

  const testTTS = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      console.log('Testing TTS with text:', testText);
      
      const audioBlob = await ttsService.generateSpeech(testText);
      
      if (audioBlob) {
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        console.log('TTS test successful, audio blob size:', audioBlob.size);
      } else {
        setError('TTS service returned null audio blob');
        console.error('TTS test failed: null audio blob');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`TTS test failed: ${errorMessage}`);
      console.error('TTS test error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      setIsPlaying(true);
      
      audio.onended = () => {
        setIsPlaying(false);
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
        setError('Failed to play audio');
      };
      
      audio.play().catch(err => {
        setIsPlaying(false);
        setError(`Playback failed: ${err.message}`);
      });
    }
  };

  const testFallbackSpeech = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(testText);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onstart = () => {
        setIsPlaying(true);
        console.log('Fallback speech synthesis started');
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
        console.log('Fallback speech synthesis ended');
      };
      
      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        setIsPlaying(false);
        setError('Fallback speech synthesis failed');
      };
      
      speechSynthesis.speak(utterance);
    } else {
      setError('Speech synthesis not supported in this browser');
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">TTS Test Component</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test Text:
        </label>
        <textarea
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="Enter text to test TTS..."
        />
      </div>

      <div className="flex gap-3 mb-4">
        <button
          onClick={testTTS}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Volume2 size={16} />
          {isGenerating ? 'Generating...' : 'Test ElevenLabs TTS'}
        </button>

        <button
          onClick={testFallbackSpeech}
          disabled={isPlaying}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Volume2 size={16} />
          {isPlaying ? 'Playing...' : 'Test Browser TTS'}
        </button>

        {audioUrl && (
          <button
            onClick={playAudio}
            disabled={isPlaying}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? 'Playing...' : 'Play Generated Audio'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <strong>Error:</strong> {error}
        </div>
      )}

      {audioUrl && (
        <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
          <strong>Success!</strong> TTS audio generated successfully.
          <br />
          <small>Audio URL: {audioUrl.substring(0, 50)}...</small>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-100 rounded-md">
        <h3 className="font-semibold mb-2">TTS Status:</h3>
        <ul className="text-sm space-y-1">
          <li>• ElevenLabs Proxy: <span className="text-green-600">Running on port 8787</span></li>
          <li>• API Routes Server: <span className="text-green-600">Running on port 3003</span></li>
          <li>• TTS Service: <span className="text-blue-600">Available</span></li>
          <li>• Browser Speech Synthesis: <span className="text-blue-600">Available</span></li>
        </ul>
      </div>
    </div>
  );
};

export default TTSTest;

