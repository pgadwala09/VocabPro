import React, { useState } from 'react';

export function NetworkTest() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testNetwork = async () => {
    setLoading(true);
    setResults({});

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const tests = {};

    try {
      // Test 1: Basic fetch to Supabase URL
      console.log('Testing basic fetch to:', supabaseUrl);
      const response = await fetch(supabaseUrl);
      tests.basicFetch = {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      };
    } catch (error) {
      tests.basicFetch = { error: error.message };
    }

    try {
      // Test 2: Fetch with auth headers
      console.log('Testing auth endpoint...');
      const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });
      tests.authEndpoint = {
        status: authResponse.status,
        ok: authResponse.ok,
        statusText: authResponse.statusText
      };
    } catch (error) {
      tests.authEndpoint = { error: error.message };
    }

    try {
      // Test 3: Test with Supabase client
      console.log('Testing Supabase client...');
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, import.meta.env.VITE_SUPABASE_ANON_KEY);
      const { data, error } = await supabase.auth.getSession();
      tests.supabaseClient = { data: !!data, error: error?.message };
    } catch (error) {
      tests.supabaseClient = { error: error.message };
    }

    setResults(tests);
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Network Connectivity Test</h2>
      
      <button
        onClick={testNetwork}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 mb-4"
      >
        {loading ? 'Testing...' : 'Test Network Connectivity'}
      </button>

      {results && (
        <div className="space-y-4">
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2">Environment Variables:</h3>
            <div className="text-sm space-y-1">
              <div>URL: {import.meta.env.VITE_SUPABASE_URL || 'Not set'}</div>
              <div>Key exists: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Yes' : 'No'}</div>
            </div>
          </div>

          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2">Test Results:</h3>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="mt-4 p-4 bg-yellow-100 rounded">
        <h3 className="font-semibold mb-2">Troubleshooting Steps:</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Check if your Supabase project is active (not paused)</li>
          <li>Verify the URL and key in your .env file</li>
          <li>Check if you have internet connectivity</li>
          <li>Try accessing Supabase dashboard directly</li>
          <li>Check browser console for CORS errors</li>
        </ol>
      </div>
    </div>
  );
}





