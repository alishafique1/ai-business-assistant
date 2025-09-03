/**
 * Direct authentication utility that bypasses Supabase client issues
 * This provides a clean REST API approach for authentication
 */

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    user_metadata: any;
  };
}

interface AuthError {
  message: string;
  status?: number;
}

// Safe environment variable getter
const getEnvVar = (key: string, fallback: string): string => {
  const value = import.meta.env[key];
  if (!value || value === 'undefined' || value === 'null' || typeof value !== 'string') {
    return fallback;
  }
  return value.trim();
};

const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL', 'https://xdinmyztzvrcasvgupir.supabase.co');
const SUPABASE_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkaW5teXp0enZyY2Fzdmd1cGlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NzgyMjksImV4cCI6MjA2ODI1NDIyOX0.nUYgDJHoZNX5P4ZYKeeY0_AeIV8ZGpCaYjHMyScxwCQ');

// Debug environment variables
console.log('🔧 DirectAuth Debug Info:');
console.log('🔧 Raw VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('🔧 Raw VITE_SUPABASE_ANON_KEY type:', typeof import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('🔧 Processed SUPABASE_URL:', SUPABASE_URL);
console.log('🔧 Processed SUPABASE_KEY length:', SUPABASE_KEY.length);

/**
 * Safe fetch wrapper that validates all parameters
 */
async function safeFetch(url: string, options: RequestInit): Promise<Response> {
  // Validate URL
  if (typeof url !== 'string' || !url || url.includes('\0') || url.includes('\n') || url.includes('\r')) {
    throw new Error('Invalid URL provided to fetch');
  }

  // Validate and sanitize headers
  const safeHeaders: Record<string, string> = {};
  if (options.headers) {
    const headers = options.headers as Record<string, string>;
    for (const [key, value] of Object.entries(headers)) {
      if (typeof key === 'string' && typeof value === 'string' && 
          !key.includes('\0') && !key.includes('\n') && !key.includes('\r') &&
          !value.includes('\0') && !value.includes('\n') && !value.includes('\r')) {
        safeHeaders[key] = value;
      }
    }
  }

  // Validate body
  let safeBody = options.body;
  if (safeBody && typeof safeBody === 'string') {
    if (safeBody.includes('\0')) {
      throw new Error('Invalid characters in request body');
    }
  }

  // Create safe options
  const safeOptions: RequestInit = {
    ...options,
    headers: safeHeaders,
    body: safeBody
  };

  console.log('🔒 Safe fetch URL:', url.substring(0, 50) + '...');
  console.log('🔒 Safe fetch headers:', Object.keys(safeHeaders));

  return fetch(url, safeOptions);
}

/**
 * Direct sign in using Supabase REST API
 */
export async function directSignIn(email: string, password: string): Promise<{ data: AuthResponse | null; error: AuthError | null }> {
  try {
    // Validate inputs
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return { data: null, error: { message: 'Invalid email or password' } };
    }

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      return { data: null, error: { message: 'Email and password are required' } };
    }

    // Basic email validation
    if (!cleanEmail.includes('@') || cleanEmail.length < 5) {
      return { data: null, error: { message: 'Invalid email format' } };
    }

    // Validate environment variables again
    console.log('🔑 Direct auth attempt for:', cleanEmail);
    console.log('🔑 SUPABASE_URL check:', typeof SUPABASE_URL, SUPABASE_URL.length);
    console.log('🔑 SUPABASE_KEY check:', typeof SUPABASE_KEY, SUPABASE_KEY.length);

    if (!SUPABASE_URL || !SUPABASE_KEY || typeof SUPABASE_URL !== 'string' || typeof SUPABASE_KEY !== 'string') {
      throw new Error('Invalid Supabase configuration');
    }

    // Create the request payload with strict validation
    const payload = {
      email: cleanEmail,
      password: cleanPassword
    };

    // Validate payload can be JSON stringified
    let jsonPayload: string;
    try {
      jsonPayload = JSON.stringify(payload);
      if (!jsonPayload || jsonPayload === '{}' || jsonPayload.includes('\0')) {
        throw new Error('Invalid payload serialization');
      }
    } catch (e) {
      throw new Error('Failed to serialize authentication payload');
    }

    // Construct URL with validation
    const authUrl = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
    if (!authUrl.startsWith('https://') || authUrl.includes('\0')) {
      throw new Error('Invalid authentication URL');
    }

    console.log('🔑 Making safe fetch request...');

    // Make safe API call
    const response = await safeFetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Accept': 'application/json'
      },
      body: jsonPayload
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
      console.error('🚨 Direct auth failed:', response.status, errorData);
      
      let errorMessage = 'Authentication failed';
      if (response.status === 400) {
        errorMessage = 'Invalid email or password';
      } else if (response.status === 422) {
        errorMessage = 'Account not found or email not confirmed';
      } else if (response.status === 429) {
        errorMessage = 'Too many attempts. Please try again later';
      }
      
      return { data: null, error: { message: errorMessage, status: response.status } };
    }

    const authData = await response.json();
    
    if (!authData.access_token || !authData.user) {
      console.error('🚨 Invalid auth response:', authData);
      return { data: null, error: { message: 'Invalid authentication response' } };
    }

    console.log('✅ Direct auth successful for user:', authData.user.id);
    return { data: authData, error: null };

  } catch (error) {
    console.error('🚨 Direct auth error:', error);
    let errorMessage = 'Network error. Please check your connection';
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'Connection failed. Please try again';
    }
    
    return { data: null, error: { message: errorMessage } };
  }
}

