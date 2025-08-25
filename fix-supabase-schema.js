// Script to check and fix Supabase database schema
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFixSchema() {
  console.log('🔍 Checking Supabase database schema...\n');

  try {
    // Check if debates table exists
    console.log('1. Checking debates table...');
    const { data: debatesCheck, error: debatesError } = await supabase
      .from('debates')
      .select('id')
      .limit(1);

    if (debatesError) {
      console.log('❌ Debates table error:', debatesError.message);
      console.log('📝 You need to run the schema SQL in your Supabase dashboard');
      console.log('📁 File: src/lib/supabase-schema.sql');
      return;
    }

    console.log('✅ Debates table exists');

    // Check if debate_turns table exists
    console.log('\n2. Checking debate_turns table...');
    const { data: turnsCheck, error: turnsError } = await supabase
      .from('debate_turns')
      .select('id')
      .limit(1);

    if (turnsError) {
      console.log('❌ Debate_turns table error:', turnsError.message);
      console.log('📝 You need to run the schema SQL in your Supabase dashboard');
      return;
    }

    console.log('✅ Debate_turns table exists');

    // Check if debate_audio table exists
    console.log('\n3. Checking debate_audio table...');
    const { data: audioCheck, error: audioError } = await supabase
      .from('debate_audio')
      .select('id')
      .limit(1);

    if (audioError) {
      console.log('❌ Debate_audio table error:', audioError.message);
      console.log('📝 You need to run the schema SQL in your Supabase dashboard');
      return;
    }

    console.log('✅ Debate_audio table exists');

    // Test creating a debate
    console.log('\n4. Testing debate creation...');
    const { data: testDebate, error: createError } = await supabase
      .from('debates')
      .insert({
        topic: 'Test debate - will be deleted',
        selected_rounds: 1,
        selected_time: 60,
        status: 'active'
      })
      .select()
      .single();

    if (createError) {
      console.log('❌ Error creating test debate:', createError.message);
      console.log('📝 This suggests the schema is not properly set up');
      return;
    }

    console.log('✅ Test debate created successfully');

    // Clean up test debate
    await supabase
      .from('debates')
      .delete()
      .eq('id', testDebate.id);

    console.log('✅ Test debate cleaned up');

    console.log('\n🎉 Database schema is working correctly!');
    console.log('The debate system should now work without errors.');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkAndFixSchema();

