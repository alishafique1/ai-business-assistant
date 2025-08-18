# How to Change Domain URL

## Quick Method (Environment Variable Only)
1. Update `VITE_SITE_URL` in your deployment platform's environment variables
2. Redeploy the project
3. Done! No code changes needed.

## If You Want to Update Fallback URLs in Code:

### 1. Update .env file:
```bash
VITE_SITE_URL=https://your-new-domain.com
```

### 2. Update fallback URLs in these files:

**src/pages/Auth.tsx** - Replace all instances of:
```javascript
'https://ai-business-assistant-flame.vercel.app'
```
with:
```javascript
'https://your-new-domain.com'
```

**src/pages/auth/ForgotPassword.tsx** - Replace:
```javascript
'https://ai-business-assistant-flame.vercel.app'
```
with:
```javascript
'https://your-new-domain.com'
```

### 3. Commit and push:
```bash
git add .
git commit -m "Update domain to your-new-domain.com"
git push origin dev
git checkout main && git merge dev && git push origin main
```

### 4. Update deployment environment variables:
- Set `VITE_SITE_URL=https://your-new-domain.com` in your deployment platform
- Redeploy

## Supabase Configuration
Don't forget to update these in your Supabase dashboard:
1. Authentication → URL Configuration → Site URL
2. Authentication → URL Configuration → Redirect URLs
   - Add: `https://your-new-domain.com/auth`
   - Add: `https://your-new-domain.com/onboarding`
   - Add: `https://your-new-domain.com/auth/reset-password`