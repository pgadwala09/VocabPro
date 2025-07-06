import React, { useRef, useState } from 'react';
import { Download, Share2, Mic, Volume2, SpellCheck, RotateCcw, Trash2 } from 'lucide-react';

const TABS = [
  { label: 'Record & Upload', key: 'record', icon: <Mic className="w-5 h-5 mr-2" /> },
  { label: 'Pronunciation', key: 'pronunciation', icon: <Volume2 className="w-5 h-5 mr-2" /> },
  { label: 'Spellings', key: 'spellings', icon: <SpellCheck className="w-5 h-5 mr-2" /> },
];

const VocabPractice: React.FC = () => {
  const [activeTab, setActiveTab] = useState('record');

  // Record & Upload Audio
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // Pronunciation Practice
  const [pronounceWord, setPronounceWord] = useState('');
  const [pronRecording, setPronRecording] = useState(false);
  const [pronAudioUrl, setPronAudioUrl] = useState<string | null>(null);
  const pronMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const pronAudioChunks = useRef<Blob[]>([]);

  // For share confirmation
  const [shareMsg, setShareMsg] = useState('');

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      alert(`Uploaded file: ${e.target.files[0].name}`);
    }
  };

  // Handle recording (General)
  const startRecording = async () => {
    setRecording(true);
    audioChunks.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.current.push(event.data);
    };
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
      setAudioUrl(URL.createObjectURL(audioBlob));
    };
    mediaRecorder.start();
  };
  const stopRecording = () => {
    setRecording(false);
    mediaRecorderRef.current?.stop();
  };

  // Pronunciation: Play correct pronunciation
  const playPronunciation = () => {
    if (!pronounceWord) return;
    const utter = new window.SpeechSynthesisUtterance(pronounceWord);
    utter.lang = 'en-US';
    window.speechSynthesis.speak(utter);
  };

  // Pronunciation: Record user's pronunciation
  const startPronRecording = async () => {
    setPronRecording(true);
    pronAudioChunks.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    pronMediaRecorderRef.current = mediaRecorder;
    mediaRecorder.ondataavailable = (event) => {
      pronAudioChunks.current.push(event.data);
    };
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(pronAudioChunks.current, { type: 'audio/wav' });
      setPronAudioUrl(URL.createObjectURL(audioBlob));
    };
    mediaRecorder.start();
  };
  const stopPronRecording = () => {
    setPronRecording(false);
    pronMediaRecorderRef.current?.stop();
  };

  // Save audio file
  const handleSave = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = 'recording.wav';
      a.click();
    }
  };

  // Share audio URL
  const handleShare = async () => {
    if (audioUrl) {
      try {
        await navigator.clipboard.writeText(audioUrl);
        setShareMsg('Audio link copied to clipboard!');
        setTimeout(() => setShareMsg(''), 2000);
      } catch {
        setShareMsg('Failed to copy link.');
        setTimeout(() => setShareMsg(''), 2000);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="w-full max-w-3xl">
        <h2 className="text-4xl font-extrabold mb-2 text-center text-purple-100 tracking-tight">Vocabulary Practice</h2>
        <p className="text-center text-lg text-blue-100 mb-8">Practice your speaking, pronunciation, and spelling skills in one place.</p>
        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-white/90 rounded-xl shadow-lg overflow-hidden">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center px-6 py-3 font-semibold focus:outline-none transition-all duration-200 text-base
                  ${activeTab === tab.key
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                    : 'bg-transparent text-purple-700 hover:bg-purple-100'}
                `}
                style={{ borderRight: tab.key !== 'spellings' ? '1px solid #e5e7eb' : undefined }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {/* Tab Content */}
        <div className="w-full bg-white rounded-2xl shadow-xl p-8 min-h-[350px]">
          {activeTab === 'record' && (
            <div className="flex flex-col items-center w-full">
              <h3 className="text-xl font-bold mb-6 text-purple-700">Record & Upload Audio</h3>
              {/* Step 1: Upload */}
              <div className="flex items-start w-full mb-6">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold mr-4">1</div>
                <div className="flex-1">
                  <label className="block mb-2 font-medium">Upload Audio/Video</label>
                  <input type="file" accept="audio/*,video/*" onChange={handleFileUpload} className="w-full" />
                </div>
              </div>
              {/* Step 2: Record */}
              <div className="flex items-start w-full mb-6">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mr-4">2</div>
                <div className="flex-1">
                  <label className="block mb-2 font-medium">Or Record Audio</label>
                  {!recording ? (
                    <button onClick={startRecording} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Start Recording</button>
                  ) : (
                    <button onClick={stopRecording} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition">Stop Recording</button>
                  )}
                </div>
              </div>
              {/* Step 3: Playback */}
              <div className="flex items-start w-full">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center font-bold mr-4">3</div>
                <div className="flex-1">
                  <label className="block mb-2 font-medium">Playback</label>
                  {audioUrl ? (
                    <>
                      <audio controls src={audioUrl} className="w-full mb-2" />
                      <div className="flex gap-4 mt-2">
                        <button onClick={handleSave} title="Download" className="p-2 rounded hover:bg-blue-100 transition" aria-label="Download">
                          <Download className="w-6 h-6 text-green-600" />
                        </button>
                        <button onClick={handleShare} title="Share" className="p-2 rounded hover:bg-blue-100 transition" aria-label="Share">
                          <Share2 className="w-6 h-6 text-purple-600" />
                        </button>
                      </div>
                      {shareMsg && <div className="text-xs text-blue-600 mt-2">{shareMsg}</div>}
                    </>
                  ) : (
                    <span className="text-gray-400">No recording yet.</span>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'pronunciation' && (
            <div className="flex flex-col items-center">
              <h3 className="text-xl font-bold mb-4 text-blue-700">Pronunciation</h3>
              <input
                type="text"
                value={pronounceWord}
                onChange={e => setPronounceWord(e.target.value)}
                placeholder="Enter a word to practice"
                className="w-full mb-4 px-4 py-2 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="flex gap-2 mb-4">
                <button
                  onClick={playPronunciation}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  disabled={!pronounceWord}
                >
                  Hear Pronunciation
                </button>
                {!pronRecording ? (
                  <button
                    onClick={startPronRecording}
                    className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
                    disabled={!pronounceWord}
                  >
                    Record Yourself
                  </button>
                ) : (
                  <button
                    onClick={stopPronRecording}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                  >
                    Stop Recording
                  </button>
                )}
              </div>
              {pronAudioUrl && (
                <div className="mt-4 w-full">
                  <audio controls src={pronAudioUrl} className="w-full" />
                  <div className="text-xs text-gray-500 mt-1">Your pronunciation recording</div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'spellings' && (
            <div className="flex flex-col items-center">
              <h3 className="text-xl font-bold mb-4 text-green-700">Spellings</h3>
              <p className="text-gray-600 text-center mb-4">Test and improve your spelling skills. (Coming soon!)</p>
              <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition" disabled>Practice Spellings</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VocabPractice;
