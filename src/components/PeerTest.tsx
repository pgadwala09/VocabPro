import React, { useEffect, useRef, useState } from 'react';
import Peer, { MediaConnection } from 'peerjs';

export default function PeerTest() {
  const [peerId, setPeerId] = useState<string>('');
  const [remoteId, setRemoteId] = useState<string>('');
  const [status, setStatus] = useState<string>('Initializing...');
  const [error, setError] = useState<string | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const peer = new Peer({
      debug: 2,
    });
    peerRef.current = peer;

    peer.on('open', (id) => {
      setPeerId(id);
      setStatus('Ready');
    });

    peer.on('error', (err) => {
      setError(err.message);
      setStatus('Error');
    });

    peer.on('call', async (call) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        call.answer(stream);
        call.on('stream', (remoteStream) => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current.play().catch(() => {});
          }
        });
        callRef.current = call;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get local audio');
      }
    });

    return () => {
      try { callRef.current?.close(); } catch {}
      try { peerRef.current?.destroy(); } catch {}
    };
  }, []);

  const startCall = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const call = peerRef.current?.call(remoteId.trim(), stream);
      if (!call) {
        setError('Failed to start call');
        return;
      }
      call.on('stream', (remoteStream) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch(() => {});
        }
      });
      callRef.current = call;
      setStatus('In call');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start call');
    }
  };

  const endCall = () => {
    try { callRef.current?.close(); } catch {}
    callRef.current = null;
    setStatus('Ready');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">PeerJS WebRTC Test</h2>

      <div className="mb-4 text-sm space-y-1">
        <div>Status: {status}</div>
        <div>Your Peer ID: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{peerId || '...'}</span></div>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Remote Peer ID"
          value={remoteId}
          onChange={(e) => setRemoteId(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
        />
        <button onClick={startCall} className="bg-blue-600 text-white px-4 py-2 rounded">Call</button>
        <button onClick={endCall} className="bg-gray-600 text-white px-4 py-2 rounded">End</button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <div className="text-sm text-gray-600 mb-1">Local Audio (muted)</div>
          <audio ref={localAudioRef} muted controls className="w-full" />
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-1">Remote Audio</div>
          <audio ref={remoteAudioRef} controls className="w-full" />
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded text-sm">{error}</div>
      )}

      <div className="mt-6 p-3 bg-gray-100 rounded text-sm">
        How to test:
        <ol className="list-decimal ml-5 mt-1 space-y-1">
          <li>Open this page in two tabs/devices.</li>
          <li>Copy the Peer ID from Tab A and paste into Tab B, click Call.</li>
          <li>Allow microphone permission. You should hear audio.</li>
        </ol>
      </div>
    </div>
  );
}