/**
 * Direct sign up using Supabase REST API
 */
export async function directSignUp(email: string, password: string, businessName: string): Promise<{ data: any; error: AuthError | null }> {
  try {
    // Validate inputs
    if (!email || !password || !businessName) {
      return { data: null, error: { message: 'All fields are required' } };
    }

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const cleanBusinessName = businessName.trim();

    if (!cleanEmail.includes('@')) {
      return { data: null, error: { message: 'Invalid email format' } };
    }

    if (cleanPassword.length < 6) {
      return { data: null, error: { message: 'Password must be at least 6 characters' } };
    }

    console.log('📧 Direct signup attempt for:', cleanEmail);

    // Determine redirect URL
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const productionUrl = import.meta.env.VITE_SITE_URL || 'https://expenzify.com';
    const redirectUrl = isLocalhost ? `${window.location.origin}/auth` : `${productionUrl}/auth`;

    const payload = {
      email: cleanEmail,
      password: cleanPassword,
      data: {
        business_name: cleanBusinessName
      },
      options: {
        emailRedirectTo: redirectUrl
      }
    };

    // Validate payload can be JSON stringified
    let jsonPayload: string;
    try {
      jsonPayload = JSON.stringify(payload);
      if (!jsonPayload || jsonPayload === '{}' || jsonPayload.includes('\0')) {
        throw new Error('Invalid signup payload serialization');
      }
    } catch (e) {
      throw new Error('Failed to serialize signup payload');
    }

    // Construct URL with validation
    const signupUrl = `${SUPABASE_URL}/auth/v1/signup`;
    if (!signupUrl.startsWith('https://') || signupUrl.includes('\0')) {
      throw new Error('Invalid signup URL');
    }

    const response = await safeFetch(signupUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Accept': 'application/json'
      },
      body: jsonPayload
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('🚨 Direct signup failed:', response.status, result);
      
      let errorMessage = 'Signup failed';
      if (result.message?.includes('already registered') || 
          result.message?.includes('user already exists') ||
          result.error_description?.includes('already registered')) {
        errorMessage = 'An account with this email already exists';
      } else if (result.message) {
        errorMessage = result.message;
      }
      
      return { data: null, error: { message: errorMessage, status: response.status } };
    }

    console.log('✅ Direct signup successful');
    return { data: result, error: null };

  } catch (error) {
    console.error('🚨 Direct signup error:', error);
    return { data: null, error: { message: 'Network error. Please try again' } };
  }
}