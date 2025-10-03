import { useAuth } from "@/features/auth/hooks/use-auth";
import React from "react";

type ProtectedRouteWrapperProps = {
  children: React.ReactNode;
};

export default function ProtectedRouteWrapper({ children }: ProtectedRouteWrapperProps) {
  const { accessToken, user, logout } = useAuth();

  if (!accessToken) return null;
  if (user?.type !== "ADMIN" && user?.type !== "STAFF") {
    // Hard redirect to root instantly to avoid blank protected shell
    logout();
    window.location.replace("/");
    return null;
  }
  return children;
}
