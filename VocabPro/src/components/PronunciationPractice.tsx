import React, { useRef, useState, useEffect } from 'react';
import { Lightbulb, Mic, StopCircle, Play, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useVocabulary } from '../hooks/VocabularyContext';
import { useFeedback } from '../hooks/FeedbackContext';
import Insights, { InsightsSingleCard } from './Insights';
import { LearningInsightsCard } from './Insights';
import TongueTwisterChallenge from './TongueTwisterChallenge';
import Flashcards from './Flashcards';

// Import the updated SoundSafari component
import SoundSafariComponent from './SoundSafari';

// Placeholder components for tabs
const SoundSafari = () => {
  return <SoundSafariComponent />;
};

const PronunciationPractice: React.FC = () => {
  const navigate = useNavigate();
  const { vocabList, setVocabList } = useVocabulary();
  const { feedbacks, setLatestFeedback } = useFeedback();
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

  // Add state for practice flow
  const [isPracticing, setIsPracticing] = useState(false);

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

  // Practice flow: AI pronounces, then user records
  const handlePracticeClick = async () => {
    setIsPracticing(true);
    playEchoPronunciation();
    setTimeout(() => {
      setIsUserPronouncing(true);
      setEchoFeedback(null);
      setEchoScore(null);
      setEchoRecordedUrl(null);
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript.trim().toLowerCase();
          const isCorrect = transcript === echoWord.trim().toLowerCase();
          if (isCorrect) {
            const feedbackUtter = new window.SpeechSynthesisUtterance('Correct!');
            feedbackUtter.lang = 'en-US';
            window.speechSynthesis.speak(feedbackUtter);
            setEchoFeedback('Correct!');
          } else {
            const feedbackUtter = new window.SpeechSynthesisUtterance('Try again');
            feedbackUtter.lang = 'en-US';
            window.speechSynthesis.speak(feedbackUtter);
            playEchoPronunciation();
            setEchoFeedback('Try again');
          }
          // Add feedback for Insights panel
          addFeedback({
            word: echoWord,
            score: isCorrect ? 100 : 60,
            clarity: { value: isCorrect ? 10 : 6, text: isCorrect ? 'Very clear' : 'Needs improvement' },
            wordStress: { value: 7, text: 'Good' },
            pace: { value: 8, text: 'Good' },
            phonemeAccuracy: { value: 7, text: 'Good' },
            suggestions: isCorrect ? ['Great job!'] : ['Try to match the AI pronunciation more closely.'],
            date: new Date().toISOString(),
          });
          setIsUserPronouncing(false);
          setIsPracticing(false);
        };
        recognition.onerror = (event: any) => {
          setEchoFeedback('Could not recognize. Try again.');
          addFeedback({
            word: echoWord,
            score: 0,
            clarity: { value: 2, text: 'Not recognized' },
            wordStress: { value: 2, text: 'N/A' },
            pace: { value: 2, text: 'N/A' },
            phonemeAccuracy: { value: 2, text: 'N/A' },
            suggestions: ['Check your mic and try again.'],
            date: new Date().toISOString(),
          });
          setIsUserPronouncing(false);
          setIsPracticing(false);
        };
        recognition.onend = () => {
          setIsUserPronouncing(false);
          setIsPracticing(false);
          // If no feedback was added (e.g., user said nothing), add fallback
          if (!echoFeedback) {
            addFeedback({
              word: echoWord,
              score: 0,
              clarity: { value: 2, text: 'No input detected' },
              wordStress: { value: 2, text: 'N/A' },
              pace: { value: 2, text: 'N/A' },
              phonemeAccuracy: { value: 2, text: 'N/A' },
              suggestions: ['Try speaking more clearly.'],
              date: new Date().toISOString(),
            });
          }
        };
        recognition.start();
      } else {
        setEchoFeedback('SpeechRecognition not supported in this browser.');
        addFeedback({
          word: echoWord,
          score: 0,
          clarity: { value: 1, text: 'Not supported' },
          wordStress: { value: 1, text: 'N/A' },
          pace: { value: 1, text: 'N/A' },
          phonemeAccuracy: { value: 1, text: 'N/A' },
          suggestions: ['Use Google Chrome for best results.'],
          date: new Date().toISOString(),
        });
        setIsUserPronouncing(false);
        setIsPracticing(false);
      }
    }, Math.max(1200, echoWord.length * 120));
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
        setIsPracticing(false);
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      // Automatically stop recording after 2.5 seconds
      setTimeout(() => {
        if (echoMediaRecorderRef.current && echoMediaRecorderRef.current.state === 'recording') {
          echoMediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      }, 2500);
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
                    <button
                      className={`ml-2 px-3 py-1 bg-pink-500 text-white rounded-full font-semibold shadow hover:bg-pink-600 flex items-center gap-2 text-base ${isPracticing ? 'opacity-60 cursor-not-allowed' : ''}`}
                      onClick={handlePracticeClick}
                      disabled={isPracticing}
                      style={{ minWidth: 44, minHeight: 44 }}
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                {/* Always show waveforms */}
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
                {/* Card Content Box: Only show feedback and mic, not meaning/sentence */}
                <div className="flex flex-col items-center justify-center w-[500px] h-[420px] rounded-2xl border border-white bg-white/5 relative mb-8 pt-10 pb-6">
                  <div className="flex flex-row items-center justify-center w-full gap-6 mt-4 mb-2">
                    <button
                      className="bg-purple-500 hover:bg-purple-600 rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
                      onClick={playEchoPronunciation}
                    >
                      Listen Again
                    </button>
                    <button
                      className={`bg-blue-500 hover:bg-blue-600 rounded-full w-14 h-14 flex items-center justify-center shadow-lg ${isPracticing ? 'opacity-60 cursor-not-allowed' : ''}`}
                      onClick={handlePracticeClick}
                      disabled={isPracticing}
                    >
                      <Mic className="w-7 h-7 text-white" />
                    </button>
                    {echoFeedback && (
                      <span className={`ml-4 text-lg font-bold ${echoFeedback === 'Correct!' ? 'text-green-400' : 'text-red-400'}`}>{echoFeedback}</span>
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
          <div className="bg-gradient-to-br from-purple-800 via-blue-800 to-blue-700 rounded-2xl shadow-lg p-8 flex flex-col items-center w-[350px] h-[540px] border-2 border-blue-200 mt-2">
            {/* Show Learning Insights card with Meaning, Usage, Pronunciation */}
            {feedbacks && feedbacks.length > 0 ? (
              <div className="mb-4 w-full flex flex-col items-center">
                <LearningInsightsCard feedback={feedbacks[feedbacks.length - 1]} />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-blue-900 to-purple-800 rounded-2xl shadow-xl p-8 w-full max-w-md mx-auto mb-8 text-white relative flex flex-col items-center justify-center min-h-[400px]">
                <div className="text-2xl font-bold mb-4 text-center">Learning Insights</div>
                <div className="text-blue-200 text-base mt-8">No feedback yet. Practice words to see your insights!</div>
              </div>
            )}
            <button
              className="mt-auto px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
              onClick={() => navigate('/insights')}
            >
              View All Insights
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

// For browser speech recognition
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export default PronunciationPractice; 