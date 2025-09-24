import React, { useState, useCallback, useEffect, ReactNode, createContext, useContext } from "react";
import axiosInstance from "@/utils/api";
import { useNavigate } from "react-router-dom";

import { ApiResponse } from "@/types/api-response";
import { UserDto } from "@repo/db/dtos/user";
export interface AuthContextType {
  user: UserDto | null;
  login: (accessToken: string, userData: UserDto) => void;
  logout: () => void;
  accessToken: string | null;
  displayFlag: boolean;
  isReady: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [displayFlag, setDisplayFlag] = useState(false);

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserDto | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [interceptorsReady, setInterceptorsReady] = useState(false);
  const navigate = useNavigate();

  const login = (accessToken: string, userData: UserDto) => {
    setAccessToken(accessToken);
    setUser(userData);
  };

  useEffect(() => {
    setDisplayFlag(true);
  }, []); // Empty dependency array to run only once

  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    navigate("/");
  }, [navigate]);

  const generateNewToken = useCallback(async (): Promise<string | null> => {
    // Don't make API call if we're on the login page
    if (window.location.pathname === "/") {
      return null;
    }

    try {
      const response = await axiosInstance.get<ApiResponse<{ accessToken: string; user: UserDto }>>(
        "/auth/refresh",
        { withCredentials: true }, // Include cookies in the request
      );
      console.log("response:", response);
      setAccessToken(response.data.payload.accessToken);
      setUser(response.data.payload.user);

      return response.data.payload.accessToken;
    } catch (error) {
      console.error("Failed to generate new token:", error);
      // Only show alert if we're not on the login page
      if (window.location.pathname !== "/") {
        alert("Session expired or failed to authenticate. Please log in again.");
      }
      logout();
      return null;
    }
  }, [logout]);

  useEffect(() => {
    let cancelled = false;
    const waitForAuthReady = (): Promise<void> =>
      new Promise((resolve) => {
        if (isReady) return resolve();
        const startedAt = Date.now();
        const timer = setInterval(() => {
          if (isReady || Date.now() - startedAt > 5000) {
            clearInterval(timer);
            resolve();
          }
        }, 25);
      });
    const bootstrap = async () => {
      try {
        if (accessToken === null && window.location.pathname !== "/") {
          console.log("generating accessToken...!");
          await generateNewToken();
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    };
    void bootstrap();

    const requestInterceptor = axiosInstance.interceptors.request.use(
      async (config) => {
        // If auth not ready yet on initial mount, wait briefly to avoid 401s
        if (!isReady && window.location.pathname !== "/") {
          await waitForAuthReady();
        }
        if (!accessToken && window.location.pathname !== "/") {
          // As a fallback, try to refresh once here if still no token
          const newToken = await generateNewToken();
          if (newToken) {
            config.headers["Authorization"] = `Bearer ${newToken}`;
            return config;
          }
        }
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
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const newAccessToken = await generateNewToken();
          if (newAccessToken) {
            originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
            return axiosInstance(originalRequest);
          }
        }
        return Promise.reject(error);
      },
    );

    setInterceptorsReady(true);

    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
      axiosInstance.interceptors.response.eject(responseInterceptor);
      cancelled = true;
    };
  }, [accessToken, generateNewToken, logout, user]);

  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    accessToken,
    displayFlag,
    isReady,
  };

  const protectedPath = /dashboard|home|console/i.test(window.location.pathname);
  // If on a protected path, defer rendering children until token is present
  if (protectedPath && (!accessToken || !interceptorsReady)) {
    return null;
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
