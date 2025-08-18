import React, { useState } from 'react';
import { runIntegrationTests } from '../test-integrations';

export function IntegrationTest() {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    try {
      const results = await runIntegrationTests();
      setTestResults(results);
    } catch (error) {
      setTestResults({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">MCP Integration Tests</h2>
      
      <button
        onClick={runTests}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4 disabled:opacity-50"
      >
        {loading ? 'Running Tests...' : 'Run Integration Tests'}
      </button>

      {testResults && (
        <div className="space-y-4">
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2">GitHub MCP Integration</h3>
            <div className={`p-2 rounded ${testResults.github?.success ? 'bg-green-100' : 'bg-red-100'}`}>
              <pre className="text-sm">{JSON.stringify(testResults.github, null, 2)}</pre>
            </div>
          </div>

          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2">Supabase Integration</h3>
            <div className={`p-2 rounded ${testResults.supabase?.success ? 'bg-green-100' : 'bg-red-100'}`}>
              <pre className="text-sm">{JSON.stringify(testResults.supabase, null, 2)}</pre>
            </div>
          </div>

          {testResults.error && (
            <div className="border rounded p-4 bg-red-100">
              <h3 className="font-semibold mb-2 text-red-800">Error</h3>
              <pre className="text-sm text-red-800">{JSON.stringify(testResults.error, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Environment Variables Status</h3>
        <div className="text-sm space-y-1">
          <div>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Not set'}</div>
          <div>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}</div>
        </div>
      </div>
    </div>
  );
}





