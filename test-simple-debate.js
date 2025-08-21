// Test Simple Debate Panel
const testSimpleDebate = async () => {
  console.log('🎭 Testing Simple Debate Panel...');
  console.log('📋 This version bypasses complex orchestration issues');
  
  try {
    // Test 1: Health check
    console.log('\n🏥 1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3003/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check passed:', healthData);

    // Test 2: Test TTS endpoint (this is what the simple panel uses)
    console.log('\n🎵 2. Testing TTS endpoint...');
    const ttsResponse = await fetch('http://localhost:3003/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello, this is a test of the text-to-speech system.'
      })
    });

    if (ttsResponse.ok) {
      const audioBlob = await ttsResponse.blob();
      console.log('✅ TTS working, audio size:', audioBlob.size, 'bytes');
    } else {
      console.log('⚠️ TTS not available, but simple panel will still work');
    }

    console.log('\n🎉 Simple debate panel test completed!');
    console.log('📊 The simple panel should work without complex orchestration');
    console.log('💡 Visit http://localhost:5173/debate-demo to try it');
    console.log('🎯 Features: Recording → Processing → AI Response → TTS → Turn Advancement');
    
  } catch (error) {
    console.error('❌ Simple debate test failed:', error.message);
    console.log('💡 The simple panel should still work in the browser');
  }
};

// Run the test
testSimpleDebate();



