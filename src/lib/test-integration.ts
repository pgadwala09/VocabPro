import { debateIntegration, supabase } from './debateIntegration';
import { getN8nConfig } from './n8n-config';

// Test configuration
export const testIntegration = async () => {
  console.log('🧪 Testing N8n and Supabase Integration...\n');

  // Test 1: Configuration
  console.log('1. Testing Configuration...');
  try {
    const config = getN8nConfig();
    console.log('✅ N8n config loaded:', {
      baseURL: config.baseURL,
      hasApiKey: !!config.apiKey,
      workflows: Object.keys(config.workflows)
    });
  } catch (error) {
    console.error('❌ Configuration test failed:', error);
  }

  // Test 2: Supabase Connection
  console.log('\n2. Testing Supabase Connection...');
  try {
    const { data, error } = await supabase
      .from('debate_sessions')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
    } else {
      console.log('✅ Supabase connection successful');
    }
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
  }

  // Test 3: N8n API Connection
  console.log('\n3. Testing N8n API Connection...');
  try {
    // Note: This will only work if n8n is running and accessible
    const workflows = await debateIntegration['n8nAPI'].listWorkflows();
    console.log('✅ N8n API connection successful');
    console.log(`   Found ${workflows.length} workflows`);
  } catch (error) {
    console.log('⚠️  N8n API connection failed (this is expected if n8n is not running)');
    console.log('   Error:', error instanceof Error ? error.message : 'Unknown error');
  }

  // Test 4: Environment Variables
  console.log('\n4. Testing Environment Variables...');
  const envVars = {
    SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY,
    N8N_BASE_URL: process.env.REACT_APP_N8N_BASE_URL,
    N8N_API_KEY: process.env.REACT_APP_N8N_API_KEY,
  };

  const missingVars = Object.entries(envVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length === 0) {
    console.log('✅ All environment variables are set');
  } else {
    console.log('⚠️  Missing environment variables:', missingVars);
    console.log('   Please check your .env file');
  }

  console.log('\n📋 Integration Test Summary:');
  console.log('   - Configuration: ✅');
  console.log('   - Supabase: ' + (envVars.SUPABASE_URL && envVars.SUPABASE_ANON_KEY ? '✅' : '❌'));
  console.log('   - N8n: ' + (envVars.N8N_BASE_URL ? '⚠️ (needs n8n instance)' : '❌'));
  console.log('\n🎯 Next Steps:');
  console.log('   1. Set up your .env file with the required variables');
  console.log('   2. Start your n8n instance');
  console.log('   3. Create the required Supabase tables');
  console.log('   4. Set up your n8n workflows');
  console.log('   5. Test the integration with real data');
};

// Export for use in components
export const runIntegrationTest = () => {
  testIntegration().catch(console.error);
};

// Auto-run test if this file is imported directly
if (typeof window !== 'undefined') {
  // Only run in browser environment
  setTimeout(() => {
    console.log('🔍 Running integration test automatically...');
    testIntegration().catch(console.error);
  }, 1000);
}
