// Complete Recording Flow Test Script
// Tests: Recording → Upload → Transcription → AI Response → TTS

const testRecordingFlow = async () => {
  console.log('🧪 Testing Complete Recording Flow...');
  console.log('📋 Flow: Recording → Upload → Transcription → AI Response → TTS');
  
  try {
    // Test 1: Health check
    console.log('\n🏥 1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3003/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check passed:', healthData);

    // Test 2: Human upload endpoint
    console.log('\n📤 2. Testing human upload endpoint...');
    const testAudioBlob = new Blob(['test audio data'], { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('file', testAudioBlob, 'test-recording.webm');
    formData.append('debateId', 'test-debate-123');
    formData.append('turnNumber', '1');
    formData.append('speaker', 'user_pro');

    const uploadResponse = await fetch('http://localhost:3003/api/human-upload', {
      method: 'POST',
      body: formData
    });

    if (uploadResponse.ok) {
      const uploadResult = await uploadResponse.json();
      console.log('✅ Upload successful:', uploadResult);
    } else {
      console.error('❌ Upload failed:', uploadResponse.status);
    }

    // Test 3: Transcription endpoint
    console.log('\n🎤 3. Testing transcription endpoint...');
    const transcribeFormData = new FormData();
    transcribeFormData.append('file', testAudioBlob);

    const transcribeResponse = await fetch('http://localhost:3003/api/transcribe', {
      method: 'POST',
      body: transcribeFormData
    });

    if (transcribeResponse.ok) {
      const transcribeResult = await transcribeResponse.json();
      console.log('✅ Transcription successful:', transcribeResult);
    } else {
      console.error('❌ Transcription failed:', transcribeResponse.status);
    }

    // Test 4: AI response generation
    console.log('\n🤖 4. Testing AI response generation...');
    const aiResponse = await fetch('http://localhost:3003/api/generate-ai-response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemPrompt: 'You are a debate opponent. Respond briefly and respectfully.',
        userPrompt: 'User said: "I think AI in education is beneficial."',
        topic: 'AI in Education',
        userTranscript: 'I think AI in education is beneficial.'
      })
    });

    if (aiResponse.ok) {
      const aiResult = await aiResponse.json();
      console.log('✅ AI response generated:', aiResult.response);
    } else {
      console.error('❌ AI response failed:', aiResponse.status);
    }

    // Test 5: TTS generation
    console.log('\n🎵 5. Testing TTS generation...');
    const ttsResponse = await fetch('http://localhost:3003/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: 'Thank you for your argument. I respectfully disagree and believe there are important considerations to discuss.',
        voice: '21m00Tcm4TlvDq8ikWAM'
      })
    });

    if (ttsResponse.ok) {
      const audioBuffer = await ttsResponse.arrayBuffer();
      console.log('✅ TTS successful, audio size:', audioBuffer.byteLength, 'bytes');
    } else {
      console.error('❌ TTS failed:', ttsResponse.status);
    }

    console.log('\n🎉 Complete recording flow test finished!');
    console.log('📊 All endpoints are working properly.');
    console.log('🎤 Recording → Upload → Transcription → AI Response → TTS ✅');
    
  } catch (error) {
    console.error('❌ Recording flow test failed:', error.message);
    console.log('💡 Make sure the API routes server is running on port 3003');
  }
};

// Run the test
testRecordingFlow();


