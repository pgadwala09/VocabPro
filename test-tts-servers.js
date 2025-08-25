// Test script to check if TTS proxy servers are running
import fetch from 'node-fetch';

const servers = [
  { name: 'ElevenLabs Proxy', url: 'http://127.0.0.1:8787/elevenlabs/health' },
  { name: 'OpenAI Proxy', url: 'http://127.0.0.1:8788/health' },
  { name: 'GCP TTS Proxy', url: 'http://127.0.0.1:8789/gcp/health' }
];

async function testServers() {
  console.log('🔍 Testing TTS Proxy Servers...\n');
  
  for (const server of servers) {
    try {
      console.log(`Testing ${server.name}...`);
      const response = await fetch(server.url, { timeout: 5000 });
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        console.log(`✅ ${server.name}: Running (${response.status})`);
        if (data.message) console.log(`   Message: ${data.message}`);
      } else {
        console.log(`❌ ${server.name}: Error (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${server.name}: Not running or unreachable`);
      console.log(`   Error: ${error.message}`);
    }
    console.log('');
  }
  
  console.log('🎤 Testing Browser Speech Synthesis...');
  console.log('   This can only be tested in a browser environment');
  console.log('   Open the debate page and try the "🔊 Simple TTS Test" button');
}

testServers().catch(console.error);

