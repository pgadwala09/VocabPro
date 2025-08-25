// Simple TTS Test Script
// Run this with Node.js to test the TTS API endpoints

const testTTS = async () => {
  const testText = "Hello! This is a test of the AI voice system. The debate is working properly.";
  
  console.log('🧪 Testing TTS functionality...');
  console.log('📝 Test text:', testText);
  
  try {
    // Test the TTS endpoint
    console.log('🔄 Calling TTS API...');
    const response = await fetch('http://localhost:3003/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: testText,
        voice: '21m00Tcm4TlvDq8ikWAM'
      })
    });

    console.log('📊 Response status:', response.status);
    console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ TTS API error:', errorText);
      return;
    }

    const audioBuffer = await response.arrayBuffer();
    console.log('✅ TTS API successful!');
    console.log('📊 Audio buffer size:', audioBuffer.byteLength, 'bytes');
    console.log('🎵 Audio type: MP3 (ElevenLabs)');
    
    // Test the health endpoint
    console.log('\n🏥 Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3003/health');
    const healthData = await healthResponse.json();
    console.log('📋 Health status:', healthData);
    
    console.log('\n✅ TTS test completed successfully!');
    console.log('🎤 AI speech generation is working properly.');
    
  } catch (error) {
    console.error('❌ TTS test failed:', error.message);
    console.log('💡 Make sure the API routes server is running on port 3003');
  }
};

// Run the test
testTTS();

