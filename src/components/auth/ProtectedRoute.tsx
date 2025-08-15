import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: string;
  requireOnboarding?: boolean;
}

export default function ProtectedRoute({ children, fallback = "/auth", requireOnboarding = true }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { isCompleted: isOnboardingCompleted, loading: onboardingLoading } = useOnboarding();
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    console.log('ProtectedRoute: Auth state changed', { 
      hasUser: !!user, 
      loading, 
      onboardingLoading,
      isOnboardingCompleted,
      pathname: location.pathname,
      userId: user?.id 
    });

    // Give a brief moment for auth and onboarding to settle
    if (!loading && (!requireOnboarding || !onboardingLoading)) {
      const timer = setTimeout(() => {
        console.log('ProtectedRoute: Setting ready to true');
        setIsReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, onboardingLoading, user, isOnboardingCompleted, location.pathname, requireOnboarding]);

  // Show loading spinner while auth or onboarding is being determined
  if (loading || (requireOnboarding && onboardingLoading) || !isReady) {
    console.log('ProtectedRoute: Showing loading spinner', { loading, onboardingLoading, isReady });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated, preserving the intended destination
  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to auth');
    return (
      <Navigate 
        to={fallback} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Redirect to onboarding if not completed (for routes that require onboarding)
  if (requireOnboarding && !isOnboardingCompleted) {
    console.log('ProtectedRoute: User not onboarded, redirecting to onboarding');
    return (
      <Navigate 
        to="/onboarding" 
        replace 
      />
    );
  }

  console.log('ProtectedRoute: User authenticated and onboarded, rendering children');
  return <>{children}</>;
}

// Higher-order component for wrapping routes
export function withProtectedRoute<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: string
) {
  return function ProtectedComponent(props: T) {
    return (
      <ProtectedRoute fallback={fallback}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}