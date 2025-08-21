import React, { useState, useEffect } from 'react';
import { runAllTests, quickHealthCheck, testEnvironmentVariables, testSupabaseConnection, testN8nWebhook } from '../lib/debate-test';
import { Bug, Play, RefreshCw, X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  timestamp?: string;
}

const DebateDebug: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  // Intercept console logs for debug panel
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      originalLog(...args);
      setLogs(prev => [...prev, `[INFO] ${args.join(' ')}`]);
    };

    console.error = (...args) => {
      originalError(...args);
      setLogs(prev => [...prev, `[ERROR] ${args.join(' ')}`]);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      setLogs(prev => [...prev, `[WARN] ${args.join(' ')}`]);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const runQuickTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      const result = await quickHealthCheck();
      setTestResults([
        {
          name: 'Quick Health Check',
          status: result ? 'passed' : 'failed',
          message: result ? 'Basic setup is working' : 'Basic setup has issues',
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (error) {
      setTestResults([
        {
          name: 'Quick Health Check',
          status: 'failed',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const runFullTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const tests = [
      { name: 'Environment Variables', test: testEnvironmentVariables },
      { name: 'Supabase Connection', test: testSupabaseConnection },
      { name: 'N8n Webhook', test: testN8nWebhook }
    ];

    for (const { name, test } of tests) {
      setTestResults(prev => [...prev, { name, status: 'running' }]);
      
      try {
        const result = await test();
        setTestResults(prev => 
          prev.map(t => 
            t.name === name 
              ? { ...t, status: result ? 'passed' : 'failed', timestamp: new Date().toISOString() }
              : t
          )
        );
      } catch (error) {
        setTestResults(prev => 
          prev.map(t => 
            t.name === name 
              ? { 
                  ...t, 
                  status: 'failed', 
                  message: error instanceof Error ? error.message : 'Unknown error',
                  timestamp: new Date().toISOString() 
                }
              : t
          )
        );
      }
    }
    
    setIsRunning(false);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Info className="w-4 h-4 text-gray-400" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return 'text-gray-400';
      case 'running':
        return 'text-blue-500';
      case 'passed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-all duration-200"
        title="Open Debug Panel"
      >
        <Bug className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 bg-white rounded-lg shadow-xl border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Bug className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Debate Debug Panel</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Controls */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex space-x-2">
          <button
            onClick={runQuickTest}
            disabled={isRunning}
            className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white text-sm rounded transition-colors"
          >
            <Play className="w-4 h-4 mr-1" />
            Quick Test
          </button>
          <button
            onClick={runFullTest}
            disabled={isRunning}
            className="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white text-sm rounded transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Full Test
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Test Results</h4>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center space-x-2">
                {getStatusIcon(result.status)}
                <span className={`text-sm ${getStatusColor(result.status)}`}>
                  {result.name}
                </span>
                {result.message && (
                  <span className="text-xs text-gray-500">- {result.message}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900">Console Logs</h4>
          <button
            onClick={clearLogs}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        </div>
        <div className="h-32 overflow-y-auto bg-gray-50 rounded p-2 text-xs font-mono">
          {logs.length === 0 ? (
            <span className="text-gray-400">No logs yet...</span>
          ) : (
            logs.slice(-20).map((log, index) => (
              <div key={index} className="mb-1">
                {log.includes('[ERROR]') ? (
                  <span className="text-red-600">{log}</span>
                ) : log.includes('[WARN]') ? (
                  <span className="text-yellow-600">{log}</span>
                ) : (
                  <span className="text-gray-700">{log}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DebateDebug;
