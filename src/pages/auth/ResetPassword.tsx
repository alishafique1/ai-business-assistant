import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, CheckCircle } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const validateResetLink = async () => {
      try {
        console.log('🔑 Password reset page loaded');
        console.log('🔑 Full URL:', window.location.href);

        // Parse URL parameters from both query string and hash
        const { params, errors } = parseUrlParameters();
        
        // Log what we found
        console.log('🔑 Parsed parameters:', params);
        if (errors.length > 0) {
          console.log('🔑 URL errors detected:', errors);
        }

        // Check for explicit error parameters first
        if (params.error) {
          handleExplicitError(params.error, params.error_description);
          return;
        }

        // Check if we already have a valid session
        const { data: currentSession } = await supabase.auth.getSession();
        
        if (currentSession.session) {
          console.log('🔑 Valid session found, user can reset password');
          setHasValidSession(true);
          setIsValidating(false);
          cleanUpUrl();
          showSuccessMessage();
          return;
        }

        // Try to establish session from URL parameters
        const sessionEstablished = await establishSessionFromUrl(params);
        
        if (sessionEstablished) {
          setHasValidSession(true);
          setIsValidating(false);
          cleanUpUrl();
          showSuccessMessage();
        } else {
          // No valid session could be established
          handleInvalidLink();
        }

      } catch (error) {
        console.error('🔑 Unexpected error during validation:', error);
        handleInvalidLink();
      }
    };

    // Helper function to parse URL parameters from both query and hash
    const parseUrlParameters = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const params = {
        // Authentication tokens (can be in query or hash)
        access_token: urlParams.get("access_token") || hashParams.get("access_token"),
        refresh_token: urlParams.get("refresh_token") || hashParams.get("refresh_token"),
        token_type: urlParams.get("token_type") || hashParams.get("token_type"),
        type: urlParams.get("type") || hashParams.get("type"),
        
        // Code-based flow
        code: urlParams.get("code") || hashParams.get("code"),
        
        // Error parameters
        error: urlParams.get("error") || hashParams.get("error"),
        error_code: urlParams.get("error_code") || hashParams.get("error_code"),
        error_description: urlParams.get("error_description") || hashParams.get("error_description"),
      };

      const errors = [];
      if (params.error) {
        errors.push(`Error: ${params.error}`);
        if (params.error_description) {
          errors.push(`Description: ${decodeURIComponent(params.error_description)}`);
        }
      }

      return { params, errors };
    };

    // Handle explicit error parameters in URL
    const handleExplicitError = (error: string, description?: string) => {
      console.error('🔑 Explicit error in URL:', { error, description });
      
      let message = "Your reset link is invalid or has expired.";
      
      if (error === "access_denied" || error === "otp_expired") {
        message = "Your reset link is invalid or has expired.";
      } else if (description) {
        message = decodeURIComponent(description);
      }

      setIsValidating(false);
      toast({
        title: "Invalid Reset Link",
        description: `${message} Please request a new one.`,
        variant: "destructive",
      });
      
      // Navigate after a short delay to show the error
      setTimeout(() => navigate("/auth/forgot-password"), 2000);
    };

    // Try to establish session from URL parameters
    const establishSessionFromUrl = async (params: {
      access_token?: string | null;
      refresh_token?: string | null;
      type?: string | null;
      code?: string | null;
      error?: string | null;
      error_code?: string | null;
      error_description?: string | null;
    }) => {
      // Handle token-based flow (hash parameters with access_token)
      if (params.access_token && params.refresh_token) {
        console.log('🔑 Found access token in URL, attempting to set session');
        
        // Verify this is a recovery/reset link
        if (params.type && params.type !== "recovery") {
          console.error('🔑 Invalid link type:', params.type);
          return false;
        }

        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          
          if (error) {
            console.error('🔑 Session set error:', error);
            return false;
          }
          
          console.log('🔑 Session established successfully');
          return true;
        } catch (error) {
          console.error('🔑 Error setting session:', error);
          return false;
        }
      }

      // Handle code-based flow (newer Supabase versions)
      if (params.code) {
        console.log('🔑 Found code in URL, checking for auto-established session');
        
        // Wait a moment for Supabase to process the auth state
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: session } = await supabase.auth.getSession();
        if (session.session) {
          console.log('🔑 Session auto-established from code');
          return true;
        }
      }

      return false;
    };

    // Handle invalid/expired links
    const handleInvalidLink = () => {
      console.error('🔑 No valid reset parameters found or session could not be established');
      setIsValidating(false);
      
      toast({
        title: "Invalid Reset Link",
        description: "Your reset link is invalid or has expired. Please request a new one.",
        variant: "destructive",
      });
      
      // Navigate after a short delay to show the error
      setTimeout(() => navigate("/auth/forgot-password"), 2000);
    };

    // Clean up URL parameters
    const cleanUpUrl = () => {
      window.history.replaceState({}, document.title, '/auth/reset-password');
    };

    // Show success message
    const showSuccessMessage = () => {
      toast({
        title: "Ready to reset password",
        description: "Please enter your new password below.",
      });
    };

    validateResetLink();
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form inputs
    if (!password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Double-check we have an active session before updating password
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !hasValidSession) {
        console.error('🔑 No valid session found during password update');
        toast({
          title: "Session expired",
          description: "Your reset session has expired. Please request a new password reset link.",
          variant: "destructive",
        });
        navigate("/auth/forgot-password");
        return;
      }

      console.log('🔑 Updating password for user:', session.user.id);
      
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error('🔑 Password update error:', error);
        throw error;
      }

      console.log('🔑 Password updated successfully');
      setIsSuccess(true);
      
      toast({
        title: "Password updated successfully",
        description: "Your password has been updated. You can now sign in with your new password.",
      });

      // Sign out the user and redirect to login
      await supabase.auth.signOut();
      
      // Redirect to auth page after a short delay
      setTimeout(() => {
        navigate("/auth");
      }, 2000);
      
    } catch (error: unknown) {
      console.error("🔑 Password update error:", error);
      
      let errorMessage = "An error occurred while updating your password";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Password Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show success state after password update
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Password updated successfully</CardTitle>
            <CardDescription>
              Your password has been updated. Redirecting you to sign in...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show loading state while validating the reset link
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Validating reset link...</CardTitle>
            <CardDescription>
              Please wait while we verify your password reset link.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if link is invalid (this will only show briefly before redirect)
  if (!hasValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Invalid Reset Link</CardTitle>
            <CardDescription>
              Your reset link is invalid or has expired. Redirecting to request a new one...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show the password reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            {password && confirmPassword && password !== confirmPassword && (
              <Alert variant="destructive">
                <AlertDescription>
                  Passwords do not match
                </AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}