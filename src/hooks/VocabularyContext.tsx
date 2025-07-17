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

export const VocabularyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vocabList, setVocabList] = useState<VocabWord[]>(initialVocabList);
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