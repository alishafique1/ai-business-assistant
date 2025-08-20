import { supabase } from '@/integrations/supabase/client';

export const checkSupabaseConfig = () => {
  const config = {
    url: supabase.supabaseUrl,
    anonKey: supabase.supabaseKey?.substring(0, 20) + '...',
    hasUrl: !!supabase.supabaseUrl,
    hasKey: !!supabase.supabaseKey,
    urlValid: supabase.supabaseUrl?.includes('supabase.co') || false,
  };
  
  console.log('🔧 Supabase Configuration Check:', config);
  return config;
};

export const testSupabaseConnection = async () => {
  try {
    console.log('🔧 Testing Supabase connection...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Supabase connection error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Supabase connection successful');
    return { success: true, session: !!data.session };
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const testPasswordReset = async (email: string) => {
  try {
    console.log('🔧 Testing password reset for:', email);
    
    // Check config first
    const config = checkSupabaseConfig();
    if (!config.hasUrl || !config.hasKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
    
    console.log('📧 Password reset test result:', { data, error });
    
    if (error) {
      return { 
        success: false, 
        error: error.message,
        code: error.message?.includes('rate limit') ? 'RATE_LIMIT' : 'API_ERROR'
      };
    }
    
    return { success: true, message: 'Password reset email should be sent' };
  } catch (error) {
    console.error('❌ Password reset test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'NETWORK_ERROR'
    };
  }
};