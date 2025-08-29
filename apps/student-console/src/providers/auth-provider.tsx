"use client";

import React, { useState, useCallback, useEffect, ReactNode, createContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UserDto } from "@repo/db/dtos/user";
import { ApiResponse } from "@repo/utils/ApiResonse";
import { axiosInstance } from "@/lib/utils";

export interface AuthContextType {
  user: UserDto | null;
  login: (accessToken: string, userData: UserDto) => void;
  logout: () => void;
  accessToken: string | null;
  displayFlag: boolean;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [displayFlag, setDisplayFlag] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const isProtectedRoute = pathname && (pathname.startsWith("/dashboard") || pathname.startsWith("/settings"));

  const login = (accessToken: string, userData: UserDto) => {
    console.log("🔑 Login called");
    setAccessToken(accessToken);
    setUser(userData);
    setIsLoading(false);
  };

  const logout = useCallback(async () => {
    console.log("🚪 Logout called");
    try {
      if (isProtectedRoute) {
        await axiosInstance.get("/auth/logout");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setAccessToken(null);
      setUser(null);
      setIsLoading(false);
      router.push("/");
    }
  }, [router, isProtectedRoute]);

  const generateNewToken = useCallback(async (): Promise<boolean> => {
    console.log("🔄 Attempting token refresh...");

    try {
      const response = await axiosInstance.get<ApiResponse>("/auth/refresh", { withCredentials: true });

      if (response.data?.payload) {
        const payload = response.data.payload as { accessToken: string; user: UserDto };
        console.log("✅ Token refresh successful");
        setAccessToken(payload.accessToken);
        setUser(payload.user);
        return true;
      }

      console.log("❌ No valid payload in refresh response");
      return false;
    } catch (error) {
      console.log("❌ Token refresh failed:", error);
      return false;
    }
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    if (isInitialized) return;

    const initAuth = async () => {
      console.log("🚀 Initializing auth...", { isProtectedRoute });

      if (isProtectedRoute) {
        console.log("🔑 Protected route, checking auth...");
        const success = await generateNewToken();
        if (!success) {
          console.log("❌ Auth failed, redirecting to login");
          router.push("/login");
        }
      } else {
        console.log("🌐 Public route, skipping auth check");
      }

      setIsLoading(false);
      setIsInitialized(true);
    };

    initAuth();
  }, [isProtectedRoute, generateNewToken, router, isInitialized]);

  // Set up axios interceptors
  useEffect(() => {
    const requestInterceptor = axiosInstance.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers["Authorization"] = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    const responseInterceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry && isProtectedRoute) {
          originalRequest._retry = true;
          console.log("🔄 401 error, attempting token refresh...");
          const success = await generateNewToken();
          if (success && accessToken) {
            originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
            return axiosInstance(originalRequest);
          } else {
            logout();
          }
        }
        return Promise.reject(error);
      },
    );

    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
      axiosInstance.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken, generateNewToken, logout, isProtectedRoute]);

  // Display flag timer
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDisplayFlag(true);
    }, 2000);
    return () => clearTimeout(timeout);
  }, []);

  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    accessToken,
    displayFlag,
    isLoading,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
