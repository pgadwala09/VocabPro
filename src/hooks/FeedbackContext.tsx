import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Feedback {
  word: string;
  score: number;
  clarity: { value: number; text: string };
  wordStress: { value: number; text: string };
  pace: { value: number; text: string };
  phonemeAccuracy: { value: number; text: string };
  suggestions: string[];
  date: string;
  // Enhanced analysis fields (optional for backward compatibility)
  transcription?: string;
  confidenceScore?: number;
  duration?: number;
  wordsPerMinute?: number;
  averagePitch?: number;
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  masteryStatus?: 'learning' | 'practicing' | 'mastered';
}

interface FeedbackContextType {
  feedbacks: Feedback[];
  addFeedback: (feedback: Feedback) => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const useFeedback = () => {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used within FeedbackProvider');
  return ctx;
};

export const FeedbackProvider = ({ children }: { children: ReactNode }) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  const addFeedback = (feedback: Feedback) => {
    setFeedbacks(prev => [feedback, ...prev]);
  };

  return (
    <FeedbackContext.Provider value={{ feedbacks, addFeedback }}>
      {children}
    </FeedbackContext.Provider>
  );
}; 

