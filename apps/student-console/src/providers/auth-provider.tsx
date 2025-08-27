"use client"; // Ensures this runs only on the client side

import React, {
  useState,
  useCallback,
  useEffect,
  ReactNode,
  createContext,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import { Student } from "@/types/academics/student";
import { StudentAccessControl } from "@/types/academics/access-control";

const axiosInstance = axios.create({
  baseURL: "", // Use relative URLs
  withCredentials: true, // ✅ Ensures cookies are sent with requests
  headers: {
    "Content-Type": "application/json",
  },
});

export interface AuthContextType {
  user: Student | null;
  login: (
    accessToken: string,
    userData: Student,
  ) => void;
  logout: () => void;
  accessToken: string | null;
  displayFlag: boolean;

  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [displayFlag, setDisplayFlag] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  const [user, setUser] = useState<Student | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname(); // Get the current route

  const isProtectedRoute =
    pathname &&
    (pathname.startsWith("/dashboard") || pathname.startsWith("/settings"));

  const login = (
    accessToken: string,
    userData: Student,

  ) => {
    console.log("Login function called, setting access token");
    setAccessToken(accessToken);
    
    setUser(userData);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDisplayFlag(true);
    }, 2000);
    return () => clearTimeout(timeout);
  }, []);

  const logout = useCallback(async () => {
    if (
      pathname &&
      (pathname.startsWith("/dashboard") || pathname.startsWith("/settings"))
    ) {
      try {
        await axiosInstance.post("/api/auth/logout");
        setAccessToken(null);
        setUser(null);
        router.push("/");
      } catch (error) {
        console.error("Error during logout:", error);
        setAccessToken(null);
        setUser(null);
        router.push("/");
      }
    }
  }, [router, pathname]);

  

  const generateNewToken = useCallback(async (): Promise<string | null> => {
    if (!isProtectedRoute) return null; // ✅ Skip request if not on protected route

    try {
      const response = await axiosInstance.get<{
        accessToken: string;
        user: Student;
        accessControl: StudentAccessControl;
      }>("/api/auth/refresh", { withCredentials: true });

      console.log("Token refresh response received");

      if (response.data && response.data.accessToken) {
        console.log("Setting refreshed access token");
        setAccessToken(response.data.accessToken);
        setUser(response.data.user);

        return response.data.accessToken;
      }
      return null;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      logout();
      return null;
    }
  }, [logout, isProtectedRoute]);

  useEffect(() => {
    let triedRefresh = false;
    const checkSession = async () => {
      try {
        console.log("Checking existing session...");
        const response = await axiosInstance.get<{
          accessToken: string;
          user: Student;
        }>("/api/auth/me", { withCredentials: true });

        console.log("Session check response received");

        if (response.data && response.data.accessToken) {
          setAccessToken(response.data.accessToken);
          if (response.data.user) {
            setUser({
              ...response.data.user,
              codeNumber: response.data.user.codeNumber,
            });
          }
        }
      } catch (error) {
        console.log(
          "No existing session found, will try to refresh token,",
          error
        );
        if (!triedRefresh) {
          triedRefresh = true;
          await generateNewToken();
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
    // Only run on mount and route change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generateNewToken, isProtectedRoute]);

  useEffect(() => {
    if (!isProtectedRoute) return; // ✅ Skip request if not on protected route

    if (accessToken === null && !isLoading) {
      console.log("Generating accessToken...");
      generateNewToken();
    }

    const requestInterceptor = axiosInstance.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers["Authorization"] = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const newAccessToken = await generateNewToken();
          if (newAccessToken) {
            originalRequest.headers[
              "Authorization"
            ] = `Bearer ${newAccessToken}`;
            return axiosInstance(originalRequest);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
      axiosInstance.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken, generateNewToken, logout, isLoading, isProtectedRoute]);

  const contextValue: AuthContextType = {
    user,
    login,

    logout,
    accessToken,
    displayFlag,
    isLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
