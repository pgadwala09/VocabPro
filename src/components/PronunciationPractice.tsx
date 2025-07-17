import React, { useRef, useState } from 'react';
import { Lightbulb, Mic, StopCircle, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useVocabulary } from '../hooks/VocabularyContext';
import { useFeedback } from '../hooks/FeedbackContext';
import Insights, { InsightsSingleCard } from './Insights';
import TongueTwisterChallenge from './TongueTwisterChallenge';
import Flashcards from './Flashcards';

// Placeholder components for tabs
const SoundSafari = () => {
  const navigate = useNavigate();
  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full min-h-[400px] p-6 rounded-2xl border-4 border-green-400 bg-gradient-to-br from-green-200 via-yellow-100 to-green-100 shadow-xl overflow-hidden">
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
      <h2 className="text-3xl font-extrabold text-green-900 mb-4 mt-14 text-center drop-shadow-lg font-sans">Sound Safari</h2>
      <p className="text-lg text-green-800 text-center font-semibold mb-4 font-sans bg-white/60 rounded-xl px-4 py-2 shadow">Explore and mimic fun sounds to train your ear and voice.</p>
      <button
        onClick={() => navigate('/mystery-sound-box')}
        className="mt-8 bg-yellow-300 hover:bg-yellow-400 text-yellow-900 font-extrabold py-4 px-10 rounded-full text-2xl shadow-xl transition-all border-4 border-yellow-500 animate-bounce animate-glow"
        style={{ minWidth: 260, boxShadow: '0 0 24px 4px #facc15, 0 2px 8px #0002' }}
      >
        🏆 Try Mystery Sound Box!
      </button>
    </div>
  );
};

