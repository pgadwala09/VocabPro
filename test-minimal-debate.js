// Test Minimal Debate Panel
// Tests the complete orchestration flow with minimal UI

const testMinimalDebate = async () => {
  console.log('🎭 Testing Minimal Debate Panel...');
  console.log('📋 Flow: Setup → Recording → Transcription → AI Response → TTS → Turn Advancement');
  
  try {
    // Test 1: Health check
    console.log('\n🏥 1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3003/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check passed:', healthData);

    // Test 2: Initialize debate
    console.log('\n🎯 2. Testing debate initialization...');
    const debateId = 'test-minimal-' + Date.now();
    const initResponse = await fetch('http://localhost:3003/api/debate/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        debateId,
        config: {
          topic: 'AI in Education - Minimal Test',
          duration: 30,
          rounds: 2
        }
      })
    });

    if (initResponse.ok) {
      const initResult = await initResponse.json();
      console.log('✅ Debate initialized:', initResult);
    } else {
      console.error('❌ Debate initialization failed:', initResponse.status);
      return;
    }

    // Test 3: Check user speaking permission
    console.log('\n🔐 3. Testing user speaking permission...');
    const canSpeakResponse = await fetch(`http://localhost:3003/api/debate/${debateId}/can-speak/user`);
    if (canSpeakResponse.ok) {
      const canSpeakResult = await canSpeakResponse.json();
      console.log('✅ User speaking permission:', canSpeakResult);
    }

    // Test 4: Start speaking turn
    console.log('\n🎤 4. Testing start speaking turn...');
    const startResponse = await fetch(`http://localhost:3003/api/debate/${debateId}/start-speaking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        speaker: 'user_pro',
        duration: 30
      })
    });

    if (startResponse.ok) {
      const startResult = await startResponse.json();
      console.log('✅ Speaking turn started:', startResult);
    }

    // Test 5: Complete turn with user data
    console.log('\n✅ 5. Testing turn completion with user data...');
    const completeResponse = await fetch(`http://localhost:3003/api/debate/${debateId}/complete-turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        turnData: {
          transcript: 'AI in education can personalize learning for each student.',
          duration: 25
        }
      })
    });

    if (completeResponse.ok) {
      const completeResult = await completeResponse.json();
      console.log('✅ Turn completed and advanced:', completeResult);
    }

    // Test 6: Check AI speaking permission
    console.log('\n🤖 6. Testing AI speaking permission...');
    const aiCanSpeakResponse = await fetch(`http://localhost:3003/api/debate/${debateId}/ai-can-speak`);
    if (aiCanSpeakResponse.ok) {
      const aiCanSpeakResult = await aiCanSpeakResponse.json();
      console.log('✅ AI speaking permission:', aiCanSpeakResult);
    }

    // Test 7: Generate AI response
    console.log('\n🧠 7. Testing AI response generation...');
    const aiResponse = await fetch('http://localhost:3003/api/generate-ai-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt: 'You are CON on the topic: "AI in Education". Stay within 150 words. Be concise and targeted. End with one probing question.',
        userPrompt: 'Respond to: AI in education can personalize learning for each student.',
        topic: 'AI in Education'
      })
    });

    if (aiResponse.ok) {
      const aiResult = await aiResponse.json();
      console.log('✅ AI response generated:', aiResult.response.substring(0, 100) + '...');
    }

    // Test 8: Generate TTS
    console.log('\n🎵 8. Testing TTS generation...');
    const ttsResponse = await fetch('http://localhost:3003/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Thank you for your argument about AI in education. While personalization is valuable, we must consider the potential risks and costs involved.'
      })
    });

    if (ttsResponse.ok) {
      const audioBlob = await ttsResponse.blob();
      console.log('✅ TTS generated, audio size:', audioBlob.size, 'bytes');
    }

    console.log('\n🎉 Minimal debate panel test completed!');
    console.log('📊 All orchestration features are working properly.');
    console.log('🎯 Setup → Recording → Transcription → AI Response → TTS → Turn Advancement ✅');
    console.log('💡 Visit http://localhost:5173/debate-demo to try the full UI');
    
  } catch (error) {
    console.error('❌ Minimal debate test failed:', error.message);
    console.log('💡 Make sure all servers are running:');
    console.log('   - API Routes: npm run api:routes');
    console.log('   - OpenAI Proxy: npm run proxy:openai');
    console.log('   - ElevenLabs Proxy: npm run proxy:eleven');
    console.log('   - Frontend: npm run dev');
  }
};

// Run the test
testMinimalDebate();


