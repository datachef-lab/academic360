import axiosInstance, { setAccessTokenForApi } from "@/lib/api";
import type { ApiResponse } from "@/lib/auth-service";
import { deleteRefreshToken, getRefreshToken, setRefreshToken } from "@/lib/secure-storage";
import type { UserDto } from "@repo/db/dtos/user";
import { router } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

export interface AuthContextType {
  user: UserDto | null;
  login: (accessToken: string, userData: UserDto, refreshToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  tryRefresh: () => Promise<{ token: string | null; user: UserDto | null }>;
  accessToken: string | null;
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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserDto | null>(null);
  const [isReady, setIsReady] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshSubscribers = React.useRef<((token: string | null) => void)[]>([]);
  const subscribeTokenRefresh = (cb: (token: string | null) => void) => {
    refreshSubscribers.current.push(cb);
  };
  const onRefreshed = (token: string | null) => {
    refreshSubscribers.current.forEach((cb) => cb(token));
    refreshSubscribers.current = [];
  };

  const login = useCallback(async (newAccessToken: string, userData: UserDto, refreshToken?: string) => {
    if (userData?.type !== "STUDENT") {
      return;
    }
    setAccessToken(newAccessToken);
    setAccessTokenForApi(newAccessToken);
    setUser(userData);
    // Store on all platforms - web needs it for cross-origin (cookies don't work)
    if (refreshToken) {
      await setRefreshToken(refreshToken);
    }
  }, []);

  const logout = useCallback(async () => {
    setAccessToken(null);
    setAccessTokenForApi(null);
    setUser(null);
    await deleteRefreshToken();
    try {
      await axiosInstance.get("/auth/logout", { withCredentials: true });
    } catch {
      // Ignore logout API errors
    }
    router.replace("/(auth)/login");
  }, []);

  const generateNewToken = useCallback(
    async (options?: { onFailureRedirect?: boolean }): Promise<{ token: string | null; user: UserDto | null }> => {
      const shouldRedirect = options?.onFailureRedirect ?? true;
      try {
        // Prefer stored token (header) when available - works for both web (cross-origin)
        // and native. Cookies don't work cross-origin (e.g. localhost:8081 -> 192.168.x.x:8080).
        const storedRefresh = await getRefreshToken();
        if (__DEV__) {
          console.log(`[Auth] refresh check: platform=${Platform.OS} hasStoredToken=${!!storedRefresh}`);
        }
        if (storedRefresh) {
          if (__DEV__) console.log("[Auth] initiating /auth/refresh request");
          const response = await axiosInstance.get<ApiResponse<{ accessToken: string; user: UserDto }>>(
            "/auth/refresh",
            {
              headers: { "X-Refresh-Token": storedRefresh },
            },
          );
          const payload = response.data.payload;
          if (payload.user?.type === "STUDENT") {
            setAccessToken(payload.accessToken);
            setAccessTokenForApi(payload.accessToken);
            setUser(payload.user);
            return { token: payload.accessToken, user: payload.user };
          }
          return { token: null, user: null };
        }

        // Fallback: cookies (only works same-origin on web)
        if (isWeb) {
          const response = await axiosInstance.get<ApiResponse<{ accessToken: string; user: UserDto }>>(
            "/auth/refresh",
            { withCredentials: true },
          );
          const payload = response.data.payload;
          if (payload.user?.type === "STUDENT") {
            setAccessToken(payload.accessToken);
            setAccessTokenForApi(payload.accessToken);
            setUser(payload.user);
            return { token: payload.accessToken, user: payload.user };
          }
        }
        return { token: null, user: null };
      } catch (error) {
        console.error("Token refresh failed:", error);
        if (shouldRedirect) await logout();
        return { token: null, user: null };
      }
    },
    [logout],
  );

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        // Try refresh (stored token or cookies). Don't redirect on failure.
        const tokenResult = await generateNewToken({ onFailureRedirect: false });

        // If token refresh was successful and user is a STUDENT, navigate to console
        if (tokenResult.token && tokenResult.user?.type === "STUDENT" && !cancelled) {
          // Small delay to ensure state is updated and navigation happens smoothly
          setTimeout(() => {
            if (!cancelled) {
              router.push("/console");
            }
          }, 100);
        }
      } catch {
        // Ignore bootstrap errors
      } finally {
        if (!cancelled) setIsReady(true);
      }
    };
    void bootstrap();

    const requestInterceptor = axiosInstance.interceptors.request.use(
      async (config) => {
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
        // Don't retry refresh endpoint - avoid loop when refresh fails
        const isRefreshRequest = originalRequest?.url?.includes("/auth/refresh");
        if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest) {
          originalRequest._retry = true;
          if (isRefreshing) {
            return new Promise((resolve) => {
              subscribeTokenRefresh((token) => {
                if (token) {
                  originalRequest.headers["Authorization"] = `Bearer ${token}`;
                }
                resolve(axiosInstance(originalRequest));
              });
            });
          }
          setIsRefreshing(true);
          const tokenResult = await generateNewToken();
          setIsRefreshing(false);
          onRefreshed(tokenResult.token);
          if (tokenResult.token) {
            originalRequest.headers["Authorization"] = `Bearer ${tokenResult.token}`;
            return axiosInstance(originalRequest);
          }
        }
        return Promise.reject(error);
      },
    );

    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
      axiosInstance.interceptors.response.eject(responseInterceptor);
      cancelled = true;
    };
  }, [accessToken, generateNewToken, isRefreshing]);

  const tryRefresh = useCallback(async () => {
    return generateNewToken({ onFailureRedirect: false });
  }, [generateNewToken]);

  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    tryRefresh,
    accessToken,
    isReady,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
