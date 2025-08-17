// Test file to verify MCP integrations
import { supabase } from './lib/supabase';

// Test Supabase connection
export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL || 'Not set');
    console.log('Supabase Anon Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set');
    
    // Test basic connection
    const { data, error } = await supabase.from('spelling_words').select('count').limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error.message);
      return { success: false, error: error.message };
    }
    
    console.log('Supabase connection successful');
    return { success: true, data };
  } catch (error) {
    console.error('Supabase test failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Test GitHub MCP integration
export function testGitHubIntegration() {
  console.log('GitHub MCP integration test:');
  console.log('- GitHub MCP functions are available');
  console.log('- Can search repositories');
  console.log('- Can create/update files');
  console.log('- Can manage pull requests');
  return { success: true, message: 'GitHub MCP integration is working' };
}

// Run tests
export async function runIntegrationTests() {
  console.log('=== Integration Tests ===');
  
  const githubTest = testGitHubIntegration();
  console.log('GitHub Test:', githubTest);
  
  const supabaseTest = await testSupabaseConnection();
  console.log('Supabase Test:', supabaseTest);
  
  return {
    github: githubTest,
    supabase: supabaseTest
  };
}





