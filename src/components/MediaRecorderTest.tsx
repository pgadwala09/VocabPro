import React, { useEffect, useRef, useState } from 'react';

const getSupportedMimeType = (): string | undefined => {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
    'audio/wav',
  ];
  // @ts-ignore - MediaRecorder may not exist at type time
  if (typeof MediaRecorder === 'undefined') return undefined;
  // @ts-ignore - isTypeSupported is static
  for (const t of types) if ((MediaRecorder as any).isTypeSupported?.(t)) return t;
  return undefined;
};

export default function MediaRecorderTest() {
  const [hasSupport, setHasSupport] = useState<boolean>(false);
  const [permission, setPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | undefined>(undefined);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    // Detect availability
    // @ts-ignore
    setHasSupport(typeof MediaRecorder !== 'undefined');
    setMimeType(getSupportedMimeType());

    // Probe mic permission if supported
    if (navigator.permissions && (navigator.permissions as any).query) {
      (navigator.permissions as any)
        .query({ name: 'microphone' as PermissionName })
        .then((res: any) => setPermission(res.state))
        .catch(() => setPermission('unknown'));
    }
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      setAudioUrl(null);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // @ts-ignore
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = rec;

      rec.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      rec.onstop = () => {
        try {
          const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to create recording blob');
        } finally {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
          }
        }
      };

      rec.start();
      setRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  };

  const stopRecording = () => {
    try {
      mediaRecorderRef.current?.stop();
      setRecording(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">MediaRecorder Test</h2>

      <div className="mb-4 text-sm">
        <div>Support: {hasSupport ? '✅ Yes' : '❌ No (polyfill should provide it)'}</div>
        <div>Permission (probe): {permission}</div>
        <div>Chosen MIME type: {mimeType || 'auto'}</div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={startRecording}
          disabled={recording}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Start Recording
        </button>
        <button
          onClick={stopRecording}
          disabled={!recording}
          className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Stop Recording
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded mb-4 text-sm">{error}</div>
      )}

      {audioUrl && (
        <div className="space-y-2">
          <audio src={audioUrl} controls className="w-full" />
          <a
            href={audioUrl}
            download={`recording-${Date.now()}.webm`}
            className="inline-block bg-gray-200 px-3 py-1 rounded"
          >
            Download Recording
          </a>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-100 rounded text-sm">
        <div>Debug:</div>
        <pre className="whitespace-pre-wrap break-all">{JSON.stringify({
          hasSupport,
          permission,
          mimeType,
        }, null, 2)}</pre>
      </div>
    </div>
  );
}










