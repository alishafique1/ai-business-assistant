import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowLeft, Settings } from "lucide-react";
import { checkSupabaseConfig, testSupabaseConnection } from "@/utils/supabaseCheck";
import { testPasswordReset } from "@/utils/authDebug";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📧 === PASSWORD RESET ATTEMPT ===');
    console.log('📧 Email:', email);
    
    if (!email) {
      console.log('❌ No email provided');
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes('@')) {
      console.log('❌ Invalid email format');
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Use our enhanced testing function
    const result = await testPasswordReset(email.trim());
    
    if (result.success) {
      console.log('✅ PASSWORD RESET EMAIL SENT');
      setIsSuccess(true);
      setResendCooldown(60);
      
      toast({
        title: "Password reset email sent!",
        description: "Check your email (including spam folder) for the reset link. If you don't receive it, try the resend button below.",
      });
    } else {
      console.error('❌ PASSWORD RESET FAILED:', result.error);
      
      let errorMessage = result.error || "Failed to send password reset email";
      
      // Enhanced error handling
      if (result.error) {
        const errorMsg = result.error.toLowerCase();
        
        if (errorMsg.includes('user not found') || 
            errorMsg.includes('no user found') ||
            errorMsg.includes('invalid email') ||
            errorMsg.includes('email not found')) {
          errorMessage = "👤 No account found with this email address. Please check the email or sign up for a new account.";
        } else if (errorMsg.includes('rate limit') || 
                   errorMsg.includes('too many requests') ||
                   errorMsg.includes('email rate limit')) {
          errorMessage = "⏰ Too many password reset attempts. Please wait 5-10 minutes before trying again.";
          setResendCooldown(300); // 5 minute cooldown for rate limiting
        } else if (errorMsg.includes('signup is disabled') ||
                   errorMsg.includes('disabled')) {
          errorMessage = "🚫 Password reset is currently unavailable. Please contact support.";
        } else if (errorMsg.includes('network') ||
                   errorMsg.includes('fetch') ||
                   errorMsg.includes('connection')) {
          errorMessage = "🌐 Network error. Please check your internet connection and try again.";
        } else {
          errorMessage = `📧 Password reset failed: ${result.error}`;
        }
      }
      
      toast({
        title: "Password Reset Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) {
      toast({
        title: "Please wait",
        description: `You can resend the email in ${resendCooldown} seconds.`,
        variant: "destructive",
      });
      return;
    }
    
    await handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const runDiagnostics = async () => {
    console.log('🔧 Running Supabase diagnostics...');
    
    // Check configuration
    const config = checkSupabaseConfig();
    console.log('📋 Configuration:', config);
    
    // Test connection
    const connection = await testSupabaseConnection();
    console.log('🔗 Connection test:', connection);
    
    toast({
      title: "Diagnostics Complete",
      description: "Check the browser console for detailed results",
    });
  };

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We've sent a password reset link to {email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Click the link in the email to reset your password. If you don't see the email:
                <ul className="mt-2 ml-4 list-disc text-sm space-y-1">
                  <li>Check your spam/junk folder</li>
                  <li>Check your promotions tab (Gmail)</li>
                  <li>Wait a few minutes - emails can be delayed</li>
                  <li>Make sure you entered the correct email address</li>
                  <li>Try the resend button below</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            {/* Email Configuration Notice */}
            <Alert className="border-orange-200 bg-orange-50">
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium text-orange-800">
                    ⚠️ Email Delivery Issue
                  </p>
                  <p className="text-sm text-orange-700">
                    Your project is using Supabase's default email service, which has delivery limitations. 
                    The password reset API is working correctly, but emails may not reach your inbox.
                  </p>
                  <div className="mt-2 p-2 bg-white rounded text-xs">
                    <p className="font-medium mb-1">To fix this permanently:</p>
                    <ol className="list-decimal ml-4 space-y-1">
                      <li>Go to your Supabase Dashboard → Authentication → Settings</li>
                      <li>Configure a custom SMTP provider (like Resend, SendGrid, or AWS SES)</li>
                      <li>This will ensure reliable email delivery for all auth emails</li>
                    </ol>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
            
            {/* Resend Section */}
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Didn't receive the email?
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleResend}
                  disabled={isLoading || resendCooldown > 0}
                  className="w-full"
                >
                  {isLoading ? "Resending..." : 
                   resendCooldown > 0 ? `Wait ${resendCooldown}s` : 
                   "Resend reset link"}
                </Button>
              </div>
              
              <div className="text-center">
                <Link 
                  to="/auth" 
                  className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot your password?</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send reset link"}
            </Button>
            
            {/* Debug Information */}
            <div className="mt-4 p-3 bg-muted/50 rounded text-xs text-muted-foreground">
              <details>
                <summary className="cursor-pointer">Debug Info (click to expand)</summary>
                <div className="mt-2 space-y-1">
                  <p>Environment: {import.meta.env.MODE}</p>
                  <p>Site URL: {import.meta.env.VITE_SITE_URL || 'Not set'}</p>
                  <p>Current Origin: {window.location.origin}</p>
                  <p>Is Localhost: {window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'Yes' : 'No'}</p>
                </div>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm"
                  onClick={runDiagnostics}
                  className="mt-2 text-xs"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Run Diagnostics
                </Button>
              </details>
            </div>
            
            <div className="text-center">
              <Link 
                to="/auth" 
                className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}