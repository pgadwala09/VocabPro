import React, { useState, useEffect } from 'react';
import { runAllTests, quickHealthCheck, testEnvironmentVariables, testSupabaseConnection, testN8nWebhook, testDatabaseOperations } from '../lib/debate-test';
import { sendDebateRequest } from '../lib/debateIntegration';
import { Play, RefreshCw, CheckCircle, AlertCircle, Info, Bug, Settings, Database, Globe, Zap } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  details?: any;
  timestamp?: string;
}

const DebateTestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [testConfig, setTestConfig] = useState({
    userId: 'test_user_' + Date.now(),
    topic: 'AI benefits society',
    message: 'AI improves productivity and efficiency'
  });

  // Intercept console logs
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

  const addLog = (message: string, type: 'info' | 'error' | 'success' | 'warning' = 'info') => {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️',
      error: '❌',
      success: '✅',
      warning: '⚠️'
    }[type];
    
    setLogs(prev => [...prev, `${prefix} [${timestamp}] ${message}`]);
  };

  const updateTestResult = (name: string, status: TestResult['status'], message?: string, details?: any) => {
    setTestResults(prev => 
      prev.map(test => 
        test.name === name 
          ? { ...test, status, message, details, timestamp: new Date().toISOString() }
          : test
      )
    );
  };

  const runEnvironmentTest = async () => {
    updateTestResult('Environment Variables', 'running');
    try {
      const result = await testEnvironmentVariables();
      updateTestResult('Environment Variables', result ? 'passed' : 'failed', 
        result ? 'All environment variables are configured' : 'Some environment variables are missing');
    } catch (error) {
      updateTestResult('Environment Variables', 'failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const runSupabaseTest = async () => {
    updateTestResult('Supabase Connection', 'running');
    try {
      const result = await testSupabaseConnection();
      updateTestResult('Supabase Connection', result ? 'passed' : 'failed',
        result ? 'Successfully connected to Supabase' : 'Failed to connect to Supabase');
    } catch (error) {
      updateTestResult('Supabase Connection', 'failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const runN8nTest = async () => {
    updateTestResult('N8n Webhook', 'running');
    try {
      const result = await testN8nWebhook();
      updateTestResult('N8n Webhook', result ? 'passed' : 'failed',
        result ? 'Successfully connected to N8n webhook' : 'Failed to connect to N8n webhook');
    } catch (error) {
      updateTestResult('N8n Webhook', 'failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const runDatabaseTest = async () => {
    updateTestResult('Database Operations', 'running');
    try {
      const result = await testDatabaseOperations();
      updateTestResult('Database Operations', result ? 'passed' : 'failed',
        result ? 'Database operations working correctly' : 'Database operations failed');
    } catch (error) {
      updateTestResult('Database Operations', 'failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const runManualDebateTest = async () => {
    updateTestResult('Manual Debate Test', 'running');
    try {
      const response = await sendDebateRequest(testConfig.userId, testConfig.topic, testConfig.message);
      updateTestResult('Manual Debate Test', 'passed', 
        'Successfully sent debate request', response);
      addLog(`Debate response: ${JSON.stringify(response, null, 2)}`, 'success');
    } catch (error) {
      updateTestResult('Manual Debate Test', 'failed', error instanceof Error ? error.message : 'Unknown error');
      addLog(`Debate test failed: ${error}`, 'error');
    }
  };

  const runAllTestsSequentially = async () => {
    setIsRunning(true);
    setTestResults([]);
    addLog('Starting comprehensive test suite...', 'info');

    await runEnvironmentTest();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await runSupabaseTest();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await runN8nTest();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await runDatabaseTest();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await runManualDebateTest();
    
    setIsRunning(false);
    addLog('Test suite completed', 'info');
  };

  const runQuickTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    addLog('Running quick health check...', 'info');
    
    try {
      const result = await quickHealthCheck();
      updateTestResult('Quick Health Check', result ? 'passed' : 'failed',
        result ? 'Basic setup is working' : 'Basic setup has issues');
    } catch (error) {
      updateTestResult('Quick Health Check', 'failed', error instanceof Error ? error.message : 'Unknown error');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-t-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Bug className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Debate Integration Test Suite</h1>
                <p className="text-white/70">Comprehensive testing and debugging for debate functionality</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-white/70">Test User ID:</span>
              <span className="text-white font-mono text-sm">{testConfig.userId}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Controls */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Test Controls</span>
            </h2>

            {/* Quick Actions */}
            <div className="space-y-3 mb-6">
              <button
                onClick={runQuickTest}
                disabled={isRunning}
                className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Quick Health Check</span>
              </button>

              <button
                onClick={runAllTestsSequentially}
                disabled={isRunning}
                className="w-full px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Run All Tests</span>
              </button>
            </div>

            {/* Individual Tests */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-white mb-3">Individual Tests</h3>
              
              <button
                onClick={runEnvironmentTest}
                disabled={isRunning}
                className="w-full px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white rounded flex items-center space-x-2"
              >
                <Globe className="w-4 h-4" />
                <span>Environment Variables</span>
              </button>

              <button
                onClick={runSupabaseTest}
                disabled={isRunning}
                className="w-full px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white rounded flex items-center space-x-2"
              >
                <Database className="w-4 h-4" />
                <span>Supabase Connection</span>
              </button>

              <button
                onClick={runN8nTest}
                disabled={isRunning}
                className="w-full px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white rounded flex items-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>N8n Webhook</span>
              </button>

              <button
                onClick={runDatabaseTest}
                disabled={isRunning}
                className="w-full px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white rounded flex items-center space-x-2"
              >
                <Database className="w-4 h-4" />
                <span>Database Operations</span>
              </button>

              <button
                onClick={runManualDebateTest}
                disabled={isRunning}
                className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-800 text-white rounded flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Manual Debate Test</span>
              </button>
            </div>
          </div>

          {/* Test Results */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Test Results</h2>
            
            <div className="space-y-3">
              {testResults.length === 0 ? (
                <div className="text-center py-8">
                  <Bug className="w-16 h-16 text-white/30 mx-auto mb-4" />
                  <p className="text-white/50">No tests run yet. Click a test button to start.</p>
                </div>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <div className={`font-medium ${getStatusColor(result.status)}`}>
                          {result.name}
                        </div>
                        {result.message && (
                          <div className="text-sm text-white/70 mt-1">{result.message}</div>
                        )}
                        {result.timestamp && (
                          <div className="text-xs text-white/50 mt-1">
                            {new Date(result.timestamp).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </div>
                    {result.details && (
                      <details className="mt-3">
                        <summary className="text-sm text-white/70 cursor-pointer">View Details</summary>
                        <pre className="text-xs text-white/60 mt-2 p-2 bg-white/5 rounded overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Console Logs</h2>
            <button
              onClick={clearLogs}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-sm transition-colors"
            >
              Clear Logs
            </button>
          </div>
          
          <div className="h-64 overflow-y-auto bg-black/20 rounded-lg p-4 font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-white/50">No logs yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log.includes('❌') ? (
                    <span className="text-red-400">{log}</span>
                  ) : log.includes('✅') ? (
                    <span className="text-green-400">{log}</span>
                  ) : log.includes('⚠️') ? (
                    <span className="text-yellow-400">{log}</span>
                  ) : (
                    <span className="text-white/80">{log}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebateTestPage;
