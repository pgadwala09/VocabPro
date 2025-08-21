import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Settings, ExternalLink } from 'lucide-react';

const EnvironmentWarning: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Check if environment variables are configured
    const hasOpenAI = !!import.meta.env.VITE_OPENAI_API_KEY;
    const hasN8n = !!import.meta.env.VITE_N8N_BASE_URL;
    const hasSupabase = !!import.meta.env.VITE_SUPABASE_URL;

    setIsConfigured(hasOpenAI || hasN8n || hasSupabase);
    // Only show warning if no services are configured at all
    setIsVisible(!hasOpenAI && !hasN8n && !hasSupabase);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 bg-yellow-500 border border-yellow-600 rounded-lg shadow-lg">
      <div className="flex items-start p-4">
        <AlertTriangle className="w-5 h-5 text-yellow-800 mt-0.5 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Environment Not Configured
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              The AI debate feature requires environment variables to be configured. 
              Please set up your API keys to enable full functionality.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href="/debate-test"
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              >
                <Settings className="w-3 h-3 mr-1" />
                Run Tests
              </a>
              <button
                onClick={() => {
                  // Copy setup instructions to clipboard
                  navigator.clipboard.writeText(`
# Quick Setup Instructions

1. Create a .env file in your project root
2. Add your API keys:
   VITE_OPENAI_API_KEY=your_openai_key_here
   VITE_N8N_BASE_URL=http://localhost:5678
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key

3. Restart the development server
4. Test at /debate-test
                  `);
                  alert('Setup instructions copied to clipboard!');
                }}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Copy Setup
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-3 flex-shrink-0 text-yellow-800 hover:text-yellow-900"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default EnvironmentWarning;
