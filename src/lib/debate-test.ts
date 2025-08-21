import { supabase, sendDebateRequest, fetchDebateHistory, getDebateStats } from './debateIntegration';

// Debug configuration
const DEBUG_MODE = true;

// Test configuration
const TEST_USER_ID = 'test_user_' + Date.now();
const TEST_TOPIC = 'AI benefits society';
const TEST_MESSAGE = 'AI improves productivity and efficiency';

// Utility function for logging
function log(message: string, type: 'info' | 'error' | 'success' | 'warning' = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: 'ℹ️',
    error: '❌',
    success: '✅',
    warning: '⚠️'
  }[type];
  
  console.log(`${prefix} [${timestamp}] ${message}`);
  
  if (DEBUG_MODE) {
    // Also log to a debug element if it exists
    const debugElement = document.getElementById('debug-output');
    if (debugElement) {
      debugElement.innerHTML += `<div class="log-${type}">${prefix} ${message}</div>`;
      debugElement.scrollTop = debugElement.scrollHeight;
    }
  }
}

// Test 1: Environment Variables Check
export async function testEnvironmentVariables() {
  log('=== Testing Environment Variables ===', 'info');
  
  const envVars = {
    'VITE_SUPABASE_URL': import.meta.env.VITE_SUPABASE_URL,
    'VITE_SUPABASE_ANON_KEY': import.meta.env.VITE_SUPABASE_ANON_KEY,
    'VITE_N8N_BASE_URL': import.meta.env.VITE_N8N_BASE_URL,
    'VITE_N8N_USERNAME': import.meta.env.VITE_N8N_USERNAME,
    'VITE_N8N_PASSWORD': import.meta.env.VITE_N8N_PASSWORD
  };
  
  let allConfigured = true;
  
  Object.entries(envVars).forEach(([key, value]) => {
    if (!value) {
      log(`${key} is not configured`, 'error');
      allConfigured = false;
    } else {
      log(`${key} is configured`, 'success');
    }
  });
  
  if (!allConfigured) {
    log('Some environment variables are missing. Please check your .env file.', 'warning');
  }
  
  return allConfigured;
}

// Test 2: Supabase Connection Test
export async function testSupabaseConnection() {
  log('=== Testing Supabase Connection ===', 'info');
  
  try {
    const { data, error } = await supabase
      .from('debate_history')
      .select('count')
      .limit(1);
    
    if (error) {
      log(`Supabase connection failed: ${error.message}`, 'error');
      return false;
    }
    
    log('Supabase connection successful', 'success');
    return true;
  } catch (error) {
    log(`Supabase connection error: ${error}`, 'error');
    return false;
  }
}

// Test 3: N8n Webhook Test
export async function testN8nWebhook() {
  log('=== Testing N8n Webhook ===', 'info');
  
  try {
    const response = await sendDebateRequest(TEST_USER_ID, TEST_TOPIC, TEST_MESSAGE);
    log('N8n webhook test successful', 'success');
    log(`Response: ${JSON.stringify(response, null, 2)}`, 'info');
    return true;
  } catch (error: any) {
    log(`N8n webhook test failed: ${error.message}`, 'error');
    
    // Provide specific debugging information
    if (error.response) {
      log(`HTTP Status: ${error.response.status}`, 'error');
      log(`Response Data: ${JSON.stringify(error.response.data, null, 2)}`, 'error');
    } else if (error.request) {
      log('No response received from server', 'error');
      log('Check if n8n is running and accessible', 'warning');
    }
    
    return false;
  }
}

// Test 4: Database Operations Test
export async function testDatabaseOperations() {
  log('=== Testing Database Operations ===', 'info');
  
  try {
    // Test fetching history
    const history = await fetchDebateHistory(TEST_USER_ID);
    log(`Fetched ${history.length} history records`, 'success');
    
    // Test getting stats
    const stats = await getDebateStats(TEST_USER_ID);
    log(`User stats: ${JSON.stringify(stats, null, 2)}`, 'info');
    
    return true;
  } catch (error: any) {
    log(`Database operations test failed: ${error.message}`, 'error');
    return false;
  }
}

