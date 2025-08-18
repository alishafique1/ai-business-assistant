#!/usr/bin/env node

// Quick script to check voice configuration status
// Run with: node check-voice-config.js

console.log('🎙️ VOICE AGENT CONFIGURATION CHECKER\n');

// Check frontend environment variables (these should be in .env.local for dev)
console.log('📱 FRONTEND CONFIGURATION:');
const retellAgentId = process.env.VITE_RETELL_AGENT_ID;
console.log(`VITE_RETELL_AGENT_ID: ${retellAgentId ? '✅ SET' : '❌ MISSING'}`);
if (retellAgentId) {
  console.log(`  Value: ${retellAgentId}`);
}

console.log('\n🔧 BACKEND CONFIGURATION:');
const retellApiKey = process.env.RETELL_API_KEY;
console.log(`RETELL_API_KEY: ${retellApiKey ? '✅ SET' : '❌ MISSING'}`);
if (retellApiKey) {
  console.log(`  Value: ${retellApiKey.substring(0, 10)}...`);
}

console.log('\n📋 DEPLOYMENT CHECKLIST:');
console.log('For Vercel deployment:');
console.log('1. Go to your Vercel project dashboard');
console.log('2. Navigate to Settings → Environment Variables');
console.log('3. Add: VITE_RETELL_AGENT_ID = agent_a1e893d620045b987b17f58efa');
console.log('4. Redeploy your application\n');

console.log('For Supabase Edge Functions:');
console.log('1. Go to your Supabase project dashboard');
console.log('2. Navigate to Settings → Edge Functions → Environment variables');
console.log('3. Add: RETELL_API_KEY = key_142fe7fca9596e496dc5fd6dab2b');
console.log('4. Functions will automatically use the new environment variable\n');

console.log('💡 QUICK FIXES:');
if (!retellAgentId) {
  console.log('❌ Frontend: Voice buttons will show "Voice calling is not configured"');
}
if (!retellApiKey) {
  console.log('❌ Backend: create-web-call function will return "Missing RETELL_API_KEY"');
}

if (retellAgentId && retellApiKey) {
  console.log('✅ All voice configuration appears to be set correctly!');
} else {
  console.log('\n🔴 ACTION REQUIRED: Please configure the missing environment variables above');
}