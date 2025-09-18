import { useAuth } from "@/features/auth/hooks/use-auth";
import React from "react";

type ProtectedRouteWrapperProps = {
  children: React.ReactNode;
};

export default function ProtectedRouteWrapper({ children }: ProtectedRouteWrapperProps) {
  const { accessToken } = useAuth();

  return accessToken && children;
}
