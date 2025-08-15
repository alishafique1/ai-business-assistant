import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function EmailConfirmation() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');
  const location = useLocation();

  useEffect(() => {
    const handleConfirmation = async () => {
      try {
        // Use native window.location to ensure we get the full URL
        const fullUrl = window.location.href;
        const nativeSearch = window.location.search;
        const nativeHash = window.location.hash;
        
        console.log('🔍 Email confirmation - Full URL:', fullUrl);
        console.log('🔍 Email confirmation - Native search:', nativeSearch);
        console.log('🔍 Email confirmation - Native hash:', nativeHash);
        console.log('🔍 Email confirmation - React location search:', location.search);
        console.log('🔍 Email confirmation - React location hash:', location.hash);
        
        // Try both native and React Router location params
        const urlParams = new URLSearchParams(nativeSearch);
        const hashParams = new URLSearchParams(nativeHash.substring(1));
        const reactUrlParams = new URLSearchParams(location.search);
        const reactHashParams = new URLSearchParams(location.hash.substring(1));
        
        console.log('🔍 Native URL Params:', Array.from(urlParams.entries()));
        console.log('🔍 Native Hash Params:', Array.from(hashParams.entries()));
        console.log('🔍 React URL Params:', Array.from(reactUrlParams.entries()));
        console.log('🔍 React Hash Params:', Array.from(reactHashParams.entries()));
        
        // Show the actual parameter values
        if (urlParams.size > 0) {
          urlParams.forEach((value, key) => {
            console.log(`🔍 URL Param: ${key} = ${value}`);
          });
        }
        if (hashParams.size > 0) {
          hashParams.forEach((value, key) => {
            console.log(`🔍 Hash Param: ${key} = ${value}`);
          });
        }
        
        // Look for tokens in various common parameter names
        const accessToken = urlParams.get('access_token') || hashParams.get('access_token') || 
                           reactUrlParams.get('access_token') || reactHashParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token') ||
                           reactUrlParams.get('refresh_token') || reactHashParams.get('refresh_token');
        const type = urlParams.get('type') || hashParams.get('type') ||
                    reactUrlParams.get('type') || reactHashParams.get('type');
        const tokenHash = urlParams.get('token_hash') || hashParams.get('token_hash') ||
                         reactUrlParams.get('token_hash') || reactHashParams.get('token_hash');
        
        // Also check for other common Supabase parameter names
        const token = urlParams.get('token') || hashParams.get('token') ||
                     reactUrlParams.get('token') || reactHashParams.get('token');
        const confirmationToken = urlParams.get('confirmation_token') || hashParams.get('confirmation_token') ||
                                 reactUrlParams.get('confirmation_token') || reactHashParams.get('confirmation_token');
        const next = urlParams.get('next') || hashParams.get('next') ||
                    reactUrlParams.get('next') || reactHashParams.get('next');
        
        console.log('🔍 Extracted tokens:', { 
          accessToken: accessToken ? accessToken.substring(0, 10) + '...' : null, 
          refreshToken: refreshToken ? refreshToken.substring(0, 10) + '...' : null, 
          type,
          tokenHash: tokenHash ? tokenHash.substring(0, 10) + '...' : null,
          token: token ? token.substring(0, 10) + '...' : null,
          confirmationToken: confirmationToken ? confirmationToken.substring(0, 10) + '...' : null,
          next
        });
        
        // Handle different Supabase confirmation formats
        if (accessToken && refreshToken && type === 'signup') {
          console.log('📧 Using access_token + refresh_token flow');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) throw error;
          
          if (data.user) {
            localStorage.setItem('emailConfirmed', JSON.stringify({
              timestamp: Date.now(),
              user: data.user,
              success: true
            }));
            
            setStatus('success');
            setTimeout(() => window.close(), 2000);
          }
        } else if (tokenHash && type === 'signup') {
          console.log('📧 Using token_hash flow');
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'email'
          });
          
          if (error) throw error;
          
          if (data.user) {
            localStorage.setItem('emailConfirmed', JSON.stringify({
              timestamp: Date.now(),
              user: data.user,
              success: true
            }));
            
            setStatus('success');
            setTimeout(() => window.close(), 2000);
          }
        } else if (token && type === 'signup') {
          console.log('📧 Using simple token flow');
          const { data, error } = await supabase.auth.verifyOtp({
            token: token,
            type: 'email'
          });
          
          if (error) throw error;
          
          if (data.user) {
            localStorage.setItem('emailConfirmed', JSON.stringify({
              timestamp: Date.now(),
              user: data.user,
              success: true
            }));
            
            setStatus('success');
            setTimeout(() => window.close(), 2000);
          }
        } else if (confirmationToken) {
          console.log('📧 Using confirmation_token flow');
          const { data, error } = await supabase.auth.verifyOtp({
            token: confirmationToken,
            type: 'email'
          });
          
          if (error) throw error;
          
          if (data.user) {
            localStorage.setItem('emailConfirmed', JSON.stringify({
              timestamp: Date.now(),
              user: data.user,
              success: true
            }));
            
            setStatus('success');
            setTimeout(() => window.close(), 2000);
          }
        } else {
          // If no tokens found, provide detailed error info
          console.error('❌ No valid confirmation tokens found');
          console.error('Available URL params:', Array.from(urlParams.entries()));
          console.error('Available hash params:', Array.from(hashParams.entries()));
          console.error('React URL params:', Array.from(reactUrlParams.entries()));
          console.error('React hash params:', Array.from(reactHashParams.entries()));
          
          // Show what we actually found
          console.log('🔍 All extracted values:', {
            accessToken, refreshToken, type, tokenHash, token, confirmationToken, next
          });
          
          // Try to handle confirmation even without type parameter
          if (token || confirmationToken || tokenHash) {
            console.log('📧 Attempting confirmation without type check');
            
            const tokenToUse = token || confirmationToken || tokenHash;
            try {
              const { data, error } = await supabase.auth.verifyOtp({
                token: tokenToUse,
                type: 'email'
              });
              
              if (error) {
                console.error('Verification error:', error);
                throw error;
              }
              
              if (data.user) {
                console.log('✅ Email confirmed successfully!');
                localStorage.setItem('emailConfirmed', JSON.stringify({
                  timestamp: Date.now(),
                  user: data.user,
                  success: true
                }));
                
                setStatus('success');
                setTimeout(() => window.close(), 2000);
                return;
              }
            } catch (verifyError) {
              console.error('Token verification failed:', verifyError);
            }
          }
          
          if (!type) {
            throw new Error('Missing confirmation type parameter');
          } else if (type !== 'signup') {
            throw new Error(`Invalid confirmation type: ${type}`);
          } else {
            throw new Error('Missing authentication tokens. Please try requesting a new confirmation email.');
          }
        }
      } catch (error) {
        console.error('Email confirmation error:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
        
        // Store error in localStorage for cross-tab communication
        localStorage.setItem('emailConfirmed', JSON.stringify({
          timestamp: Date.now(),
          success: false,
          error: error instanceof Error ? error.message : 'An unexpected error occurred'
        }));
      }
    };

    handleConfirmation();
  }, [location]);

  const handleManualClose = () => {
    window.close();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-primary/10 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <Brain className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AI Business Hub
            </h1>
          </div>
        </div>

        <Card className="border-border/50 shadow-elegant">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              {status === 'processing' && (
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              )}
              {status === 'success' && (
                <CheckCircle className="h-12 w-12 text-green-500" />
              )}
              {status === 'error' && (
                <XCircle className="h-12 w-12 text-red-500" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {status === 'processing' && 'Confirming Email...'}
              {status === 'success' && 'Email Confirmed!'}
              {status === 'error' && 'Confirmation Failed'}
            </CardTitle>
            <CardDescription>
              {status === 'processing' && 'Please wait while we confirm your email address.'}
              {status === 'success' && 'Your email has been successfully confirmed. This tab will close automatically.'}
              {status === 'error' && 'There was an issue confirming your email address.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {status === 'success' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You can now return to the original tab to continue with your account setup.
                </p>
                <Button onClick={handleManualClose} variant="outline" className="w-full">
                  Close Tab
                </Button>
              </div>
            )}
            
            {status === 'error' && (
              <div className="space-y-4">
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {errorMessage}
                </p>
                <p className="text-sm text-muted-foreground">
                  Please return to the original tab and try signing in, or contact support if the issue persists.
                </p>
                <Button onClick={handleManualClose} variant="outline" className="w-full">
                  Close Tab
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}