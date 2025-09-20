import React, { useState, useCallback, useEffect, ReactNode, createContext, useContext } from "react";
import axiosInstance from "@/utils/api";

import { ApiResonse } from "@/types/api-response";
import { UserDto } from "@repo/db/dtos/user";
export interface AuthContextType {
  user: UserDto | null;
  login: (accessToken: string, userData: UserDto) => void;
  logout: () => void;
  accessToken: string | null;
  displayFlag: boolean;
  isInitialized: boolean;
  shouldLogout: boolean;
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
  const [isInitialized, setIsInitialized] = useState(false);
  const [shouldLogout, setShouldLogout] = useState(false);

  const login = (accessToken: string, userData: UserDto) => {
    setAccessToken(accessToken);
    setUser(userData);
  };

  useEffect(() => {
    setTimeout(() => {
      setDisplayFlag(true);
    }, 2000);
  });

  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setShouldLogout(true);
    // Reset the logout flag after a short delay
    setTimeout(() => setShouldLogout(false), 100);
  }, []);

  const generateNewToken = useCallback(async (): Promise<string | null> => {
    // Don't make API call if we're on the login page
    if (window.location.pathname === "/") {
      return null;
    }

    try {
      const response = await axiosInstance.get<ApiResonse<{ accessToken: string; user: UserDto }>>(
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

  // Initialize auth state on app start
  useEffect(() => {
    const initializeAuth = async () => {
      // Only try to refresh token if we're not on login page
      if (window.location.pathname !== "/") {
        console.log("Initializing auth - checking for existing session...");
        try {
          await generateNewToken();
        } catch {
          console.log("No existing session found");
        }
      }
      setIsInitialized(true);
    };

    initializeAuth();
  }, [generateNewToken]);

  // Set up axios interceptors once on mount
  useEffect(() => {
    const requestInterceptor = axiosInstance.interceptors.request.use(
      (config) => {
        // Use a ref or get the token dynamically to avoid stale closure
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

    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
      axiosInstance.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken, generateNewToken]); // Include dependencies to get fresh values

  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    accessToken,
    displayFlag,
    isInitialized,
    shouldLogout,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
