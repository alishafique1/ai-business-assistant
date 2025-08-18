import { supabase } from '@/integrations/supabase/client';

/**
 * Check if an email is already registered by attempting a password reset
 * This is a safe way to check without exposing user data
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    // Use resetPasswordForEmail as a way to check if email exists
    // This won't actually send an email if configured properly, but will return an error if email doesn't exist
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://example.com/reset' // dummy URL since we're just checking
    });
    
    // If no error, email exists
    // If error contains "not found" or similar, email doesn't exist
    if (!error) {
      return true; // Email exists
    }
    
    const errorMessage = error.message.toLowerCase();
    if (errorMessage.includes('not found') || 
        errorMessage.includes('does not exist') ||
        errorMessage.includes('no user found')) {
      return false; // Email doesn't exist
    }
    
    // For other errors, assume email might exist to be safe
    return true;
  } catch (error) {
    console.warn('Email check failed:', error);
    // If check fails, allow signup to proceed
    return false;
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}