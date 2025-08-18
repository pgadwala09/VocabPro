import React, { createContext, useContext, useState } from 'react';

interface RecordingContextType {
  audioUrl: string | null;
  setAudioUrl: (url: string | null) => void;
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

export const RecordingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  return (
    <RecordingContext.Provider value={{ audioUrl, setAudioUrl }}>
      {children}
    </RecordingContext.Provider>
  );
};

export const useRecording = () => {
  const context = useContext(RecordingContext);
  if (!context) throw new Error('useRecording must be used within a RecordingProvider');
  return context;
}; 