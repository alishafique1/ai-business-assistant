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
import { Brain, Building2, Github, Mail } from "lucide-react";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [showResendSection, setShowResendSection] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get the intended destination from location state
  const from = location.state?.from || "/dashboard";
  
  // Check URL search params for default tab
  const searchParams = new URLSearchParams(location.search);
  const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'signin';

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate(from, { replace: true });
      }
    };
    checkAuth();
  }, [navigate]);

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
      const redirectUrl = `${window.location.origin}/onboarding`;
      
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            business_name: businessName.trim(),
          }
        }
      });

      if (error) throw error;

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
      
      // Provide user-friendly error messages
      if (error instanceof Error && error.message.includes('already registered')) {
        errorMessage = "This email is already registered. Please sign in instead or use a different email.";
      } else if (error instanceof Error && error.message.includes('Password should be at least 6 characters')) {
        errorMessage = "Password must be at least 6 characters long.";
      } else if (error instanceof Error && error.message.includes('Invalid email')) {
        errorMessage = "Please enter a valid email address.";
      } else if (error instanceof Error && error.message.includes('Network request failed')) {
        errorMessage = "Network error. Please check your connection and try again.";
      }

      toast({
        title: "Sign Up Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (!email || !password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
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

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data.user) {
        const userName = data.user.user_metadata?.business_name || data.user.email?.split('@')[0] || 'User';
        toast({
          title: `Welcome back, ${userName}!`,
          description: "You have been successfully signed in.",
        });
        navigate(from, { replace: true });
      }
    } catch (error: unknown) {
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      // Provide user-friendly error messages
      if (error instanceof Error && error.message.includes('Invalid login credentials')) {
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
      } else if (error instanceof Error && error.message.includes('Email not confirmed')) {
        errorMessage = "Please check your email and click the confirmation link before signing in.";
      } else if (error instanceof Error && error.message.includes('Too many requests')) {
        errorMessage = "Too many login attempts. Please wait a moment before trying again.";
      } else if (error instanceof Error && error.message.includes('Network request failed')) {
        errorMessage = "Network error. Please check your connection and try again.";
      }

      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/onboarding`
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/onboarding`
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

  const handleResendEmail = async () => {
    if (!resendEmail) {
      toast({
        title: "Error",
        description: "No email address found to resend to",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log('Attempting to resend email to:', resendEmail);
    
    try {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: resendEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`
        }
      });

      console.log('Resend response:', { data, error });

      if (error) {
        console.error('Resend error:', error);
        throw error;
      }

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
        <div className="flex items-center justify-center mb-8">
          <Brain className="h-8 w-8 text-primary mr-2" />
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            AI Business Hub
          </h1>
        </div>

        <Card className="border-border/50 shadow-elegant">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={defaultTab} className="w-full">
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
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? "Resending..." : "Resend Confirmation Email"}
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}