# Required Environment Variables for Deployment

## Frontend (Vercel) Environment Variables

### ✅ Already Configured
```bash
VITE_SUPABASE_URL=https://xdinmyztzvrcasvgupir.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SITE_URL=https://ai-business-assistant-flame.vercel.app
```

### ❌ MISSING - Voice Call Configuration
```bash
VITE_RETELL_AGENT_ID=agent_a1e893d620045b987b17f58efa
```

### ❌ MISSING - Stripe Configuration
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
VITE_STRIPE_BUSINESS_PRO_PRICE_ID=price_your_business_pro_price_id
VITE_STRIPE_ENTERPRISE_PRICE_ID=price_your_enterprise_price_id
```

### ❌ MISSING - Optional Features
```bash
VITE_BOSS_CALENDAR_URL=https://calendly.com/your-boss-calendar
VITE_AUTO_CALLER_WEBHOOK=https://your-auto-caller-webhook.com/api/call
```

## Backend (Supabase) Environment Variables

### ❌ MISSING - Voice Call Backend
```bash
RETELL_API_KEY=key_142fe7fca9596e496dc5fd6dab2b
```

### ❌ MISSING - Stripe Backend
```bash
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Quick Fix Steps

### 1. Fix Voice Call Issue (Most Important)
In your **Vercel** project dashboard:
1. Go to Settings → Environment Variables
2. Add: `VITE_RETELL_AGENT_ID` = `agent_a1e893d620045b987b17f58efa`
3. Redeploy

### 2. Fix Supabase Backend for Voice Calls
In your **Supabase** project dashboard:
1. Go to Settings → Edge Functions → Environment variables
2. Add: `RETELL_API_KEY` = `key_142fe7fca9596e496dc5fd6dab2b`

### 3. Optional: Configure Stripe (for subscriptions)
- Configure Stripe keys if you want payment functionality
- Leave unconfigured if you only want free plan

## Error Explanations

### "Voice call is not configured"
- **Cause**: Missing `VITE_RETELL_AGENT_ID` in Vercel
- **Solution**: Add the environment variable and redeploy

### "Cannot read properties of undefined (reading 'match')"
- **Cause**: Missing environment variables causing undefined values
- **Solution**: Add all required environment variables

### WebGL Shader Errors
- **Cause**: Three.js graphics library issues (cosmetic)
- **Solution**: These are cosmetic and don't affect functionality