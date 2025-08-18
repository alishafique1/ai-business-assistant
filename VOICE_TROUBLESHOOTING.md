# 🎙️ Voice Agent Troubleshooting Guide

## ❌ Current Issue: "Voice something not configured"

### Root Cause
The voice agent requires **two environment variables** to work:
1. **Frontend**: `VITE_RETELL_AGENT_ID` (missing in Vercel)
2. **Backend**: `RETELL_API_KEY` (missing in Supabase)

### Symptoms
- ❌ "Voice calling is not configured" error message
- ❌ Voice buttons don't work in pricing section
- ❌ Console shows "Configuration Error"
- ❌ Contact Sales voice calls fail

## ✅ Step-by-Step Fix

### Part 1: Fix Vercel Frontend (5 minutes)

1. **Login to Vercel**: https://vercel.com/dashboard
2. **Find your project**: Look for `ai-business-assistant` 
3. **Go to Settings**: Click on your project → Settings tab
4. **Environment Variables**: Click "Environment Variables" in sidebar
5. **Add variable**:
   - Name: `VITE_RETELL_AGENT_ID`
   - Value: `agent_a1e893d620045b987b17f58efa`
   - Environment: Production ✅
6. **Save and Redeploy**: 
   - Click Save
   - Go to Deployments tab
   - Click "Redeploy" on latest deployment
   - Wait 2-3 minutes

### Part 2: Fix Supabase Backend (3 minutes)

1. **Login to Supabase**: https://supabase.com/dashboard
2. **Find your project**: Select your AI business assistant project
3. **Go to Edge Functions**: Settings → Edge Functions → Environment variables
4. **Add variable**:
   - Name: `RETELL_API_KEY`
   - Value: `key_142fe7fca9596e496dc5fd6dab2b`
5. **Save**: Click Save (no redeploy needed)

## 🧪 How to Test the Fix

### Test 1: Check Error Message Gone
1. Visit your deployed app
2. Go to pricing section  
3. Click "Contact Sales" or any voice button
4. **Before fix**: "Voice calling is not configured"
5. **After fix**: Should initiate a voice call

### Test 2: Console Debugging
1. Open browser dev tools (F12)
2. Go to Console tab
3. Click voice button
4. **Before fix**: "Configuration Error" 
5. **After fix**: "Initiating call with options"

### Test 3: Network Requests
1. Open dev tools → Network tab
2. Click voice button
3. **Before fix**: No network requests
4. **After fix**: Should see request to `/functions/v1/create-web-call`

## 🔍 Advanced Debugging

### Check Environment Variables in Build
In your deployed app console:
```javascript
// Should return the agent ID
console.log(import.meta.env.VITE_RETELL_AGENT_ID);
```

### Common Issues

**Issue**: "Function call failed: 500 Missing RETELL_API_KEY"
- **Cause**: Backend environment variable not set
- **Fix**: Add `RETELL_API_KEY` to Supabase Edge Functions

**Issue**: Still shows "Voice calling is not configured" after Vercel update
- **Cause**: Need to redeploy after adding environment variables
- **Fix**: Go to Vercel Deployments → Redeploy

**Issue**: Voice call starts but no audio
- **Cause**: Browser microphone permissions
- **Fix**: Check browser microphone permissions

## 📞 Expected Voice Call Flow

1. **User clicks** "Contact Sales" button
2. **Frontend** checks for `VITE_RETELL_AGENT_ID`
3. **Frontend** calls Supabase function `create-web-call`
4. **Backend** checks for `RETELL_API_KEY`
5. **Backend** calls Retell AI API to create call
6. **Frontend** receives call ID and access token
7. **Frontend** initializes Retell Web Client
8. **Voice call** connects user to AI agent

## 🆘 Still Not Working?

### Quick Verification Checklist
- [ ] Added `VITE_RETELL_AGENT_ID` to Vercel
- [ ] Added `RETELL_API_KEY` to Supabase  
- [ ] Redeployed Vercel after adding environment variable
- [ ] Waited 2-3 minutes for deployment to complete
- [ ] Cleared browser cache and hard refresh

### Support
If voice calls still don't work after following this guide:
1. Check browser console for error messages
2. Verify environment variables are actually set in deployment
3. Test in different browsers
4. Check microphone permissions