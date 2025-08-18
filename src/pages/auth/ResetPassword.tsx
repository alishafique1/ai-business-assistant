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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handlePasswordReset = async () => {
      console.log('🔑 Password reset page loaded');
      console.log('🔑 URL:', window.location.href);
      console.log('🔑 Search params:', window.location.search);
      console.log('🔑 Hash params:', window.location.hash);

      // Check for tokens in both URL search params and hash (Supabase can use either)
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      // Check for different token formats Supabase might use
      const accessToken = urlParams.get("access_token") || hashParams.get("access_token");
      const refreshToken = urlParams.get("refresh_token") || hashParams.get("refresh_token");
      const type = urlParams.get("type") || hashParams.get("type");
      const code = urlParams.get("code") || hashParams.get("code");
      
      console.log('🔑 Found parameters:', { 
        accessToken: accessToken ? 'present' : 'missing', 
        refreshToken: refreshToken ? 'present' : 'missing',
        type,
        code: code ? 'present' : 'missing'
      });
      
      // Handle code-based flow (newer Supabase versions)
      if (code) {
        console.log('🔑 Using code-based password reset flow');
        try {
          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('🔑 Code exchange error:', error);
            throw error;
          }
          
          console.log('🔑 Session established via code exchange:', data);
          
          // Clear the URL parameters to clean up the address bar
          window.history.replaceState({}, document.title, '/auth/reset-password');
          
          toast({
            title: "Ready to reset password",
            description: "Please enter your new password below.",
          });
          return;
        } catch (error) {
          console.error('🔑 Error exchanging code for session:', error);
          toast({
            title: "Invalid reset link",
            description: "This password reset link is invalid or expired. Please request a new one.",
            variant: "destructive",
          });
          navigate("/auth/forgot-password");
          return;
        }
      }
      
      // Handle token-based flow (older Supabase versions)
      if (accessToken && refreshToken) {
        console.log('🔑 Using token-based password reset flow');
        
        if (type && type !== "recovery") {
          console.error('🔑 Invalid link type:', type);
          toast({
            title: "Invalid reset link",
            description: "This is not a valid password reset link.",
            variant: "destructive",
          });
          navigate("/auth/forgot-password");
          return;
        }

        try {
          // Set the session with the tokens from the URL
          console.log('🔑 Setting session with tokens...');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) {
            console.error('🔑 Session set error:', error);
            throw error;
          }
          
          console.log('🔑 Session set successfully:', data);
          
          // Clear the URL parameters to clean up the address bar
          window.history.replaceState({}, document.title, '/auth/reset-password');
          
          toast({
            title: "Ready to reset password",
            description: "Please enter your new password below.",
          });
          return;
        } catch (error) {
          console.error('🔑 Error setting session:', error);
          toast({
            title: "Session error",
            description: "Unable to verify reset link. Please try requesting a new one.",
            variant: "destructive",
          });
          navigate("/auth/forgot-password");
          return;
        }
      }
      
      // No valid tokens or code found
      console.error('🔑 No valid reset parameters found in URL');
      toast({
        title: "Invalid reset link",
        description: "This password reset link is invalid or expired. Please request a new one.",
        variant: "destructive",
      });
      navigate("/auth/forgot-password");
    };

    handlePasswordReset();
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      // Verify we have an active session before updating password
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Session expired",
          description: "Your reset session has expired. Please request a new password reset link.",
          variant: "destructive",
        });
        navigate("/auth/forgot-password");
        return;
      }

      console.log('🔑 Updating password for user:', session.user.id);
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
    } catch (error: any) {
      console.error("Password update error:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while updating your password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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