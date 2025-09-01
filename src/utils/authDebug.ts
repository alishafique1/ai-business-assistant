import { supabase } from '@/integrations/supabase/client';

export const runAuthDiagnostics = async () => {
  console.log('🔧 === COMPREHENSIVE AUTH DIAGNOSTICS ===');
  
  const results = {
    configCheck: false,
    connectionCheck: false,
    emailTest: null as { attempted: boolean; error: string | null; working: boolean } | null,
    signinTest: null as { attempted: boolean; error: string | null; working: boolean } | null,
    errors: [] as string[]
  };

  try {
    // 1. Check Supabase configuration
    console.log('1️⃣ Checking Supabase configuration...');
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://xdinmyztzvrcasvgupir.supabase.co";
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkaW5teXp0enZyY2Fzdmd1cGlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NzgyMjksImV4cCI6MjA2ODI1NDIyOX0.nUYgDJHoZNX5P4ZYKeeY0_AeIV8ZGpCaYjHMyScxwCQ";
    
    const config = {
      url: SUPABASE_URL,
      hasKey: !!SUPABASE_ANON_KEY,
      keyLength: SUPABASE_ANON_KEY?.length || 0
    };
    console.log('📋 Config:', config);
    
    if (!SUPABASE_URL.includes('supabase.co')) {
      results.errors.push('Invalid Supabase URL');
    } else {
      results.configCheck = true;
    }

    // 2. Test basic connection
    console.log('2️⃣ Testing basic connection...');
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      results.errors.push(`Session error: ${sessionError.message}`);
    } else {
      console.log('✅ Connection successful');
      results.connectionCheck = true;
    }

    // 3. Test password reset (safe test)
    console.log('3️⃣ Testing password reset function...');
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail('test@nonexistent-domain-123456.com', {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });
      
      console.log('📧 Reset test result:', resetError);
      results.emailTest = {
        attempted: true,
        error: resetError?.message || null,
        working: !resetError || resetError.message.includes('rate limit')
      };
    } catch (e) {
      console.error('❌ Reset test failed:', e);
      results.emailTest = { attempted: true, error: e instanceof Error ? e.message : 'Unknown error', working: false };
    }

    // 4. Test signin with obviously wrong credentials
    console.log('4️⃣ Testing signin function...');
    try {
      const { data, error: signinError } = await supabase.auth.signInWithPassword({
        email: 'test@nonexistent-domain-123456.com',
        password: 'wrongpassword123'
      });
      
      console.log('🔑 Signin test result:', { data: !!data.user, error: signinError });
      results.signinTest = {
        attempted: true,
        error: signinError?.message || null,
        working: !!signinError && signinError.message.includes('Invalid login credentials')
      };
    } catch (e) {
      console.error('❌ Signin test failed:', e);
      results.signinTest = { attempted: true, error: e instanceof Error ? e.message : 'Unknown error', working: false };
    }

  } catch (generalError) {
    console.error('❌ General diagnostic error:', generalError);
    results.errors.push(`General error: ${generalError instanceof Error ? generalError.message : 'Unknown'}`);
  }

  console.log('📊 === DIAGNOSTIC RESULTS ===');
  console.log('Config Check:', results.configCheck ? '✅' : '❌');
  console.log('Connection Check:', results.connectionCheck ? '✅' : '❌');
  console.log('Email Function:', results.emailTest?.working ? '✅' : '❌');
  console.log('Signin Function:', results.signinTest?.working ? '✅' : '❌');
  
  if (results.errors.length > 0) {
    console.error('🚨 ERRORS FOUND:');
    results.errors.forEach(error => console.error(`  - ${error}`));
  }

  return results;
};

export const testRealAuth = async (email: string, password: string) => {
  console.log('🧪 TESTING REAL AUTH CREDENTIALS');
  console.log('Email:', email);
  console.log('Password length:', password.length);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    console.log('🔑 Real auth result:', {
      success: !!data.user,
      userId: data.user?.id,
      email: data.user?.email,
      error: error?.message
    });

    return { success: !!data.user, error: error?.message || null, data };
  } catch (e) {
    console.error('❌ Real auth exception:', e);
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error', data: null };
  }
};

export const testPasswordReset = async (email: string) => {
  console.log('📧 TESTING PASSWORD RESET FOR:', email);
  
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });

    console.log('📧 Detailed password reset result:', {
      success: !error,
      error: error?.message,
      errorCode: error?.status,
      data,
      timestamp: new Date().toISOString(),
      redirectUrl: `${window.location.origin}/auth/reset-password`
    });

    // Additional check - verify if this is a Supabase email delivery issue
    if (!error) {
      console.log('🔍 SUPABASE EMAIL ANALYSIS:');
      console.log('✅ API call successful - Supabase accepted the request');
      console.log('⚠️  Email not received? This indicates:');
      console.log('   1. Supabase default email service may not be configured');
      console.log('   2. Emails might be going to spam/junk folder');
      console.log('   3. Rate limiting on email service');
      console.log('   4. Email provider blocking Supabase emails');
      
      // Check if we're using default Supabase email service
      console.log('📬 RECOMMENDED SOLUTIONS:');
      console.log('   1. Check spam/junk folder thoroughly');
      console.log('   2. Try a different email address');
      console.log('   3. Contact support to configure SMTP');
      console.log('   4. Use temporary password instead');
    }

    return { success: !error, error: error?.message || null };
  } catch (e) {
    console.error('❌ Password reset exception:', e);
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
};

