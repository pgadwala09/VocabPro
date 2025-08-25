import React, { createContext, useContext, useState } from 'react';

export interface VocabWord {
  word: string;
  meaning: string;
  sentence: string;
  image?: string;
  audio?: string;
}

interface VocabularyContextType {
  vocabList: VocabWord[];
  setVocabList: (list: VocabWord[]) => void;
}

const VocabularyContext = createContext<VocabularyContextType | undefined>(undefined);

const initialVocabList: VocabWord[] = [];

// Load from localStorage on initialization
const loadVocabFromStorage = (): VocabWord[] => {
  try {
    const stored = localStorage.getItem('vocabList');
    return stored ? JSON.parse(stored) : initialVocabList;
  } catch {
    return initialVocabList;
  }
};

export const VocabularyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vocabList, setVocabListState] = useState<VocabWord[]>(loadVocabFromStorage);

  // Custom setter that also saves to localStorage
  const setVocabList = (newList: VocabWord[]) => {
    setVocabListState(newList);
    try {
      localStorage.setItem('vocabList', JSON.stringify(newList));
    } catch (error) {
      console.error('Failed to save vocab list to localStorage:', error);
    }
  };
  return (
    <VocabularyContext.Provider value={{ vocabList, setVocabList }}>
      {children}
    </VocabularyContext.Provider>
  );
};

export const useVocabulary = () => {
  const context = useContext(VocabularyContext);
  if (!context) throw new Error('useVocabulary must be used within a VocabularyProvider');
  return context;
};
