import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon, FileText, Mic, File, Music, Brain, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Dialog } from '@headlessui/react';
import { LibraryItem } from '../App';
import { useNavigate } from 'react-router-dom';
import { useVocabulary } from '../hooks/VocabularyContext';

interface VocabPracticeProps {
  libraryItems: LibraryItem[];
  setLibraryItems: React.Dispatch<React.SetStateAction<LibraryItem[]>>;
}

const optionTiles = [
  { label: 'Upload File', icon: <Upload className="w-6 h-6 mb-1 text-purple-700" /> },
  { label: 'Paste a Link', icon: <LinkIcon className="w-6 h-6 mb-1 text-blue-700" /> },
  { label: 'Paste Screenshot', icon: <ImageIcon className="w-6 h-6 mb-1 text-green-700" /> },
  { label: 'Paste Text', icon: <FileText className="w-6 h-6 mb-1 text-indigo-700" /> },
  { label: 'Record Audio', icon: <Mic className="w-6 h-6 mb-1 text-pink-700" /> },
];

const VocabPractice: React.FC<VocabPracticeProps> = ({ libraryItems, setLibraryItems }) => {
  const [page, setPage] = useState(0);
  const itemsPerPage = 6;
  const pageCount = Math.ceil(libraryItems.length / itemsPerPage);
  const pagedItems = libraryItems.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  const { user } = useAuth();
  const avatarUrl = user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name || user?.email || '';
  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const navigate = useNavigate();
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [isScreenshotDialogOpen, setIsScreenshotDialogOpen] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const { vocabList, setVocabList } = useVocabulary();

  const handleNext = () => {
    if (page < pageCount - 1) setPage(page + 1);
    else navigate('/pronunciation');
  };
  const handleClear = () => {
    setLibraryItems([]);
    setPage(0);
  };

  // Add link to library
  const handleAddLink = () => {
    if (linkInput.trim()) {
      setLibraryItems([
        ...libraryItems,
        {
          name: linkInput,
          type: 'link',
          icon: <LinkIcon className="w-6 h-6 text-blue-600" />,
        },
      ]);
      setLinkInput('');
      setIsLinkDialogOpen(false);
    }
  };

  // Add screenshot to library
  const handleAddScreenshot = () => {
    if (screenshotFile) {
      setLibraryItems([
        ...libraryItems,
        {
          name: screenshotFile.name,
          type: 'screenshot',
          icon: <ImageIcon className="w-6 h-6 text-green-600" />,
        },
      ]);
      setScreenshotFile(null);
      setIsScreenshotDialogOpen(false);
    }
  };

  // Add text to library and vocab
  const handleAddText = () => {
    if (textInput.trim()) {
      setLibraryItems([
        ...libraryItems,
        {
          name: textInput.slice(0, 20) + (textInput.length > 20 ? '...' : ''),
          type: 'text',
          icon: <FileText className="w-6 h-6 text-indigo-700" />,
        },
      ]);
      // Add to vocabList if not already present
      const word = textInput.trim();
      if (!vocabList.some(v => v.word.toLowerCase() === word.toLowerCase())) {
        setVocabList([
          ...vocabList,
          {
            word,
            meaning: `Meaning for ${word}.`,
            sentence: `Sample sentence using ${word}.`,
          },
        ]);
      }
      setTextInput('');
      setIsTextDialogOpen(false);
    }
  };

  // Audio recording handlers
  const handleStartRecording = async () => {
    setAudioURL(null);
    setAudioBlob(null);
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
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
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
      setIsRecording(false);
    }
  };

  const handleAddAudio = () => {
    if (audioBlob && audioURL) {
      setLibraryItems([
        ...libraryItems,
        {
          name: `Recording-${new Date().toLocaleTimeString()}.webm`,
          type: 'audio',
          icon: <Music className="w-6 h-6 text-blue-600" />,
        },
      ]);
      setAudioBlob(null);
      setAudioURL(null);
      setIsRecordDialogOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-8 py-6 bg-white/10 shadow-md">
        {/* Logo (same as Dashboard) */}
        <div className="flex items-center flex-1">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
              <Brain className="w-7 h-7 text-white" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div className="absolute inset-0 w-12 h-12 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-2xl blur-lg -z-10"></div>
          </div>
          <div className="flex flex-col ml-4">
            <span className="text-2xl font-bold text-white tracking-tight">
              Vocab
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Pro</span>
            </span>
            <span className="text-xs text-gray-300 font-medium tracking-wide">Learn • Practice • Excel</span>
          </div>
        </div>
        {/* Center Title */}
        <div className="flex-1 flex justify-center">
          <h1 className="text-2xl md:text-3xl font-bold text-purple-900 bg-white/70 px-6 py-2 rounded-xl shadow-sm">
            Vocabulary Practice
          </h1>
        </div>
        {/* Profile Picture (same as Dashboard) */}
        <div className="flex items-center flex-1 justify-end">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-12 h-12 rounded-full border-2 border-blue-400 shadow-md object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full border-2 border-blue-400 shadow-md bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-xl font-bold">
              {initials}
            </div>
          )}
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start pt-12 px-4 w-full">
        {/* Step 1: Choose an Option */}
        <div className="w-full max-w-3xl mb-12">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold mr-3">1</div>
            <span className="text-xl font-semibold text-white">Choose an Option</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {optionTiles.map(tile => (
              <div
                key={tile.label}
                className="flex flex-col items-center bg-white/90 rounded-lg shadow p-3 hover:shadow-lg cursor-pointer transition min-w-[90px]"
                onClick={() => {
                  if (tile.label === 'Paste a Link') setIsLinkDialogOpen(true);
                  else if (tile.label === 'Paste Screenshot') setIsScreenshotDialogOpen(true);
                  else if (tile.label === 'Paste Text') setIsTextDialogOpen(true);
                  else if (tile.label === 'Record Audio') setIsRecordDialogOpen(true);
                }}
              >
                {tile.icon}
                <span className="text-xs font-semibold text-gray-800 text-center whitespace-nowrap">{tile.label}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Link Dialog */}
        <Dialog open={isLinkDialogOpen} onClose={() => setIsLinkDialogOpen(false)}>
          <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div className="fixed inset-0 bg-black opacity-30" onClick={() => setIsLinkDialogOpen(false)} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-8 z-50">
              <h2 className="text-xl font-bold mb-4 text-blue-700">Paste a Link</h2>
              <input
                type="text"
                className="w-full border border-blue-300 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Paste your link here..."
                value={linkInput}
                onChange={e => setLinkInput(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300"
                  onClick={() => setIsLinkDialogOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                  onClick={handleAddLink}
                  disabled={!linkInput.trim()}
                >
                  Add Link
                </button>
              </div>
            </div>
          </div>
        </Dialog>
        {/* Screenshot Dialog */}
        <Dialog open={isScreenshotDialogOpen} onClose={() => setIsScreenshotDialogOpen(false)}>
          <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div className="fixed inset-0 bg-black opacity-30" onClick={() => setIsScreenshotDialogOpen(false)} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-8 z-50">
              <h2 className="text-xl font-bold mb-4 text-green-700">Paste Screenshot</h2>
              <input
                type="file"
                accept="image/*"
                className="w-full border border-green-300 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-green-400"
                onChange={e => setScreenshotFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
              />
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300"
                  onClick={() => { setIsScreenshotDialogOpen(false); setScreenshotFile(null); }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                  onClick={handleAddScreenshot}
                  disabled={!screenshotFile}
                >
                  Add Screenshot
                </button>
              </div>
            </div>
          </div>
        </Dialog>
        {/* Text Dialog */}
        <Dialog open={isTextDialogOpen} onClose={() => setIsTextDialogOpen(false)}>
          <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div className="fixed inset-0 bg-black opacity-30" onClick={() => setIsTextDialogOpen(false)} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-8 z-50">
              <h2 className="text-xl font-bold mb-4 text-indigo-700">Paste Text</h2>
              <textarea
                className="w-full border border-indigo-300 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Paste or type your text here..."
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                rows={4}
              />
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300"
                  onClick={() => { setIsTextDialogOpen(false); setTextInput(''); }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
                  onClick={handleAddText}
                  disabled={!textInput.trim()}
                >
                  Add Text
                </button>
              </div>
            </div>
          </div>
        </Dialog>
        {/* Record Audio Dialog */}
        <Dialog open={isRecordDialogOpen} onClose={() => { setIsRecordDialogOpen(false); setAudioURL(null); setAudioBlob(null); setIsRecording(false); }}>
          <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div className="fixed inset-0 bg-black opacity-30" onClick={() => setIsRecordDialogOpen(false)} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-8 z-50 flex flex-col items-center">
              <h2 className="text-xl font-bold mb-4 text-blue-700">Record Audio</h2>
              <div className="flex flex-col items-center w-full mb-4">
                {!isRecording && !audioURL && (
                  <button
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition mb-2"
                    onClick={handleStartRecording}
                  >
                    Start Recording
                  </button>
                )}
                {isRecording && (
                  <button
                    className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold shadow hover:bg-red-700 transition mb-2"
                    onClick={handleStopRecording}
                  >
                    Stop
                  </button>
                )}
                {audioURL && !isRecording && (
                  <audio controls src={audioURL} className="w-full mt-2" />
                )}
              </div>
              <div className="flex justify-end gap-2 w-full">
                <button
                  className="px-4 py-2 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300"
                  onClick={() => { setIsRecordDialogOpen(false); setAudioURL(null); setAudioBlob(null); setIsRecording(false); }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                  onClick={handleAddAudio}
                  disabled={!audioBlob || isRecording}
                >
                  Add Audio
                </button>
              </div>
            </div>
          </div>
        </Dialog>
        {/* Step 2: Upload Your Source */}
        <div className="w-full max-w-3xl mb-12">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-400 text-white flex items-center justify-center font-bold mr-3">2</div>
            <span className="text-xl font-semibold text-white">Upload Your Source</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-white/80 rounded-2xl border-2 border-dashed border-blue-400 h-48 shadow-inner cursor-pointer transition hover:bg-blue-50">
            <span className="text-xl font-bold text-blue-700 mb-1">Browse Files</span>
            <span className="text-sm text-blue-400">or drag files in</span>
          </div>
        </div>
        {/* Library Section */}
        <div className="w-full max-w-3xl mb-12">
          <div className="flex items-center mb-4">
            <span className="text-xl font-bold text-white mr-3">Library</span>
            <span className="text-base text-blue-200">- Documents you have saved</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {pagedItems.map(item => (
              <div key={item.name} className="flex items-center bg-white/90 rounded-lg shadow p-4 gap-3 hover:shadow-lg transition">
                <div>{item.icon}</div>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800 text-sm truncate max-w-[120px]">{item.name}</span>
                  <span className="text-xs text-gray-500 capitalize">{item.type}</span>
                </div>
              </div>
            ))}
            {pagedItems.length === 0 && (
              <div className="col-span-3 text-center text-gray-400 py-8">No documents in your library.</div>
            )}
          </div>
        </div>
        {/* Next and Clear buttons at far right of the page */}
        <div className="w-full flex justify-end pr-8 mb-12">
          <div className="flex gap-3">
            <button
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition disabled:opacity-50"
              onClick={() => navigate('/pronunciation')}
              disabled={libraryItems.length === 0}
            >
              Next
            </button>
            <button
              className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold shadow hover:bg-red-600 transition disabled:opacity-50"
              onClick={handleClear}
              disabled={libraryItems.length === 0}
            >
              Clear
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VocabPractice;
