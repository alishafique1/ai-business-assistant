import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Brain, Building2, Github, Mail, ArrowLeft } from "lucide-react";
import { runAuthDiagnostics, testRealAuth, testPasswordReset } from "@/utils/authDebug";
import { directSignIn, directSignUp } from "@/utils/directAuth";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [showResendSection, setShowResendSection] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isCompleted: isOnboardingCompleted, loading: onboardingLoading, checkOnboardingStatus } = useOnboarding();
  
  // Get the intended destination from location state
  const from = location.state?.from || "/dashboard";
  
  // Check URL search params for default tab
  const searchParams = new URLSearchParams(location.search);
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') === 'signup' ? 'signup' : 'signin');

  useEffect(() => {
    // Handle email confirmation
    const handleEmailConfirmation = async () => {
      // Use comprehensive parameter extraction with safe defaults
      const fullUrl = window.location.href || '';
      const nativeSearch = window.location.search || '';
      const nativeHash = window.location.hash || '';
      
      console.log('🔍 Auth page - Full URL:', fullUrl);
      console.log('🔍 Auth page - Native search:', nativeSearch);
      console.log('🔍 Auth page - Native hash:', nativeHash);
      
      const urlParams = new URLSearchParams(nativeSearch || '');
      const hashParams = new URLSearchParams((nativeHash || '').substring(1));
      const reactUrlParams = new URLSearchParams(location.search || '');
      const reactHashParams = new URLSearchParams((location.hash || '').substring(1));
      
      console.log('🔍 Auth URL Params:', Array.from(urlParams.entries()));
      console.log('🔍 Auth Hash Params:', Array.from(hashParams.entries()));
      
      // Show the actual parameter values
      if (urlParams.size > 0) {
        urlParams.forEach((value, key) => {
          console.log(`🔍 Auth URL Param: ${key} = ${value}`);
        });
      }
      if (hashParams.size > 0) {
        hashParams.forEach((value, key) => {
          console.log(`🔍 Auth Hash Param: ${key} = ${value}`);
        });
      }
      
      const accessToken = urlParams.get('access_token') || hashParams.get('access_token') || 
                         reactUrlParams.get('access_token') || reactHashParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token') ||
                         reactUrlParams.get('refresh_token') || reactHashParams.get('refresh_token');
      const type = urlParams.get('type') || hashParams.get('type') ||
                  reactUrlParams.get('type') || reactHashParams.get('type');
      const tokenHash = urlParams.get('token_hash') || hashParams.get('token_hash') ||
                       reactUrlParams.get('token_hash') || reactHashParams.get('token_hash');
      const token = urlParams.get('token') || hashParams.get('token') ||
                   reactUrlParams.get('token') || reactHashParams.get('token');
      
      // Handle email confirmation directly on this page
      if (accessToken && refreshToken && type === 'signup') {
        console.log('📧 Handling email confirmation on auth page');
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) throw error;
          
          if (data.user) {
            // Clear URL parameters
            window.history.replaceState({}, document.title, '/auth');
            
            toast({
              title: "Email Confirmed!",
              description: "Welcome! Redirecting to onboarding...",
            });
            
            // Check onboarding status and redirect accordingly
            await checkOnboardingStatus();
            // The redirect will happen automatically via the useEffect below
            return;
          }
        } catch (error) {
          console.error('Email confirmation error:', error);
          toast({
            title: "Confirmation Error",
            description: "There was an issue confirming your email. Please try signing in.",
            variant: "destructive",
          });
        }
      } else if (tokenHash || token) {
        console.log('📧 Attempting alternative token confirmation');
        try {
          const tokenToUse = tokenHash || token;
          const { data, error } = await supabase.auth.verifyOtp({
            token: tokenToUse,
            type: 'email'
          });
          
          if (error) throw error;
          
          if (data.user) {
            // Clear URL parameters
            window.history.replaceState({}, document.title, '/auth');
            
            toast({
              title: "Email Confirmed!",
              description: "Welcome! Redirecting to onboarding...",
            });
            
            // Check onboarding status and redirect accordingly
            await checkOnboardingStatus();
            // The redirect will happen automatically via the useEffect below
            return;
          }
        } catch (error) {
          console.error('Token verification error:', error);
          toast({
            title: "Confirmation Error",
            description: "There was an issue confirming your email. Please try signing in.",
            variant: "destructive",
          });
        }
      }
      
      // Check if user is already logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check onboarding status and redirect accordingly
        await checkOnboardingStatus();
        // The redirect will happen in the useEffect below based on onboarding status
      }
    };
    
    handleEmailConfirmation();
  }, [navigate, location.search, location.hash, from]);

  // Handle redirect based on authentication status
  useEffect(() => {
    const checkAndRedirectUser = async () => {
      // Only proceed if onboarding check is complete
      if (onboardingLoading) {
        console.log('⏳ Waiting for onboarding check to complete...');
        return;
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error getting session:', error);
        return;
      }
      
      if (session?.user) {
        console.log('✅ User is authenticated, determining redirect...', {
          userId: session.user.id,
          email: session.user.email,
          onboardingCompleted: isOnboardingCompleted
        });
        
        // Clear any UI state
        setEmailConfirmed(false);
        
        // Determine where to redirect
        const redirectTo = isOnboardingCompleted ? from : '/onboarding';
        console.log('🔄 Redirecting to:', redirectTo);
        
        // Redirect immediately
        navigate(redirectTo, { replace: true });
      } else {
        console.log('ℹ️ No authenticated user found');
      }
    };

    checkAndRedirectUser();
  }, [onboardingLoading, isOnboardingCompleted, navigate, from]);

  // Listen for cross-tab email confirmation
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'emailConfirmed' && event.newValue) {
        try {
          const confirmationData = JSON.parse(event.newValue);
          
          if (confirmationData.success) {
            toast({
              title: "Email Confirmed!",
              description: "Your email has been confirmed. Redirecting to onboarding...",
            });
            
            // Clear the localStorage item and navigate to onboarding
            localStorage.removeItem('emailConfirmed');
            navigate('/onboarding', { replace: true });
          } else if (confirmationData.error) {
            toast({
              title: "Confirmation Error",
              description: confirmationData.error,
              variant: "destructive",
            });
            localStorage.removeItem('emailConfirmed');
          }
        } catch (error) {
          console.error('Error parsing confirmation data:', error);
        }
      }
    };

    // Check for existing confirmation data on mount (in case the event was missed)
    const checkExistingConfirmation = () => {
      const existingConfirmation = localStorage.getItem('emailConfirmed');
      if (existingConfirmation) {
        try {
          const confirmationData = JSON.parse(existingConfirmation);
          // Only process if it's recent (within last 30 seconds)
          if (Date.now() - confirmationData.timestamp < 30000) {
            handleStorageChange({
              key: 'emailConfirmed',
              newValue: existingConfirmation
            } as StorageEvent);
          } else {
            // Clean up old confirmation data
            localStorage.removeItem('emailConfirmed');
          }
        } catch (error) {
          console.error('Error checking existing confirmation:', error);
          localStorage.removeItem('emailConfirmed');
        }
      }
    };

    checkExistingConfirmation();
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate, toast]);

  // Function to check if email already exists in Supabase auth
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      console.log('🔍 Checking if email exists:', email);
      
      // Try to initiate password reset for the email
      // This will succeed if the email exists, fail if it doesn't
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });
      
      // If no error, the email exists in the system
      if (!error) {
        console.log('📧 Email exists in authentication system');
        return true;
      }
      
      // Check the specific error message to determine if email exists
      const errorMessage = error.message.toLowerCase();
      
      // These errors indicate the email doesn't exist
      if (errorMessage.includes('user not found') || 
          errorMessage.includes('email not found') ||
          errorMessage.includes('no user found') ||
          errorMessage.includes('invalid email')) {
        console.log('📧 Email does not exist in authentication system');
        return false;
      }
      
      // For other errors (rate limiting, etc.), assume email might exist
      console.log('⚠️ Ambiguous error when checking email:', error.message);
      return false; // Allow signup attempt, let Supabase handle the actual validation
      
    } catch (error) {
      console.error('❌ Error checking email existence:', error);
      // On error, allow the signup to proceed (fail open)
      return false;
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (!businessName || !email || !password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes('@')) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    if (businessName.length < 2) {
      toast({
        title: "Validation Error",
        description: "Business name must be at least 2 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check if email already exists before attempting signup
      const emailExists = await checkEmailExists(email.trim());
      
      if (emailExists) {
        console.log('🚫 Preventing signup - email already exists');
        toast({
          title: "Account Already Exists",
          description: "An account with this email address already exists. Please sign in instead or use a different email address.",
          variant: "destructive",
          action: (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => setActiveTab('signin')}
              className="bg-white text-black border border-gray-300 hover:bg-gray-100"
            >
              Go to Sign In
            </Button>
          ),
        });
        return;
      }

      console.log('✅ Email check passed, proceeding with signup');
      console.log('📧 Using direct signup for email:', email.trim());
      
      // Use direct signup to bypass Supabase client issues
      const { data: signupData, error: signupError } = await directSignUp(email, password, businessName);
      
      if (signupError) {
        throw new Error(signupError.message);
      }

      toast({
        title: "Account created!",
        description: "Please check your email to confirm your account before signing in.",
      });
      
      // Show resend section and store email for resend
      setShowResendSection(true);
      setResendEmail(email.trim());
      
      // Clear form
      setEmail("");
      setPassword("");
      setBusinessName("");
      
    } catch (error: unknown) {
      let errorMessage = "An unexpected error occurred. Please try again.";
      let showSignInButton = false;
      
      console.error('🚨 Signup error:', error);
      
      // Provide user-friendly error messages
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        
        // Enhanced duplicate email detection
        if (errorMsg.includes('already registered') || 
            errorMsg.includes('user already exists') ||
            errorMsg.includes('email already in use') ||
            errorMsg.includes('user with this email already exists') ||
            errorMsg.includes('duplicate') ||
            errorMsg.includes('email address already used') ||
            errorMsg.includes('email already taken') ||
            errorMsg.includes('email is already registered') ||
            errorMsg.includes('account already exists') ||
            errorMsg.includes('user already registered')) {
          
          console.log('🚫 Detected duplicate email error from Supabase');
          errorMessage = "An account with this email address already exists. Please sign in instead or use a different email address.";
          showSignInButton = true;
          
        } else if (errorMsg.includes('password should be at least 6 characters')) {
          errorMessage = "Password must be at least 6 characters long.";
        } else if (errorMsg.includes('invalid email') || errorMsg.includes('email address is invalid')) {
          errorMessage = "Please enter a valid email address.";
        } else if (errorMsg.includes('network request failed') || errorMsg.includes('fetch')) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (errorMsg.includes('rate limit') || errorMsg.includes('too many requests')) {
          errorMessage = "Too many signup attempts. Please wait a moment before trying again.";
        } else if (errorMsg.includes('signup is disabled')) {
          errorMessage = "Account creation is currently disabled. Please contact support.";
        } else if (errorMsg.includes('email rate limit')) {
          errorMessage = "Too many emails sent to this address. Please wait before trying again.";
        } else {
          // Log the actual error for debugging but show a generic message
          console.error('🚨 Unhandled signup error:', error.message);
          errorMessage = `Signup failed: ${error.message}`;
        }
      }

      toast({
        title: "Sign Up Failed", 
        description: errorMessage,
        variant: "destructive",
        action: showSignInButton ? (
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setActiveTab('signin')}
            className="bg-white text-black border border-gray-300 hover:bg-gray-100"
          >
            Go to Sign In
          </Button>
        ) : undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    console.log('🔑 === SIGNIN ATTEMPT ===');
    console.log('🔑 Form data:', { email: email.trim(), hasPassword: !!password, passwordLength: password.length });
    
    if (!email || !password) {
      console.log('❌ Validation failed: Missing email or password');
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes('@')) {
      console.log('❌ Validation failed: Invalid email format');
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    console.log('✅ Client-side validation passed');
    setIsLoading(true);

    try {
      console.log('🔑 Using direct authentication method...');
      
      // Use direct authentication to bypass Supabase client issues
      const { data: authData, error: authError } = await directSignIn(email, password);
      
      if (authError) {
        throw new Error(authError.message);
      }
      
      if (authData) {
        console.log('✅ Direct authentication successful');
        
        // Set the session in Supabase client
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: authData.access_token,
          refresh_token: authData.refresh_token
        });
        
        if (sessionError) {
          console.warn('⚠️ Session setting failed, but auth succeeded:', sessionError);
          // Continue anyway - we have valid tokens
        }
        
        const userName = authData.user.email?.split('@')[0] || authData.user.user_metadata?.business_name || 'User';
        
        toast({
          title: `Welcome back, ${userName}!`,
          description: "You have been successfully signed in.",
        });
        
        // Clear form
        setEmail("");
        setPassword("");
        
        // Trigger onboarding status check
        console.log('🔑 Triggering onboarding status check...');
        await checkOnboardingStatus();
        console.log('🔑 Onboarding status check completed - useEffect will handle redirect');
      }
      
    } catch (error: unknown) {
      console.error('❌ SIGNIN FAILED:', error);
      
      let errorMessage = "An unexpected error occurred. Please try again.";
      let showForgotPassword = false;
      
      // Enhanced error handling
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('invalid email or password') ||
            errorMsg.includes('invalid login credentials') || 
            errorMsg.includes('invalid credentials') ||
            errorMsg.includes('wrong password') ||
            errorMsg.includes('incorrect password')) {
          errorMessage = "❌ Invalid email or password. Please check your credentials.";
          showForgotPassword = true;
        } else if (errorMsg.includes('account not found') ||
                   errorMsg.includes('email not confirmed') ||
                   errorMsg.includes('email not found')) {
          errorMessage = "📧 Account not found or email not confirmed. Please check your email or sign up.";
        } else if (errorMsg.includes('too many attempts') ||
                   errorMsg.includes('rate limit')) {
          errorMessage = "⏰ Too many attempts. Please wait before trying again.";
        } else if (errorMsg.includes('network') ||
                   errorMsg.includes('connection') ||
                   errorMsg.includes('fetch')) {
          errorMessage = "🌐 Network error. Please check your internet connection.";
        } else {
          errorMessage = error.message || errorMessage;
        }
      }

      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
        action: showForgotPassword ? (
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => window.location.href = '/auth/forgot-password'}
            className="bg-white text-black border border-gray-300 hover:bg-gray-100"
          >
            Reset Password
          </Button>
        ) : undefined,
      });
    }
    
    setIsLoading(false);
  };

  const handleGoogleAuth = async () => {
    try {
      // Use production URL for OAuth redirects, fallback to current origin for local dev
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const productionUrl = import.meta.env.VITE_SITE_URL || 'https://www.expenzify.com';
      const redirectUrl = isLocalhost ? `${window.location.origin}/onboarding` : `${productionUrl}/onboarding`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      if (error) throw error;
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleGithubAuth = async () => {
    try {
      // Use production URL for OAuth redirects, fallback to current origin for local dev
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const productionUrl = import.meta.env.VITE_SITE_URL || 'https://www.expenzify.com';
      const redirectUrl = isLocalhost ? `${window.location.origin}/onboarding` : `${productionUrl}/onboarding`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: redirectUrl
        }
      });
      if (error) throw error;
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  // Test Supabase connection
  const testConnection = async () => {
    try {
      console.log('🔧 Testing Supabase connection...');
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Supabase connection error:', error);
        toast({
          title: "Connection Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      console.log('✅ Supabase connection successful');
      toast({
        title: "Connection Test",
        description: `Supabase connected successfully. Current session: ${data.session ? 'Active' : 'None'}`,
      });
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      toast({
        title: "Connection Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  // Add cooldown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (!resendEmail) {
      toast({
        title: "Error",
        description: "No email address found to resend to",
        variant: "destructive",
      });
      return;
    }

    if (resendCooldown > 0) {
      toast({
        title: "Please Wait",
        description: `You can resend the email in ${resendCooldown} seconds.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log('Attempting to resend email to:', resendEmail);
    
    try {
      // Use production URL for email redirects, fallback to current origin for local dev
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const productionUrl = import.meta.env.VITE_SITE_URL || 'https://www.expenzify.com';
      const redirectUrl = isLocalhost ? `${window.location.origin}/auth` : `${productionUrl}/auth`;
      
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: resendEmail,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      console.log('Resend response:', { data, error });

      if (error) {
        console.error('Resend error:', error);
        
        // Handle rate limiting specifically
        if (error.message.includes('after') && error.message.includes('seconds')) {
          const seconds = error.message.match(/\d+/)?.[0];
          const waitTime = seconds ? parseInt(seconds) : 30;
          setResendCooldown(waitTime);
          toast({
            title: "Rate Limited",
            description: `Please wait ${waitTime} seconds before trying again.`,
            variant: "destructive",
          });
          return;
        }
        
        throw error;
      }

      // Set cooldown on successful send
      setResendCooldown(30);
      
      toast({
        title: "Email Resent!",
        description: `A new confirmation link has been sent to ${resendEmail}. Please check your email and spam folder.`,
      });
    } catch (error: unknown) {
      console.error('Resend failed:', error);
      
      let errorMessage = "Failed to resend email. Please try again.";
      
      if (error instanceof Error) {
        // Handle specific Supabase errors
        if (error.message.includes('rate limit')) {
          errorMessage = "Too many attempts. Please wait a few minutes before trying again.";
        } else if (error.message.includes('already confirmed')) {
          errorMessage = "This email is already confirmed. You can sign in now.";
        } else if (error.message.includes('not found')) {
          errorMessage = "Email not found. Please try signing up again.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Resend Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-primary/10 p-4">
      <div className="w-full max-w-md">
        {/* Back Arrow */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 p-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Home</span>
          </Button>
        </div>
        <div className="flex items-center justify-center mb-8">
          <Link 
            to="/" 
            className="flex items-center hover:scale-105 transition-transform duration-300 group"
          >
            <Brain className="h-8 w-8 text-primary mr-2 group-hover:rotate-12 transition-transform duration-300" />
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent group-hover:drop-shadow-md transition-all duration-300">
              Expenzify
            </h1>
          </Link>
        </div>

        <Card className="border-border/50 shadow-elegant">
          <CardHeader className="space-y-1">
            {emailConfirmed && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-center text-green-700">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Email Confirmed Successfully!</span>
                </div>
                <p className="text-green-600 text-sm mt-1 text-center">
                  Your email has been verified. Please sign in below to access your dashboard.
                </p>
              </div>
            )}
            
            <CardTitle className="text-2xl text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              {emailConfirmed ? 
                "Your email is confirmed! Please sign in to continue." :
                "Sign in to your account or create a new one"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                  <div className="text-center">
                    <Link 
                      to="/auth/forgot-password" 
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="business-name">Business Name</Label>
                    <Input
                      id="business-name"
                      type="text"
                      placeholder="Enter your business name"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Resend Email Section */}
            {showResendSection && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
                <div className="text-center space-y-3">
                  <h3 className="font-medium text-sm">Didn't receive the email?</h3>
                  <p className="text-xs text-muted-foreground">
                    Check your spam folder, or click below to resend the confirmation email to{" "}
                    <span className="font-medium">{resendEmail}</span>
                  </p>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleResendEmail}
                      disabled={isLoading || resendCooldown > 0}
                      className="w-full"
                    >
                      {isLoading ? "Resending..." : 
                       resendCooldown > 0 ? `Wait ${resendCooldown}s` : 
                       "Resend Confirmation Email"}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Still having issues? Try switching to the Sign In tab and use "Forgot Password" 
                      or contact support.
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowResendSection(false)}
                    className="w-full text-xs"
                  >
                    Hide this section
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6">
              <Separator className="my-4" />
              <div className="text-center text-sm text-muted-foreground mb-4">
                Or continue with
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleGoogleAuth}
                  className="w-full"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Google
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleGithubAuth}
                  className="w-full"
                >
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </Button>
              </div>
              
              {/* Debug section */}
              <div className="mt-4">
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">Debug Tools</summary>
                  <div className="mt-2 space-y-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={testConnection}
                      className="w-full text-xs"
                    >
                      Test Supabase Connection
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        console.log('🧪 Current form state:', { email, password: password ? '***' : '', isLoading });
                        console.log('🧪 Auth context:', { onboardingLoading, isOnboardingCompleted });
                      }}
                      className="w-full text-xs"
                    >
                      Debug Form State
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={async () => {
                        await runAuthDiagnostics();
                        toast({
                          title: "Diagnostics Complete",
                          description: "Check console for detailed results",
                        });
                      }}
                      className="w-full text-xs"
                    >
                      Full System Check
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={async () => {
                        if (email) {
                          console.log('🧪 Testing password reset for:', email);
                          const result = await testPasswordReset(email);
                          toast({
                            title: result.success ? "Reset Test Passed" : "Reset Test Failed",
                            description: result.error || "Password reset function is working",
                            variant: result.success ? "default" : "destructive"
                          });
                        } else {
                          toast({
                            title: "Enter Email First",
                            description: "Please enter an email address to test password reset",
                            variant: "destructive"
                          });
                        }
                      }}
                      className="w-full text-xs"
                    >
                      Test Password Reset
                    </Button>
                    <div className="text-muted-foreground">
                      <p>Environment: {import.meta.env.MODE}</p>
                      <p>Site URL: {import.meta.env.VITE_SITE_URL || 'Not set'}</p>
                      <p>Current URL: {window.location.href}</p>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}