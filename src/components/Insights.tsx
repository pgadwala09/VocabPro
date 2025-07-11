import React from 'react';
import { useFeedback } from '../hooks/FeedbackContext';

const FeedbackCard = ({ feedback }) => (
  <div className="bg-gradient-to-br from-blue-900 to-purple-800 rounded-2xl shadow-xl p-8 w-full max-w-md mx-auto mb-8 text-white relative">
    <h2 className="text-2xl font-bold mb-4 text-center">Pronunciation Insights</h2>
    <div className="flex flex-col items-center mb-6">
      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-5xl font-bold border-8 border-blue-200 mb-2">
        {feedback.score}
      </div>
      <div className="text-lg font-semibold text-blue-100">/100</div>
      <div className="text-lg font-bold mt-2">{feedback.word}</div>
    </div>
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-xl">🎤</span>
        <div className="flex-1">
          <div className="font-semibold">Clarity</div>
          <div className="text-blue-200 text-sm">How clear was my pronunciation?</div>
        </div>
        <div className="flex-1 flex flex-col items-end">
          <div className="w-32 h-2 bg-blue-200/30 rounded-full overflow-hidden mb-1">
            <div className="h-2 bg-blue-400 rounded-full" style={{ width: `${feedback.clarity.value * 10}%` }}></div>
          </div>
          <div className="text-xs text-blue-100">{feedback.clarity.text}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xl">🎵</span>
        <div className="flex-1">
          <div className="font-semibold">Word Stress</div>
          <div className="text-blue-200 text-sm">Did I stress the syllables correctly?</div>
        </div>
        <div className="flex-1 flex flex-col items-end">
          <div className="w-32 h-2 bg-blue-200/30 rounded-full overflow-hidden mb-1">
            <div className="h-2 bg-blue-400 rounded-full" style={{ width: `${feedback.wordStress.value * 10}%` }}></div>
          </div>
          <div className="text-xs text-blue-100">{feedback.wordStress.text}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xl">⏱️</span>
        <div className="flex-1">
          <div className="font-semibold">Pace</div>
          <div className="text-blue-200 text-sm">Was I speaking at an appropriate speed?</div>
        </div>
        <div className="flex-1 flex flex-col items-end">
          <div className="w-32 h-2 bg-blue-200/30 rounded-full overflow-hidden mb-1">
            <div className="h-2 bg-blue-400 rounded-full" style={{ width: `${feedback.pace.value * 10}%` }}></div>
          </div>
          <div className="text-xs text-blue-100">{feedback.pace.text}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xl">🎶</span>
        <div className="flex-1">
          <div className="font-semibold">Phoneme Accuracy</div>
          <div className="text-blue-200 text-sm">How precise were my sounds?</div>
        </div>
        <div className="flex-1 flex flex-col items-end">
          <div className="w-32 h-2 bg-blue-200/30 rounded-full overflow-hidden mb-1">
            <div className="h-2 bg-blue-400 rounded-full" style={{ width: `${feedback.phonemeAccuracy.value * 10}%` }}></div>
          </div>
          <div className="text-xs text-blue-100">{feedback.phonemeAccuracy.text}</div>
        </div>
      </div>
      <div className="mt-6">
        <div className="font-semibold mb-2">Suggestions</div>
        <ul className="list-disc list-inside text-blue-100 text-sm space-y-1">
          {feedback.suggestions.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>
    </div>
    <div className="flex justify-center mt-8">
      <button className="px-8 py-3 bg-blue-400 hover:bg-blue-500 text-white font-bold rounded-lg text-lg shadow">Re-practice Now</button>
    </div>
  </div>
);

const Insights = () => {
  const { feedbacks } = useFeedback();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 py-12 px-4">
      <h1 className="text-4xl font-bold text-white text-center mb-12">Your Pronunciation Insights</h1>
      {feedbacks.length === 0 ? (
        <div className="text-center text-blue-200 text-xl mt-24">No feedback yet. Practice words in Echo Match to see your insights!</div>
      ) : (
        feedbacks.map((fb, idx) => <FeedbackCard key={fb.word + fb.date + idx} feedback={fb} />)
      )}
    </div>
  );
};

export default Insights; 