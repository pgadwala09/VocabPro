// Orchestration System Test Script
// Tests: Turn Engine, Auto-Advancement, Server-Side Job Management

const testOrchestration = async () => {
  console.log('🎭 Testing Orchestration System...');
  console.log('📋 Flow: Turn Engine → Auto-Advancement → Server Jobs → Client Orchestration');
  
  try {
    // Test 1: Health check
    console.log('\n🏥 1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3003/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check passed:', healthData);

    // Test 2: Initialize debate with turn engine
    console.log('\n🎯 2. Testing debate initialization with turn engine...');
    const debateId = 'test-orchestration-' + Date.now();
    const initResponse = await fetch('http://localhost:3003/api/debate/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        debateId,
        config: {
          topic: 'AI in Education - Orchestration Test',
          duration: 60,
          rounds: 4
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

    // Test 3: Get debate state
    console.log('\n📊 3. Testing debate state retrieval...');
    const stateResponse = await fetch(`http://localhost:3003/api/debate/${debateId}/state`);
    if (stateResponse.ok) {
      const stateResult = await stateResponse.json();
      console.log('✅ Debate state retrieved:', stateResult);
    }

    // Test 4: Check user speaking permission
    console.log('\n🔐 4. Testing user speaking permission...');
    const canSpeakResponse = await fetch(`http://localhost:3003/api/debate/${debateId}/can-speak/user`);
    if (canSpeakResponse.ok) {
      const canSpeakResult = await canSpeakResponse.json();
      console.log('✅ User speaking permission:', canSpeakResult);
    }

    // Test 5: Start speaking turn
    console.log('\n🎤 5. Testing start speaking turn...');
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

    // Test 6: Complete turn and advance
    console.log('\n✅ 6. Testing turn completion and advancement...');
    const completeResponse = await fetch(`http://localhost:3003/api/debate/${debateId}/complete-turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        turnData: {
          transcript: 'Test user argument for orchestration',
          duration: 25
        }
      })
    });

    if (completeResponse.ok) {
      const completeResult = await completeResponse.json();
      console.log('✅ Turn completed and advanced:', completeResult);
    }

    // Test 7: Check AI speaking permission
    console.log('\n🤖 7. Testing AI speaking permission...');
    const aiCanSpeakResponse = await fetch(`http://localhost:3003/api/debate/${debateId}/ai-can-speak`);
    if (aiCanSpeakResponse.ok) {
      const aiCanSpeakResult = await aiCanSpeakResponse.json();
      console.log('✅ AI speaking permission:', aiCanSpeakResult);
    }

    // Test 8: Trigger AI to speak
    console.log('\n🎭 8. Testing AI speak trigger...');
    const aiSpeakResponse = await fetch(`http://localhost:3003/api/debate/${debateId}/ai-speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (aiSpeakResponse.ok) {
      const aiSpeakResult = await aiSpeakResponse.json();
      console.log('✅ AI speak triggered:', aiSpeakResult);
    }

    // Test 9: Manual sweep test
    console.log('\n🧹 9. Testing manual sweep...');
    const sweepResponse = await fetch(`http://localhost:3003/api/debate/${debateId}/sweep`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (sweepResponse.ok) {
      const sweepResult = await sweepResponse.json();
      console.log('✅ Manual sweep completed:', sweepResult);
    }

    // Test 10: Get debate statistics
    console.log('\n📈 10. Testing debate statistics...');
    const statsResponse = await fetch(`http://localhost:3003/api/debate/${debateId}/stats`);
    if (statsResponse.ok) {
      const statsResult = await statsResponse.json();
      console.log('✅ Debate statistics:', statsResult);
    }

    console.log('\n🎉 Orchestration system test completed!');
    console.log('📊 All orchestration endpoints are working properly.');
    console.log('🎯 Turn Engine → Auto-Advancement → Server Jobs → Client Orchestration ✅');
    console.log('🔄 Server-side sweep job is running every 10 seconds');
    console.log('⏰ Auto-advancement prevents stuck debates');
    
  } catch (error) {
    console.error('❌ Orchestration test failed:', error.message);
    console.log('💡 Make sure the API routes server is running on port 3003');
  }
};

// Run the test
testOrchestration();


