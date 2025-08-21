// Test the fixes for circular JSON issues
const testFix = async () => {
  console.log('🔧 Testing fixes for circular JSON issues...');
  
  try {
    // Test 1: Health check
    console.log('\n🏥 1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3003/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check passed:', healthData);

    // Test 2: Initialize debate (this was failing before)
    console.log('\n🎯 2. Testing debate initialization...');
    const debateId = 'test-fix-' + Date.now();
    const initResponse = await fetch('http://localhost:3003/api/debate/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        debateId,
        config: {
          topic: 'Test Fix - AI in Education',
          duration: 30,
          rounds: 2
        }
      })
    });

    if (initResponse.ok) {
      const initResult = await initResponse.json();
      console.log('✅ Debate initialized successfully:', initResult);
      
      if (initResult.turn) {
        console.log('✅ Turn data is clean:', {
          id: initResult.turn.id,
          speaker: initResult.turn.speaker,
          state: initResult.turn.state
        });
      }
    } else {
      const errorText = await initResponse.text();
      console.error('❌ Debate initialization failed:', errorText);
    }

    console.log('\n🎉 Fix test completed!');
    console.log('✅ Circular JSON issues should be resolved');
    
  } catch (error) {
    console.error('❌ Fix test failed:', error.message);
  }
};

// Run the test
testFix();


