import natural from 'natural';

const tokenizer = new natural.WordTokenizer();
const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');

export function analyzeSentimentLocal(text: string): { score: number; comparative: number } {
  if (!text || !text.trim()) return { score: 0, comparative: 0 };
  const tokens = tokenizer.tokenize(text);
  const score = analyzer.getSentiment(tokens);
  const comparative = tokens.length ? score / tokens.length : 0;
  return { score, comparative };
}




