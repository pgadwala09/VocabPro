export interface DictionaryResponse {
  word: string;
  phonetic?: string;
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
    }[];
  }[];
}

export const fetchWordDefinition = async (word: string): Promise<DictionaryResponse | null> => {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      const wordData = data[0];
      return {
        word: wordData.word,
        phonetic: wordData.phonetic,
        meanings: wordData.meanings.map((meaning: any) => ({
          partOfSpeech: meaning.partOfSpeech,
          definitions: meaning.definitions.map((def: any) => ({
            definition: def.definition,
            example: def.example
          }))
        }))
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching word definition:', error);
    return null;
  }
};

export const getWordMeaning = (dictionaryData: DictionaryResponse | null): string => {
  if (!dictionaryData || !dictionaryData.meanings || dictionaryData.meanings.length === 0) {
    return 'Meaning not available';
  }
  
  const firstMeaning = dictionaryData.meanings[0];
  if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
    return firstMeaning.definitions[0].definition;
  }
  
  return 'Meaning not available';
};

export const getWordExample = (dictionaryData: DictionaryResponse | null): string => {
  if (!dictionaryData || !dictionaryData.meanings || dictionaryData.meanings.length === 0) {
    return 'Example not available';
  }
  
  // Look for an example in any meaning
  for (const meaning of dictionaryData.meanings) {
    if (meaning.definitions) {
      for (const def of meaning.definitions) {
        if (def.example) {
          return def.example;
        }
      }
    }
  }
  
  return 'Example not available';
}; 