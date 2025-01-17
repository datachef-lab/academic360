import { useAuth } from "@/hooks/useAuth";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

type ProtectedRouteWrapperProps = {
  children: React.ReactNode;
};

export default function ProtectedRouteWrapper({ children }: ProtectedRouteWrapperProps) {
  const navigate = useNavigate();

  const { accessToken } = useAuth();

  useEffect(() => {
    if (!accessToken) {
      navigate("/login", { replace: true });
    }
  }, [accessToken, navigate]);

  return children;
}
