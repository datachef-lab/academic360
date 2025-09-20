import { useAuth } from "@/features/auth/hooks/use-auth";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

type ProtectedRouteWrapperProps = {
  children: React.ReactNode;
};

export default function ProtectedRouteWrapper({ children }: ProtectedRouteWrapperProps) {
  const navigate = useNavigate();

  const { accessToken, isInitialized, shouldLogout } = useAuth();

  useEffect(() => {
    // Handle logout
    if (shouldLogout) {
      navigate("/", { replace: true });
      return;
    }

    // Wait for initialization to complete before checking auth
    if (isInitialized && !accessToken) {
      navigate("/", { replace: true });
    }
  }, [accessToken, isInitialized, shouldLogout, navigate]);

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Initializing...</div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!accessToken) {
    return null;
  }

  return <>{children}</>;
}
