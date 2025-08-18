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

## 🚨 URGENT: Fix Voice Call Issue

### Step 1: Fix Frontend (Vercel) - REQUIRED
**Without this, voice buttons show "Voice calling is not configured"**

1. Go to your **Vercel** project dashboard: https://vercel.com/dashboard
2. Select your `ai-business-assistant` project 
3. Navigate to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add this exact variable:
   - **Name**: `VITE_RETELL_AGENT_ID`
   - **Value**: `agent_a1e893d620045b987b17f58efa`
   - **Environment**: Production (and Preview if you want)
6. Click **Save**
7. Go to **Deployments** tab
8. Click **Redeploy** on your latest deployment
9. Wait for deployment to complete (~2-3 minutes)

### Step 2: Fix Backend (Supabase) - REQUIRED  
**Without this, calls fail with "Missing RETELL_API_KEY"**

1. Go to your **Supabase** project dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Settings** → **Edge Functions** → **Environment variables**
4. Click **Add new variable**
5. Add this exact variable:
   - **Name**: `RETELL_API_KEY` 
   - **Value**: `key_142fe7fca9596e496dc5fd6dab2b`
6. Click **Save**
7. No redeploy needed - Edge Functions use environment variables immediately

### Step 3: Test the Fix
1. Visit your deployed application
2. Go to the pricing section or any "Contact Sales" button
3. The button should work and initiate a voice call instead of showing an error

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