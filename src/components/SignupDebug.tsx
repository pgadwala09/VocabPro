import React, { useState } from 'react';
import { signUp, supabase } from '../lib/supabase';

export function SignupDebug() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testSignup = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('=== SIGNUP DEBUG START ===');
      console.log('Testing signup with:', { email, password, name });
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
      console.log('Supabase Key length:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length);
      
      // Test basic Supabase connection first
      console.log('Testing Supabase connection...');
      const { data: testData, error: testError } = await supabase.auth.getSession();
      console.log('Connection test result:', { testData, testError });
      
      // Now test signup
      console.log('Testing signup...');
      const response = await signUp(email, password, name);
      console.log('Signup response:', response);
      setResult(response);
      
      console.log('=== SIGNUP DEBUG END ===');
    } catch (error) {
      console.error('Signup test error:', error);
      setResult({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      console.log('Testing basic Supabase connection...');
      const { data, error } = await supabase.auth.getSession();
      console.log('Connection result:', { data, error });
      setResult({ connectionTest: { data, error } });
    } catch (error) {
      console.error('Connection test error:', error);
      setResult({ connectionError: error });
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Signup Debug Test</h2>
      
      <div className="space-y-4 mb-6">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <div className="flex space-x-2">
          <button
            onClick={testConnection}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Test Connection
          </button>
          <button
            onClick={testSignup}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Signup'}
          </button>
        </div>
      </div>

      {result && (
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Result:</h3>
          <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Environment Variables:</h3>
        <div className="text-sm space-y-1">
          <div>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Not set'}</div>
          <div>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}</div>
          <div>URL Length: {import.meta.env.VITE_SUPABASE_URL?.length || 0}</div>
          <div>Key Length: {import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0}</div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-yellow-100 rounded">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Fill in the form above</li>
          <li>Click "Test Connection" first to verify Supabase connection</li>
          <li>Click "Test Signup" to test the signup process</li>
          <li>Check the browser console (F12) for detailed logs</li>
          <li>Share the results with me</li>
        </ol>
      </div>
    </div>
  );
}
