import React, { useState, useCallback, useEffect, ReactNode, createContext, useContext } from "react";
import axiosInstance, { setAccessTokenForApi } from "@/utils/api";
import { useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { ApiResponse } from "@/types/api-response";
import type { UserDto } from "@repo/db/dtos/user";
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
  const location = useLocation();

  // Modal state for auth-related messages
  const [authDialog, setAuthDialog] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: "",
    message: "",
  });

  // Refresh in-flight lock + subscribers (avoid multiple parallel refresh calls)
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshSubscribers = React.useRef<((token: string | null) => void)[]>([]);
  const subscribeTokenRefresh = (cb: (token: string | null) => void) => {
    refreshSubscribers.current.push(cb);
  };
  const onRrefreshed = (token: string | null) => {
    refreshSubscribers.current.forEach((cb) => cb(token));
    refreshSubscribers.current = [];
  };

  const login = (accessToken: string, userData: UserDto) => {
    // Allow only ADMIN or STAFF
    if (userData?.type !== "ADMIN" && userData?.type !== "STAFF") {
      // immediate logout and redirect
      logout();
      setAuthDialog({
        open: true,
        title: "Access restricted",
        message: "Only ADMIN or STAFF can use the Admin Console.",
      });
      return;
    }
    setAccessToken(accessToken);
    setAccessTokenForApi(accessToken);
    setUser(userData);
  };

  useEffect(() => {
    setTimeout(() => {
      setDisplayFlag(true);
    }, 2000);
  });

  const logout = useCallback(() => {
    setAccessToken(null);
    setAccessTokenForApi(null);
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
      const nextUser = response.data.payload.user;
      if (nextUser?.type !== "ADMIN" && nextUser?.type !== "STAFF") {
        throw new Error("ACCESS_RESTRICTED");
      }
      setAccessToken(response.data.payload.accessToken);
      setAccessTokenForApi(response.data.payload.accessToken);
      setUser(nextUser);

      return response.data.payload.accessToken;
    } catch (error) {
      const isAccessRestricted = error instanceof Error && error.message === "ACCESS_RESTRICTED";
      if (!isAccessRestricted) {
        console.error("Failed to generate new token:", error);
      }
      if (window.location.pathname !== "/") {
        // immediate logout and redirect to root
        logout();
        setAuthDialog({
          open: true,
          title: isAccessRestricted ? "Access restricted" : "Session expired",
          message: isAccessRestricted
            ? "Only ADMIN or STAFF can use the Admin Console. Please login with an authorized account."
            : "Session expired or failed to authenticate. Please log in again.",
        });
      }
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
          if (isRefreshing) {
            // Wait for the refresh to finish
            return new Promise((resolve) => {
              subscribeTokenRefresh((token) => {
                if (token) originalRequest.headers["Authorization"] = `Bearer ${token}`;
                resolve(axiosInstance(originalRequest));
              });
            });
          }
          setIsRefreshing(true);
          const newAccessToken = await generateNewToken();
          setIsRefreshing(false);
          onRrefreshed(newAccessToken);
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

  // Proactively resync token on route changes or tab focus to catch cross-tab logins
  const lastSyncRef = React.useRef<number>(0);
  useEffect(() => {
    const trySync = async () => {
      const now = Date.now();
      if (now - lastSyncRef.current < 1000) return; // throttle
      lastSyncRef.current = now;
      const onProtected = /dashboard|home|console/i.test(location.pathname);
      if (onProtected) {
        await generateNewToken();
      }
    };
    const onFocus = () => void trySync();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void trySync();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    void trySync();
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [location.pathname, generateNewToken]);

  const protectedPath = /dashboard|home|console/i.test(window.location.pathname);
  // If on a protected path, defer rendering children until token is present
  if (protectedPath && (!accessToken || !interceptorsReady)) {
    return null;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <Dialog open={authDialog.open} onOpenChange={(open) => setAuthDialog((p) => ({ ...p, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{authDialog.title}</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-slate-600">{authDialog.message}</div>
          <DialogFooter>
            <Button onClick={() => setAuthDialog((p) => ({ ...p, open: false }))}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthContext.Provider>
  );
};
