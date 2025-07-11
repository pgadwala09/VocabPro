import React, { useRef, useState } from 'react';
import { Lightbulb, Mic, StopCircle, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useVocabulary } from '../hooks/VocabularyContext';
import { useFeedback } from '../hooks/FeedbackContext';

// Placeholder components for tabs
const TongueTwister = () => (
  <div className="flex flex-col items-center justify-center h-full">
    <h2 className="text-2xl font-bold text-white mb-4 mt-10 text-center">Tongue Twister</h2>
    <p className="text-white text-center text-base mb-4 font-medium">Practice tricky tongue twisters to improve your pronunciation!</p>
  </div>
);
const SoundSafari = () => (
  <div className="flex flex-col items-center justify-center h-full">
    <h2 className="text-2xl font-bold text-white mb-4 mt-10 text-center">Sound Safari</h2>
    <p className="text-white text-center text-base mb-4 font-medium">Explore and mimic fun sounds to train your ear and voice.</p>
  </div>
);

const PronunciationPractice: React.FC = () => {
  const navigate = useNavigate();
  const { vocabList, setVocabList } = useVocabulary();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeTab, setActiveTab] = useState<'twister' | 'safari' | 'none'>('none');
  const { addFeedback } = useFeedback();
  // Select word state: default to latest word
  const [selectedWord, setSelectedWord] = useState(() => vocabList.length > 0 ? vocabList[vocabList.length - 1].word : '');
  // Update selectedWord if vocabList changes and latest word is new
  React.useEffect(() => {
    if (vocabList.length > 0 && vocabList[vocabList.length - 1].word !== selectedWord) {
      setSelectedWord(vocabList[vocabList.length - 1].word);
    }
  }, [vocabList]);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [lastFeedback, setLastFeedback] = useState<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);

  // Recording logic
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
        // Generate and show feedback
        const feedback = {
          word: selectedWord,
          score: Math.floor(70 + Math.random() * 30),
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
        setLastFeedback(feedback);
        addFeedback(feedback);
        // Use browser TTS to speak the word
        if ('speechSynthesis' in window && selectedWord) {
          const utter = new window.SpeechSynthesisUtterance(selectedWord);
          utter.lang = 'en-US';
          window.speechSynthesis.speak(utter);
        }
        // Speak feedback ('Correct!' or 'Try again')
        if ('speechSynthesis' in window) {
          const feedbackUtter = new window.SpeechSynthesisUtterance(
            feedback.score >= 85 ? 'Correct!' : 'Try again'
          );
          feedbackUtter.lang = 'en-US';
          window.speechSynthesis.speak(feedbackUtter);
        }
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert('Microphone access denied or not available.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const handlePlayRecording = () => {
    if (audioPlaybackRef.current && recordedUrl) {
      audioPlaybackRef.current.play();
    }
  };

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
      <div className="flex flex-row gap-8 w-full max-w-6xl mb-8">
        {/* Left: Large Echo Match Box and Tabs inside at the top */}
        <div className="flex-1 flex flex-col items-center">
          {/* Echo Match Box (even larger) */}
          <div className="flex flex-col items-center justify-start w-[650px] h-[540px] bg-gradient-to-br from-purple-800 via-blue-800 to-blue-700 border-2 border-white rounded-2xl p-0 relative mb-6" style={{boxShadow: '0 4px 40px 0 rgba(0,0,0,0.15)'}}>
            {/* Tab Bar at the very top inside the box */}
            <div className="flex flex-row justify-center mt-6 mb-2 gap-4 w-full">
              <button
                onClick={() => navigate('/flashcards')}
                className="px-6 py-2 rounded-lg font-bold text-lg transition-all duration-200 bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow hover:from-purple-600 hover:to-blue-600"
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
                onClick={() => setActiveTab('safari')}
                className={`px-6 py-2 rounded-lg font-bold text-lg transition-all duration-200 ${activeTab === 'safari' ? 'bg-white text-purple-900 shadow' : 'bg-white/30 text-white hover:bg-white/60 hover:text-purple-900'}`}
              >
                Sound Safari
              </button>
            </div>
            {/* Echo Match Heading and Content */}
            <h2 className="text-4xl font-bold text-white mb-4 mt-8 text-center">Echo Match</h2>
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
              {/* Mic and Record Buttons */}
              <div className="flex flex-col items-center justify-center w-full gap-2 mt-2 mb-2">
                {!isRecording && (
                  <>
                    <button
                      className="bg-blue-500 hover:bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center shadow-lg"
                      onClick={handleStartRecording}
                      title="Start Recording"
                    >
                      <Mic className="w-8 h-8 text-white" />
                    </button>
                    <button
                      className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
                      onClick={handleStartRecording}
                    >
                      Record
                    </button>
                  </>
                )}
                {isRecording && (
                  <button
                    className="bg-red-500 hover:bg-red-600 rounded-full w-16 h-16 flex items-center justify-center animate-pulse shadow-lg"
                    onClick={handleStopRecording}
                    title="Stop Recording"
                  >
                    <StopCircle className="w-8 h-8 text-white" />
                  </button>
                )}
                {isRecording && <div className="text-xs text-red-400 mt-1">Recording...</div>}
              </div>
              {/* Play Button inside the box, below controls */}
              {recordedUrl && !isRecording && (
                <button
                  className="bg-green-500 hover:bg-green-600 rounded-full w-16 h-16 flex items-center justify-center shadow-lg mt-4"
                  onClick={handlePlayRecording}
                  title="Play Your Recording"
                >
                  <Play className="w-8 h-8 text-white" />
                  <audio ref={audioPlaybackRef} src={recordedUrl} />
                </button>
              )}
            </div>
            {/* Remove Start Practice Button and align Echo Match */}
          </div>
          {/* Tab Content below the Echo Match box */}
          <div className="flex-1 flex flex-col items-center justify-center w-full h-full">
            {activeTab === 'twister' && <TongueTwister />}
            {activeTab === 'safari' && <SoundSafari />}
          </div>
        </div>
        {/* Right: Learn Insights */}
        <div className="flex flex-col items-center justify-start min-w-[300px] ml-4 mt-2">
          <div className="bg-white/90 rounded-2xl shadow-lg p-8 flex flex-col items-center w-[300px] h-[540px] border-2 border-blue-200">
            <Lightbulb className="w-12 h-12 text-yellow-400 mb-4" />
            <h3 className="text-2xl font-bold text-blue-900 mb-3 text-center">Learn Insights</h3>
            <p className="text-gray-700 text-center mb-6">Get tips and feedback on your pronunciation and speaking skills.</p>
            {/* Removed 'View Insights' button as requested */}
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
              className={`flex flex-col bg-white/90 rounded-lg shadow p-4 gap-2 hover:shadow-lg transition cursor-pointer ${selectedWord === item.word ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedWord(item.word)}
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
      {/* Insights Section */}
      <div className="w-full max-w-4xl mt-8 bg-white/10 rounded-2xl p-8 shadow-lg">
        <div className="flex items-center mb-4">
          <span className="text-xl font-bold text-white mr-3">Insights</span>
          <span className="text-base text-blue-200">- Your latest pronunciation feedback</span>
        </div>
        {lastFeedback && (
          <div className="flex flex-col items-center w-full mt-2">
            <div className="bg-gradient-to-br from-blue-900 to-purple-800 rounded-2xl shadow-xl p-8 w-full max-w-md mx-auto mb-8 text-white relative">
              {/* Correction message */}
              <div className="text-2xl font-bold mb-4 text-center">
                {lastFeedback.score >= 85 ? (
                  <span className="text-green-300">Correct!</span>
                ) : (
                  <span className="text-red-300">Try again</span>
                )}
              </div>
              <h2 className="text-2xl font-bold mb-4 text-center">Pronunciation Insights</h2>
              <div className="flex flex-col items-center mb-6">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-5xl font-bold border-8 border-blue-200 mb-2">
                  {lastFeedback.score}
                </div>
                <div className="text-lg font-semibold text-blue-100">/100</div>
                <div className="text-lg font-bold mt-2">{lastFeedback.word}</div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🎤</span>
                  <div className="flex-1">
                    <div className="font-semibold">Clarity</div>
                    <div className="text-blue-200 text-sm">How clear was my pronunciation?</div>
                  </div>
                  <div className="flex-1 flex flex-col items-end">
                    <div className="w-32 h-2 bg-blue-200/30 rounded-full overflow-hidden mb-1">
                      <div className="h-2 bg-blue-400 rounded-full" style={{ width: `${lastFeedback.clarity.value * 10}%` }}></div>
                    </div>
                    <div className="text-xs text-blue-100">{lastFeedback.clarity.text}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl">🎵</span>
                  <div className="flex-1">
                    <div className="font-semibold">Word Stress</div>
                    <div className="text-blue-200 text-sm">Did I stress the syllables correctly?</div>
                  </div>
                  <div className="flex-1 flex flex-col items-end">
                    <div className="w-32 h-2 bg-blue-200/30 rounded-full overflow-hidden mb-1">
                      <div className="h-2 bg-blue-400 rounded-full" style={{ width: `${lastFeedback.wordStress.value * 10}%` }}></div>
                    </div>
                    <div className="text-xs text-blue-100">{lastFeedback.wordStress.text}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl">⏱️</span>
                  <div className="flex-1">
                    <div className="font-semibold">Pace</div>
                    <div className="text-blue-200 text-sm">Was I speaking at an appropriate speed?</div>
                  </div>
                  <div className="flex-1 flex flex-col items-end">
                    <div className="w-32 h-2 bg-blue-200/30 rounded-full overflow-hidden mb-1">
                      <div className="h-2 bg-blue-400 rounded-full" style={{ width: `${lastFeedback.pace.value * 10}%` }}></div>
                    </div>
                    <div className="text-xs text-blue-100">{lastFeedback.pace.text}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl">🎶</span>
                  <div className="flex-1">
                    <div className="font-semibold">Phoneme Accuracy</div>
                    <div className="text-blue-200 text-sm">How precise were my sounds?</div>
                  </div>
                  <div className="flex-1 flex flex-col items-end">
                    <div className="w-32 h-2 bg-blue-200/30 rounded-full overflow-hidden mb-1">
                      <div className="h-2 bg-blue-400 rounded-full" style={{ width: `${lastFeedback.phonemeAccuracy.value * 10}%` }}></div>
                    </div>
                    <div className="text-xs text-blue-100">{lastFeedback.phonemeAccuracy.text}</div>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="font-semibold mb-2">Suggestions</div>
                  <ul className="list-disc list-inside text-blue-100 text-sm space-y-1">
                    {lastFeedback.suggestions.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PronunciationPractice; 