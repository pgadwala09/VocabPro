import React from 'react';

const LiveDebatesStreamlit: React.FC = () => {
  const base = (import.meta as any).env?.VITE_STREAMLIT_BASE || 'http://localhost:8501';
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-4">Live Debates (Streamlit)</h1>
        <div className="w-full h-[80vh] rounded-lg overflow-hidden shadow-lg border border-white/10">
          <iframe
            src={`${base}/?embed=true`}
            title="Live Debates (Streamlit)"
            className="w-full h-full border-0 bg-white"
            allow="autoplay"
          />
        </div>
        <p className="text-white/70 mt-3 text-sm">
          If this is blank, start Streamlit: <code>./streamlit_app/run-streamlit.ps1</code> then refresh. Or open it directly: 
          <a className="underline" href={`${base}`} target="_blank" rel="noreferrer">{base}</a>
        </p>
      </div>
    </div>
  );
};

export default LiveDebatesStreamlit;