// Test 5: UI Integration Test
export function testUIIntegration() {
  log('=== Testing UI Integration ===', 'info');
  
  // Check if DebateInterface component is accessible
  const debateRoute = document.querySelector('[href="/debate-interface"]');
  if (debateRoute) {
    log('Debate interface route is accessible', 'success');
  } else {
    log('Debate interface route not found', 'warning');
  }
  
  // Check for required UI elements
  const requiredElements = [
    'input[placeholder*="User ID"]',
    'input[placeholder*="Debate Topic"]',
    'textarea[placeholder*="message"]',
    'button:contains("Start Debate")'
  ];
  
  let uiElementsFound = 0;
  requiredElements.forEach(selector => {
    const element = document.querySelector(selector);
    if (element) {
      uiElementsFound++;
      log(`UI element found: ${selector}`, 'success');
    } else {
      log(`UI element missing: ${selector}`, 'warning');
    }
  });
  
  return uiElementsFound === requiredElements.length;
}

// Comprehensive Test Suite
export async function runAllTests() {
  log('🚀 Starting Comprehensive Debate Integration Test Suite', 'info');
  log('', 'info');
  
  const results = {
    environment: false,
    supabase: false,
    n8n: false,
    database: false,
    ui: false
  };
  
  // Run tests sequentially
  results.environment = await testEnvironmentVariables();
  log('', 'info');
  
  if (results.environment) {
    results.supabase = await testSupabaseConnection();
    log('', 'info');
    
    if (results.supabase) {
      results.n8n = await testN8nWebhook();
      log('', 'info');
      
      results.database = await testDatabaseOperations();
      log('', 'info');
    }
  }
  
  results.ui = testUIIntegration();
  log('', 'info');
  
  // Summary
  log('=== Test Results Summary ===', 'info');
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? 'PASSED' : 'FAILED';
    const icon = passed ? '✅' : '❌';
    log(`${icon} ${test.toUpperCase()}: ${status}`, passed ? 'success' : 'error');
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  log('', 'info');
  log(`Overall Result: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? 'success' : 'warning');
  
  if (passedTests < totalTests) {
    log('', 'info');
    log('=== Debugging Recommendations ===', 'warning');
    
    if (!results.environment) {
      log('1. Check your .env file and ensure all VITE_ variables are set', 'warning');
    }
    
    if (!results.supabase) {
      log('2. Verify your Supabase URL and API key are correct', 'warning');
      log('3. Ensure the debate_history table exists in your Supabase database', 'warning');
    }
    
    if (!results.n8n) {
      log('4. Check if n8n is running on the configured URL', 'warning');
      log('5. Verify the webhook endpoint /webhook/debate exists in n8n', 'warning');
      log('6. Check n8n authentication credentials', 'warning');
    }
    
    if (!results.database) {
      log('7. Verify database permissions and RLS policies', 'warning');
    }
    
    if (!results.ui) {
      log('8. Check if the DebateInterface component is properly imported and routed', 'warning');
    }
  }
  
  return results;
}

// Quick health check
export async function quickHealthCheck() {
  log('🔍 Quick Health Check', 'info');
  
  const envOk = await testEnvironmentVariables();
  const supabaseOk = await testSupabaseConnection();
  
  if (envOk && supabaseOk) {
    log('✅ Basic setup is working', 'success');
    return true;
  } else {
    log('❌ Basic setup has issues', 'error');
    return false;
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).debateTest = {
    runAllTests,
    quickHealthCheck,
    testEnvironmentVariables,
    testSupabaseConnection,
    testN8nWebhook,
    testDatabaseOperations,
    testUIIntegration
  };
  
  log('Debug functions available in console as window.debateTest', 'info');
}
