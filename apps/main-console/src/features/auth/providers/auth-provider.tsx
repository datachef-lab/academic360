import React, { useState, useCallback, useEffect, ReactNode, createContext, useContext } from "react";
import axiosInstance from "@/utils/api";
import { useNavigate } from "react-router-dom";

import { ApiResonse } from "@/types/api-response";
import { UserDto } from "@repo/db/dtos/user";
export interface AuthContextType {
  user: UserDto | null;
  login: (accessToken: string, userData: UserDto) => void;
  logout: () => void;
  accessToken: string | null;
  displayFlag: boolean;
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
  const navigate = useNavigate();

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
    navigate("/");
  }, [navigate]);

  const generateNewToken = useCallback(async (): Promise<string | null> => {
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
      alert("Session expired or failed to authenticate. Please log in again.");
      logout();
      return null;
    }
  }, [logout]);

  useEffect(() => {
    if (accessToken === null) {
      console.log("generating accessToken...!");
      generateNewToken();
    }

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
  }, [accessToken, generateNewToken, logout, user]);

  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    accessToken,
    displayFlag,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {user != null && accessToken != null && displayFlag && children}
    </AuthContext.Provider>
  );
};
