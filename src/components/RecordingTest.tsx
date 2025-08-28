import React, { useState, useRef } from 'react';
import { Mic, MicOff, Play, Pause, Volume2 } from 'lucide-react';

const RecordingTest: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      console.log('🎤 Starting recording test...');
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log('📦 Audio chunk:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('🛑 Recording stopped, processing...');
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        console.log('📊 Audio blob created:', audioBlob.size, 'bytes');
        
        setAudioUrl(URL.createObjectURL(audioBlob));
        setIsRecording(false);
        setIsProcessing(true);
        
        // Test upload and transcription
        await testUploadAndTranscription(audioBlob);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setIsTimerRunning(true);
      setTimeRemaining(60);
      
      // Start countdown timer
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      console.log('✅ Recording started');
    } catch (error) {
      console.error('❌ Recording error:', error);
      setError(`Recording failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const stopRecording = () => {
    console.log('🛑 Stopping recording...');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => {
        track.stop();
        console.log('🔇 Track stopped:', track.kind);
      });
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsTimerRunning(false);
  };

  const testUploadAndTranscription = async (audioBlob: Blob) => {
    try {
      console.log('🔄 Testing upload and transcription...');
      
      // Test upload
      const formData = new FormData();
      formData.append('file', audioBlob, 'test-recording.webm');
      formData.append('debateId', 'test-debate');
      formData.append('turnNumber', '1');
      formData.append('speaker', 'user_pro');
      
      const uploadResponse = await fetch('/api/human-upload', {
        method: 'POST',
        body: formData
      });
      
      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json();
        console.log('✅ Upload successful:', uploadResult);
      } else {
        console.warn('⚠️ Upload failed:', uploadResponse.status);
      }
      
      // Test transcription
      const transcribeFormData = new FormData();
      transcribeFormData.append('file', audioBlob);
      
      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: transcribeFormData
      });
      
      if (transcribeResponse.ok) {
        const transcribeResult = await transcribeResponse.json();
        setTranscript(transcribeResult.text);
        console.log('✅ Transcription successful:', transcribeResult.text);
      } else {
        console.warn('⚠️ Transcription failed:', transcribeResponse.status);
        setTranscript('Transcription failed - using fallback text');
      }
      
    } catch (error) {
      console.error('❌ Upload/transcription error:', error);
      setError(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(err => {
        console.error('Playback error:', err);
        setError(`Playback failed: ${err.message}`);
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Recording Test Component</h2>
      
      <div className="mb-6 p-4 bg-gray-100 rounded-md">
        <h3 className="font-semibold mb-2">Recording Status:</h3>
        <ul className="text-sm space-y-1">
          <li>• Microphone Access: <span className="text-blue-600">Available</span></li>
          <li>• MediaRecorder API: <span className="text-blue-600">Available</span></li>
          <li>• Upload Endpoint: <span className="text-green-600">/api/human-upload</span></li>
          <li>• Transcription Endpoint: <span className="text-green-600">/api/transcribe</span></li>
        </ul>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-3 mb-4">
          {!isRecording && !isProcessing ? (
            <button
              onClick={startRecording}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Mic className="w-5 h-5" />
              Start Recording Test
            </button>
          ) : isRecording ? (
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-green-500/20 text-green-700 rounded-lg text-sm font-medium animate-pulse">
                🎤 Recording... {formatTime(timeRemaining)}
              </div>
              <button
                onClick={stopRecording}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Pause className="w-4 h-4" />
                Stop
              </button>
            </div>
          ) : (
            <div className="px-4 py-2 bg-yellow-500/20 text-yellow-700 rounded-lg text-sm font-medium">
              ⏳ Processing...
            </div>
          )}
        </div>

        {audioUrl && (
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={playAudio}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Play Recording
            </button>
            <span className="text-sm text-gray-600">
              Audio recorded successfully
            </span>
          </div>
        )}
      </div>

      {transcript && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="font-semibold text-green-800 mb-2">Transcription Result:</h3>
          <p className="text-green-700">{transcript}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="font-semibold text-red-800 mb-2">Error:</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="text-sm text-gray-600">
        <p>• Recording will automatically stop after 60 seconds</p>
        <p>• Audio is uploaded to server and transcribed</p>
        <p>• Check browser console for detailed logs</p>
      </div>
    </div>
  );
};

export default RecordingTest;

