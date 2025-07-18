import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: string;
}

export default function ProtectedRoute({ children, fallback = "/auth" }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Give a brief moment for auth to settle
    if (!loading) {
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Show loading spinner while auth is being determined
  if (loading || !isReady) {
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
    return (
      <Navigate 
        to={fallback} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

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