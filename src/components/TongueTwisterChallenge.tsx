import React, { useState, useRef } from 'react';
import { Play, RefreshCw, Share2, BarChart2, Users, Mic, StopCircle, X } from 'lucide-react';
import { useVocabulary } from '../hooks/VocabularyContext';
import { useFeedback } from '../hooks/FeedbackContext';

const ADJECTIVES = ['fuzzy', 'funny', 'fast', 'fearless', 'fancy', 'frantic', 'fabulous', 'fantastic', 'fierce', 'friendly'];
const ADVERBS = ['fiercely', 'frantically', 'frequently', 'fabulously', 'fastidiously', 'fondly', 'forcefully', 'formidably'];
const VERBS = ['fought', 'found', 'fixed', 'flipped', 'flung', 'fumbled', 'faced', 'favored', 'fooled', 'finished'];

const RANDOM_WORDS = [
  'banana', 'giraffe', 'socks', 'juggle', 'pickle', 'zebra', 'umbrella', 'rocket', 'quack', 'breeze',
  'sneeze', 'puzzle', 'whistle', 'bubble', 'crayon', 'dizzy', 'fluffy', 'gobble', 'hurdle', 'jungle'
];

function generateCreativeTwister(vocabList: string[]): string {
  if (!vocabList || vocabList.length < 2) return "Add more words to your vocabulary for a custom tongue twister!";
  // Group words by first letter
  const groups: { [key: string]: string[] } = {};
  vocabList.forEach(word => {
    const first = word[0].toLowerCase();
    if (!groups[first]) groups[first] = [];
    groups[first].push(word);
  });
  // Pick a group with at least 2 words, or fallback to random
  const allGroups = Object.values(groups).filter(g => g.length > 1);
  const chosenGroup = allGroups.length > 0
    ? allGroups[Math.floor(Math.random() * allGroups.length)]
    : vocabList.sort(() => 0.5 - Math.random()).slice(0, 3);
  // Pick random adjective, adverb, verb
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const adv = ADVERBS[Math.floor(Math.random() * ADVERBS.length)];
  const verb = VERBS[Math.floor(Math.random() * VERBS.length)];
  // Build a creative twister
  return `${adj.charAt(0).toUpperCase() + adj.slice(1)} ${chosenGroup[0]} and ${chosenGroup[1]} ${adv} ${verb} ${chosenGroup[2] ? 'with ' + chosenGroup[2] : ''}!`;
}

function generateRandomTwister(): string {
  // Pick 3 random words from RANDOM_WORDS
  const shuffled = [...RANDOM_WORDS].sort(() => 0.5 - Math.random());
  const chosen = shuffled.slice(0, 3);
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const adv = ADVERBS[Math.floor(Math.random() * ADVERBS.length)];
  const verb = VERBS[Math.floor(Math.random() * VERBS.length)];
  return `${adj.charAt(0).toUpperCase() + adj.slice(1)} ${chosen[0]} and ${chosen[1]} ${adv} ${verb} with ${chosen[2]}!`;
}

interface TongueTwisterChallengeProps {
  compact?: boolean;
}