const PronunciationPractice: React.FC = () => {
  const navigate = useNavigate();
  const { vocabList, setVocabList } = useVocabulary();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Update tab state to include 'vocabulary'
  const [activeTab, setActiveTab] = useState<'vocabulary' | 'flashcards' | 'twister' | 'sound-safari'>('vocabulary');
  // Echo Match word selection
  const [echoWord, setEchoWord] = useState<string>(() => vocabList.length > 0 ? vocabList[vocabList.length - 1].word : RANDOM_WORDS[Math.floor(Math.random() * RANDOM_WORDS.length)]);
  // Update echoWord if vocabList changes and latest word is new
  React.useEffect(() => {
    if (vocabList.length > 0 && vocabList[vocabList.length - 1].word !== echoWord) {
      setEchoWord(vocabList[vocabList.length - 1].word);
    }
  }, [vocabList]);
  const handleRandomEchoWord = () => {
    if (vocabList.length > 0 && Math.random() < 0.5) {
      // 50% chance pick from vocabList
      setEchoWord(vocabList[Math.floor(Math.random() * vocabList.length)].word);
    } else {
      setEchoWord(RANDOM_WORDS[Math.floor(Math.random() * RANDOM_WORDS.length)]);
    }
  };
  const { addFeedback } = useFeedback();
  // Select word state: default to latest word
  const [selectedWord, setSelectedWord] = useState(() => vocabList.length > 0 ? vocabList[vocabList.length - 1].word : '');
  // Update selectedWord if vocabList changes and latest word is new
  React.useEffect(() => {
    if (vocabList.length > 0 && vocabList[vocabList.length - 1].word !== selectedWord) {
      setSelectedWord(vocabList[vocabList.length - 1].word);
    }
  }, [vocabList]);

  // Add state for recording toggle
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [lastFeedback, setLastFeedback] = useState<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);

  // Echo Match feedback state
  const [echoFeedback, setEchoFeedback] = useState<string | null>(null);
  const [echoScore, setEchoScore] = useState<number | null>(null);
  const [echoRecordedUrl, setEchoRecordedUrl] = useState<string | null>(null);
  const echoMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const echoAudioChunks = useRef<Blob[]>([]);
  const echoAudioPlaybackRef = useRef<HTMLAudioElement | null>(null);

  // Add state for user pronunciation recording (for feedback)
  const [isUserPronouncing, setIsUserPronouncing] = useState(false);
  // Remove self-recording state and logic

  // Echo Match: Play correct pronunciation
  const playEchoPronunciation = () => {
    if (!echoWord) return;
    const utter = new window.SpeechSynthesisUtterance(echoWord);
    utter.lang = 'en-US';
    window.speechSynthesis.speak(utter);
  };

  // When mic is clicked, AI pronounces, then enables user pronunciation
  const handleMicClick = () => {
    playEchoPronunciation();
    setIsUserPronouncing(true);
    setEchoFeedback(null);
    setEchoScore(null);
    setEchoRecordedUrl(null);
  };

  // Echo Match: Record user's pronunciation (for feedback)
  const startEchoRecording = async () => {
    if (isRecording) {
      // Stop recording
      echoMediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    setEchoFeedback(null);
    setEchoScore(null);
    setEchoRecordedUrl(null);
    echoAudioChunks.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      echoMediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        echoAudioChunks.current.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(echoAudioChunks.current, { type: 'audio/wav' });
        setEchoRecordedUrl(URL.createObjectURL(audioBlob));
        // Simulate AI feedback
        const score = Math.floor(60 + Math.random() * 40);
        setEchoScore(score);
        if (score < 85) {
          const feedbackUtter = new window.SpeechSynthesisUtterance('Try again');
          feedbackUtter.lang = 'en-US';
          window.speechSynthesis.speak(feedbackUtter);
          playEchoPronunciation();
        }
        setIsUserPronouncing(false);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert('Microphone access denied or not available.');
    }
  };

  const stopEchoRecording = () => {
    echoMediaRecorderRef.current?.stop();
    setIsRecording(false);
  };
  const playEchoRecording = () => {
    if (echoAudioPlaybackRef.current && echoRecordedUrl) {
      echoAudioPlaybackRef.current.play();
    }
  };

  // Self-recording logic (no feedback)
  // Remove self-recording logic

  // Handler for practice button
  const handlePractice = () => {
    if (!selectedWord) return;
    const feedback = {
      word: selectedWord,
      score: 84,
      clarity: { value: 7, text: 'Clear with minor slurs' },
      wordStress: { value: 6, text: `${selectedWord.slice(0, 2).toUpperCase()}-${selectedWord.slice(2, 5)}-...` },
      pace: { value: 8, text: 'Excellent, especially “fv” and “h” sounds' },
      phonemeAccuracy: { value: 7, text: 'A bit fast – try pausing more' },
      suggestions: [
        'Emphasize second syllables',
        'Slow speech when pronouncing multisyllabic words.'
      ],
      date: new Date().toISOString(),
    };
    addFeedback(feedback);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-start">
      {/* Centered Header */}
      <div className="w-full flex justify-center mt-8 mb-10">
        <div className="bg-white/70 rounded-xl px-12 py-3 shadow">
          <h1 className="text-4xl font-bold text-purple-900 tracking-tight text-center">Pronunciation Practice</h1>
        </div>
      </div>
      {/* Main Row: Echo Match (large), Learn Insights (right) */}
      <div className="flex flex-row gap-8 w-full max-w-6xl mb-4 mt-8">
        {/* Left: Large Echo Match Box and Tabs inside at the top */}
        <div className="flex-[1.2] flex flex-col items-end pr-4">
          {/* Echo Match Box (even larger) */}
          <div className="flex flex-col items-center justify-start w-[650px] h-[540px] bg-gradient-to-br from-purple-800 via-blue-800 to-blue-700 border-2 border-white rounded-2xl p-0 relative mb-6" style={{boxShadow: '0 4px 40px 0 rgba(0,0,0,0.15)'}}>
            {/* Tab Bar at the very top inside the box */}
            <div className="flex flex-row justify-center mt-6 mb-2 gap-4 w-full">
              <button
                onClick={() => setActiveTab('vocabulary')}
                className={`px-6 py-2 rounded-lg font-bold text-lg transition-all duration-200 ${activeTab === 'vocabulary' ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow' : 'bg-white/30 text-purple-900 hover:bg-white/60 hover:text-purple-900'}`}
              >
                Vocabulary
              </button>
              <button
                onClick={() => setActiveTab('flashcards')}
                className={`px-6 py-2 rounded-lg font-bold text-lg transition-all duration-200 ${activeTab === 'flashcards' ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow' : 'bg-white/30 text-purple-900 hover:bg-white/60 hover:text-purple-900'}`}
              >
                Flashcards
              </button>
              <button
                onClick={() => setActiveTab('twister')}
                className={`px-6 py-2 rounded-lg font-bold text-lg transition-all duration-200 ${activeTab === 'twister' ? 'bg-white text-purple-900 shadow' : 'bg-white/30 text-white hover:bg-white/60 hover:text-purple-900'}`}
              >
                Tongue Twister
              </button>
              <button
                onClick={() => setActiveTab('sound-safari')}
                className={`px-6 py-2 rounded-lg font-bold text-lg transition-all duration-200 ${activeTab === 'sound-safari' ? 'bg-gradient-to-r from-green-400 to-yellow-300 text-green-900 shadow' : 'bg-white/30 text-green-900 hover:bg-white/60 hover:text-green-900'}`}
              >
                Sound Safari
              </button>
            </div>
            {/* Tab Content */}
            {activeTab === 'vocabulary' && (
              <>
                <div className="flex flex-col items-center gap-2 mt-6 mb-2">
                  <h2 className="text-4xl font-bold text-white text-center">Echo Match</h2>
                  <div className="flex flex-row items-center gap-4 mt-4 mb-2">
                    <div className="text-3xl text-blue-200 font-bold bg-white/20 px-8 py-2 rounded-xl shadow-lg min-w-[180px] text-center">
                      {echoWord ? echoWord : ''}
                    </div>
                    <button
                      className="px-3 py-1 bg-blue-500 text-white rounded-lg font-semibold shadow hover:bg-blue-600 text-base"
                      onClick={handleRandomEchoWord}
                    >
                      Random Word
                    </button>
                  </div>
                </div>
                <p className="text-white text-center text-xl mb-4 font-medium">Repeat phrases played by the AI and<br/>match your echo to the waveform.</p>
                {/* Card Content Box */}
                <div className="flex flex-col items-center justify-center w-[500px] h-[340px] rounded-2xl border border-white bg-white/5 relative mb-8 pt-10 pb-6">
                  {/* Waveforms and labels centered */}
                  <div className="flex flex-col items-center justify-center w-full gap-4 mb-4">
                    <div className="flex items-center justify-center w-full gap-4">
                      <span className="text-white text-base font-bold mr-2 min-w-[2.5rem] text-center">AI</span>
                      <svg width="240" height="32" viewBox="0 0 240 32" fill="none"><polyline points="0,16 20,4 40,28 60,12 80,24 100,8 120,30 140,15 160,28 180,10 200,24 220,6 240,30" stroke="#38bdf8" strokeWidth="4" fill="none" strokeLinecap="round"/></svg>
                    </div>
                    <div className="flex items-center justify-center w-full gap-4">
                      <span className="text-white text-base font-bold mr-2 min-w-[2.5rem] text-center">You</span>
                      <svg width="240" height="32" viewBox="0 0 240 32" fill="none"><polyline points="0,28 20,10 40,30 60,7 80,29 100,12 120,27 140,8 160,30 180,4 200,28 220,13 240,30" stroke="#34D399" strokeWidth="4" fill="none" strokeLinecap="round"/></svg>
                    </div>
                  </div>
                  {/* Controls: horizontal alignment */}
                  <div className="flex flex-row items-center justify-center w-full gap-6 mt-4 mb-2">
                    <button
                      className="bg-purple-500 hover:bg-purple-600 rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
                      onClick={playEchoPronunciation}
                    >
                      Listen Again
                    </button>
                    {isUserPronouncing && (
                      <button
                        className={`rounded-full w-16 h-16 flex items-center justify-center shadow-lg text-white font-bold text-lg transition ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                        onClick={startEchoRecording}
                        title={isRecording ? 'Stop' : 'Record'}
                      >
                        {isRecording ? 'Stop' : 'Record'}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
            {activeTab === 'flashcards' && (
              <div className="flex flex-col items-center justify-center w-[500px] h-[340px] rounded-2xl border border-white bg-white/5 relative mb-8 pt-10 pb-6">
                <Flashcards compact />
              </div>
            )}
            {activeTab === 'twister' && (
              <div className="flex flex-col items-center justify-center w-[500px] h-[340px] rounded-2xl border border-white bg-white/5 relative mb-8 pt-6 pb-4">
                <TongueTwisterChallenge compact />
              </div>
            )}
            {activeTab === 'sound-safari' && <SoundSafari />}
          </div>
          {/* Tab Content below the Echo Match box */}
          <div className="flex-1 flex flex-col items-center justify-center w-full h-full">
            {/* Remove SoundSafari and its button from PronunciationPractice. Only keep the tab bar for Flashcards and Tongue Twister. */}
          </div>
        </div>
        {/* Right: Learn Insights */}
        <div className="flex-1 flex flex-col items-start pl-4">
          <div className="bg-gradient-to-br from-purple-800 via-blue-800 to-blue-700 rounded-2xl shadow-lg p-8 flex flex-col items-center w-[300px] h-[540px] border-2 border-blue-200 mt-2">
            <Lightbulb className="w-12 h-12 text-yellow-300 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3 text-center">Learn Insights</h3>
            <p className="text-white text-center mb-6">Get tips and feedback on your pronunciation and speaking skills.</p>
            <button
              className="mt-auto px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
              onClick={() => navigate('/insights')}
            >
              View Insights
            </button>
          </div>
        </div>
      </div>
      {/* Recent Activity Section */}
      <div className="w-full max-w-4xl mt-8">
        <div className="flex items-center mb-4">
          <span className="text-xl font-bold text-white mr-3">Recent Activity</span>
          <span className="text-base text-blue-200">- Words you have entered</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-6">
          {vocabList.slice(-5).reverse().map((item, idx) => (
            <div
              key={item.word + idx}
              className={`flex flex-col bg-white/90 rounded-lg shadow p-4 gap-2 hover:shadow-lg transition cursor-pointer ${echoWord === item.word ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => { setEchoWord(item.word); playEchoPronunciation(); setIsUserPronouncing(true); setEchoFeedback(null); setEchoScore(null); setEchoRecordedUrl(null); }}
            >
              <span className="font-semibold text-gray-800 text-sm truncate max-w-[120px]">{item.word}</span>
              <span className="text-xs text-gray-500 capitalize">Text</span>
            </div>
          ))}
          {vocabList.length === 0 && (
            <div className="col-span-3 text-center text-gray-400 py-8">No recent activity.</div>
          )}
        </div>
      </div>
      {/* Navigation Buttons */}
      <div className="flex flex-row justify-between w-full max-w-6xl mt-8 mb-12">
        <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-8 py-3 rounded-xl text-lg shadow" onClick={() => navigate('/vocabpractice')}>Back</button>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl text-lg shadow" onClick={() => navigate('/spelling-practice')}>Next</button>
      </div>
    </div>
  );
};

// Built-in random words for Echo Match
const RANDOM_WORDS = [
  'serendipity', 'quixotic', 'ephemeral', 'luminous', 'zenith', 'mellifluous', 'sonder', 'petrichor', 'limerence', 'sonder',
  'eloquence', 'sonder', 'sonder', 'sonder', 'sonder', 'sonder', 'sonder', 'sonder', 'sonder', 'sonder'
];

export default PronunciationPractice; 