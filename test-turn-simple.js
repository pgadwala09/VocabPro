// Simple Turn System Test
const testTurnSystem = async () => {
  console.log('🧪 Testing Turn-Based System...');
  
  try {
    // Test health
    const healthResponse = await fetch('http://localhost:3003/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health:', healthData.status);
    
    // Test debate creation
    const debateResponse = await fetch('http://localhost:3003/api/debate/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        debateId: 'test-' + Date.now(),
        config: { topic: 'Test Topic' }
      })
    });
    
    if (debateResponse.ok) {
      const result = await debateResponse.json();
      console.log('✅ Debate created:', result.message);
    } else {
      console.log('❌ Debate creation failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testTurnSystem();