const TongueTwisterChallenge: React.FC<TongueTwisterChallengeProps> = ({ compact = false }) => {
  const { vocabList } = useVocabulary();
  const { addFeedback } = useFeedback();
  const [twister, setTwister] = useState('');
  const [timer, setTimer] = useState(10);
  const [isRecording, setIsRecording] = useState(false);
  const [clarity, setClarity] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);
  const [scoreboard, setScoreboard] = useState<Array<{twister: string, clarity: number, feedback: string, date: string}>>([]);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [twisterSource, setTwisterSource] = useState<'vocab' | 'random'>('vocab');

  // Remove preview section and only generate a twister when starting a challenge or clicking Try New Twister
  // Remove the useEffect that generates a twister on mount

  // Handler to generate a new twister from the selected source
  const generateTwister = () => {
    if (twisterSource === 'vocab') {
      return generateCreativeTwister(vocabList.map(v => v.word));
    } else {
      return generateRandomTwister();
    }
  };

  // Handler for Try New Twister
  const handleNewTwister = () => {
    setTwister(generateTwister());
    setShowFeedback(false);
    setClarity(0);
    setTimer(10);
    setRecordedUrl(null);
  };

  // Handler for Start Challenge
  const handleStartChallenge = () => {
    setTwister(generateTwister());
    setShowFeedback(false);
    setClarity(0);
    setFeedback('');
    setRecordedUrl(null);
    handleStartRecording();
  };

  // Recording logic
  const handleStartRecording = async () => {
    setShowFeedback(false);
    setClarity(0);
    setFeedback('');
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
        // Simulate AI feedback
        const clarityScore = Math.floor(60 + Math.random() * 40);
        setClarity(clarityScore);
        setFeedback(
          clarityScore > 85
            ? 'Excellent clarity! You nailed the tongue twister.'
            : clarityScore > 70
            ? 'Good job! Try to pronounce each word a bit more clearly.'
            : 'Keep practicing! Focus on slowing down and enunciating.'
        );
        setShowFeedback(true);
<<<<<<< HEAD
        // Generate feedback in new format and add to FeedbackContext
        const feedbackObj = {
          word: twister,
          score: clarityScore,
          meaning: { value: 8, text: 'Fully understood' },
          usage: { value: 7, text: 'Mostly appropriate' },
          pronunciation: { value: Math.round(clarityScore / 10), text: clarityScore > 85 ? 'Excellent clarity' : clarityScore > 70 ? 'Good with minor slurs' : 'Needs improvement' },
          suggestions: [
            'Practice longer sentences',
            'Slow down speech for difficult words.'
          ],
          date: new Date().toISOString(),
        };
        addFeedback(feedbackObj);
=======
>>>>>>> origin/main
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert('Microphone access denied or not available.');
    }
  };

  // Update: When feedback is generated, store the attempt
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  // Add to scoreboard when feedback is shown
  React.useEffect(() => {
    if (showFeedback && clarity > 0) {
      setScoreboard(prev => [
        { twister, clarity, feedback, date: new Date().toLocaleString() },
        ...prev
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFeedback]);

  const handlePlayRecording = () => {
    if (audioPlaybackRef.current && recordedUrl) {
      audioPlaybackRef.current.play();
    }
  };

  // Generate preview twisters
  const vocabWords = vocabList.map(v => v.word);
  const vocabTwisters = [
    generateCreativeTwister(vocabWords),
    generateCreativeTwister(vocabWords),
    generateCreativeTwister(vocabWords)
  ];
  const randomTwisters = [
    generateRandomTwister(),
    generateRandomTwister(),
    generateRandomTwister()
  ];

  return (
    <div className={compact ? "flex flex-col items-center justify-center w-full h-full" : "min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-700 via-pink-500 to-pink-300 py-12 px-4"}>
      <div className={compact ? "w-full h-full flex flex-col items-center justify-center p-0 m-0" : "w-full max-w-xl mx-auto"} style={compact ? { maxWidth: 500, maxHeight: 340 } : {}}>
        <h1 className={compact ? "text-2xl font-bold text-white text-center mb-2" : "text-4xl font-bold text-white text-center mb-8 drop-shadow"}>Tongue Twister Challenge</h1>
        {/* Twister Source Toggle */}
        <div className={compact ? "flex justify-center mb-2" : "flex justify-center mb-6"}>
          <select
            className="px-4 py-2 rounded-lg bg-white/80 text-purple-900 font-semibold shadow focus:outline-none"
            value={twisterSource}
            onChange={e => setTwisterSource(e.target.value as 'vocab' | 'random')}
          >
            <option value="vocab">Use My Vocabulary</option>
            <option value="random">AI/Random Words</option>
          </select>
        </div>
        {/* Scoreboard Modal */}
        {showScoreboard && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative">
              <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" onClick={() => setShowScoreboard(false)}><X className="w-6 h-6" /></button>
              <h2 className="text-2xl font-bold text-purple-800 mb-4 text-center">My Best Scoreboard</h2>
              {scoreboard.length === 0 ? (
                <div className="text-center text-gray-500">No attempts yet. Record a challenge to see your scores!</div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-purple-700">
                        <th className="py-2 px-2">Clarity</th>
                        <th className="py-2 px-2">Twister</th>
                        <th className="py-2 px-2">Feedback</th>
                        <th className="py-2 px-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scoreboard
                        .sort((a, b) => b.clarity - a.clarity)
                        .map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-200">
                            <td className="py-1 px-2 font-bold text-green-700">{item.clarity}%</td>
                            <td className="py-1 px-2 text-sm text-gray-800 max-w-[120px] truncate">{item.twister}</td>
                            <td className="py-1 px-2 text-xs text-gray-600 max-w-[120px] truncate">{item.feedback}</td>
                            <td className="py-1 px-2 text-xs text-gray-500">{item.date}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        <div className={compact ? "bg-white/5 rounded-2xl shadow flex flex-col items-center w-full h-full p-2" : "bg-white/10 rounded-3xl shadow-2xl p-8 flex flex-col items-center"}>
          {/* Twister Text */}
          <div className={compact ? "text-lg font-bold text-white text-center mb-2" : "text-2xl font-bold text-white text-center mb-4"}>{twister}</div>
          {/* Timer */}
          <div className={compact ? "flex items-center gap-2 mb-2" : "flex items-center gap-2 mb-4"}>
            <span className="text-white font-semibold">Time Left:</span>
            <span className="text-2xl font-mono text-pink-200">{timer}s</span>
          </div>
          {/* Clarity Meter */}
          <div className={compact ? "w-full max-w-xs mb-2" : "w-full max-w-xs mb-4"}>
            <div className="flex justify-between text-xs text-white mb-1">
              <span>Clarity</span>
              <span>{clarity}%</span>
            </div>
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
              <div className="h-3 bg-green-400 transition-all" style={{ width: `${clarity}%` }}></div>
            </div>
          </div>
          {/* Record/Stop Button */}
          {!isRecording ? (
            <button
              className={compact ? "mt-2 px-6 py-2 rounded-full font-bold text-base shadow flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-600" : "mt-4 px-8 py-3 rounded-full font-bold text-lg shadow flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-600"}
              onClick={handleStartChallenge}
            >
              <Mic className="w-5 h-5" /> Start Challenge
            </button>
          ) : (
            <button
              className={compact ? "mt-2 px-6 py-2 rounded-full font-bold text-base shadow flex items-center gap-2 bg-red-500 text-white" : "mt-4 px-8 py-3 rounded-full font-bold text-lg shadow flex items-center gap-2 bg-red-500 text-white"}
              onClick={handleStopRecording}
            >
              <StopCircle className="w-5 h-5" /> Stop
            </button>
          )}
          {/* Playback Button */}
          {recordedUrl && !isRecording && (
            <button
              className={compact ? "bg-green-500 hover:bg-green-600 rounded-full w-12 h-12 flex items-center justify-center shadow-lg mt-2" : "bg-green-500 hover:bg-green-600 rounded-full w-16 h-16 flex items-center justify-center shadow-lg mt-4"}
              onClick={handlePlayRecording}
              title="Play Your Recording"
            >
              <Play className={compact ? "w-6 h-6 text-white" : "w-8 h-8 text-white"} />
              <audio ref={audioPlaybackRef} src={recordedUrl} />
            </button>
          )}
          {/* Feedback */}
          {showFeedback && (
            <div className={compact ? "mt-2 text-white text-center bg-white/10 rounded-xl p-2 w-full" : "mt-6 text-white text-center bg-white/10 rounded-xl p-4 w-full"}>
              <div className="font-semibold mb-2">AI Feedback</div>
              <div>{feedback}</div>
            </div>
          )}
          {/* Retry & Share Buttons */}
          <div className={compact ? "flex gap-2 mt-2" : "flex gap-4 mt-6"}>
            <button className={compact ? "px-4 py-1 bg-purple-500 text-white rounded-lg font-semibold shadow hover:bg-purple-600 flex items-center gap-2 text-sm" : "px-6 py-2 bg-purple-500 text-white rounded-lg font-semibold shadow hover:bg-purple-600 flex items-center gap-2"} onClick={handleNewTwister}>
              <RefreshCw className="w-5 h-5" /> Try New Twister
            </button>
            <button className={compact ? "px-4 py-1 bg-pink-500 text-white rounded-lg font-semibold shadow hover:bg-pink-600 flex items-center gap-2 text-sm" : "px-6 py-2 bg-pink-500 text-white rounded-lg font-semibold shadow hover:bg-pink-600 flex items-center gap-2"} onClick={() => {/* share logic */}}>
              <Share2 className="w-5 h-5" /> Share
            </button>
          </div>
        </div>
        {!compact && (
          <div className="flex justify-between mt-8 gap-4">
            <button className="flex-1 px-4 py-3 bg-white/20 text-white rounded-lg font-semibold shadow hover:bg-white/30 flex items-center gap-2 justify-center" onClick={handleNewTwister}>
              <RefreshCw className="w-5 h-5" /> Try New Twister
            </button>
            <button className="flex-1 px-4 py-3 bg-white/20 text-white rounded-lg font-semibold shadow hover:bg-white/30 flex items-center gap-2 justify-center" onClick={() => setShowScoreboard(true)}>
              <BarChart2 className="w-5 h-5" /> My Best Scoreboard
            </button>
            <button className="flex-1 px-4 py-3 bg-white/20 text-white rounded-lg font-semibold shadow hover:bg-white/30 flex items-center gap-2 justify-center" onClick={() => {/* challenge friend logic */}}>
              <Users className="w-5 h-5" /> Challenge a Friend
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TongueTwisterChallenge; 