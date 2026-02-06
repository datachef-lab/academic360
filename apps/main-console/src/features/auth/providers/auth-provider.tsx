import React, { useState, useCallback, useEffect, ReactNode, createContext, useContext } from "react";
import axiosInstance, { setAccessTokenForApi } from "@/utils/api";
import { useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiResponse } from "@/types/api-response";
import type { UserDto } from "@repo/db/dtos/user";

// Query keys for React Query
const AUTH_QUERY_KEY = ["auth", "token"] as const;
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

// Auth state type
interface AuthState {
  accessToken: string;
  user: UserDto;
}

// Token validation function
const validateTokenFn = async (): Promise<AuthState | null> => {
  try {
    const response = await axiosInstance.get<ApiResponse<{ accessToken: string; user: UserDto }>>("/auth/refresh", {
      withCredentials: true,
      // Mark this as a silent auth check to suppress console errors
      _silentAuthCheck: true,
    } as any);

    const nextUser = response.data.payload.user;
    if (nextUser?.type !== "ADMIN" && nextUser?.type !== "STAFF") {
      throw new Error("ACCESS_RESTRICTED");
    }

    return {
      accessToken: response.data.payload.accessToken,
      user: nextUser,
    };
  } catch (error: any) {
    // Handle 401 (no token) and 403 (invalid token) gracefully
    // These are expected when user is not logged in
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      // Suppress console error for expected 401/403 during auth check
      if (error?.config?._silentAuthCheck) {
        // Clear the error from console by preventing default logging
        error._suppressLog = true;
      }
      return null;
    }
    // Re-throw other errors (like ACCESS_RESTRICTED)
    throw error;
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [displayFlag, setDisplayFlag] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  // Modal state for auth-related messages
  const [authDialog, setAuthDialog] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: "",
    message: "",
  });

  // Track if we've done initial auth check to prevent multiple simultaneous requests
  const hasInitialCheckRef = React.useRef(false);
  const isRefetchingRef = React.useRef(false);
  const isLoggingOutRef = React.useRef(false);

  // React Query for token validation - runs on mount and when needed
  const {
    data: authData,
    isLoading: isAuthLoading,
    isFetching: isAuthFetching,
    isError: isAuthError,
    error: authError,
    refetch: refetchAuth,
  } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: validateTokenFn,
    retry: false,
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
    cacheTime: 15 * 60 * 1000, // Keep in cache for 15 minutes (v4 syntax)
    refetchOnWindowFocus: false, // Disable automatic refetch on focus to prevent spam
    refetchOnMount: !hasInitialCheckRef.current, // Only refetch on first mount
    refetchOnReconnect: false, // Disable refetch on reconnect
    // 401/403 errors are handled in queryFn and return null, so they won't trigger isError
    // Only ACCESS_RESTRICTED and other errors will trigger isError
  });

  // Track initial check completion
  useEffect(() => {
    if (!isAuthLoading && !hasInitialCheckRef.current) {
      hasInitialCheckRef.current = true;
    }
  }, [isAuthLoading]);

  // Extract auth state from query data
  const accessToken = authData?.accessToken ?? null;
  const user = authData?.user ?? null;

  // Update axios instance when token changes
  useEffect(() => {
    if (accessToken) {
      setAccessTokenForApi(accessToken);
    } else {
      setAccessTokenForApi(null);
    }
  }, [accessToken]);

  // Define logout first (used in login callback)
  const logout = useCallback(() => {
    // Set logout flag to prevent redirects and refetches
    isLoggingOutRef.current = true;

    // Cancel any ongoing queries first to prevent refetch
    queryClient.cancelQueries({ queryKey: AUTH_QUERY_KEY });

    // Set auth state to null immediately (logged out state)
    // This keeps the query in cache but marks user as logged out
    queryClient.setQueryData(AUTH_QUERY_KEY, null);
    setAccessTokenForApi(null);

    // Redirect immediately - no delay
    navigate("/", { replace: true });

    // Reset flag quickly to allow normal flow
    setTimeout(() => {
      isLoggingOutRef.current = false;
    }, 50);

    // Call logout API in the background (fire and forget)
    // Don't wait for it to complete - logout should feel instant
    axiosInstance.get("/auth/logout", { withCredentials: true }).catch((error) => {
      // Silently handle errors - user is already logged out locally
      console.error("Background logout API call failed:", error);
    });
  }, [queryClient, navigate]);

  const login = useCallback(
    (accessToken: string, userData: UserDto) => {
      // Allow only ADMIN or STAFF
      if (userData?.type !== "ADMIN" && userData?.type !== "STAFF") {
        // Clear auth state and show error
        queryClient.setQueryData(AUTH_QUERY_KEY, null);
        setAuthDialog({
          open: true,
          title: "Access restricted",
          message: "Only ADMIN or STAFF can use the Admin Console.",
        });
        navigate("/", { replace: true });
        return;
      }
      // Update React Query cache with new auth data
      queryClient.setQueryData<AuthState>(AUTH_QUERY_KEY, {
        accessToken,
        user: userData,
      });
      setAccessTokenForApi(accessToken);
    },
    [queryClient, navigate],
  );

  useEffect(() => {
    setTimeout(() => {
      setDisplayFlag(true);
    }, 2000);
  });

  // Handle auth errors (only non-401/403 errors like ACCESS_RESTRICTED)
  useEffect(() => {
    if (isAuthError && authError) {
      const isAccessRestricted = authError instanceof Error && authError.message === "ACCESS_RESTRICTED";

      // Clear auth state on error
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      setAccessTokenForApi(null);

      const isLoginPage = location.pathname === "/" || location.pathname === "";
      const isResetPasswordPage = location.pathname === "/reset-password";

      if (!isLoginPage && !isResetPasswordPage) {
        navigate("/", { replace: true });
        setAuthDialog({
          open: true,
          title: isAccessRestricted ? "Access restricted" : "Session expired",
          message: isAccessRestricted
            ? "Only ADMIN or STAFF can use the Admin Console. Please login with an authorized account."
            : "Session expired or failed to authenticate. Please log in again.",
        });
      }
    }
  }, [isAuthError, authError, queryClient, navigate, location.pathname]);

  // Handle route-based redirects based on auth state
  useEffect(() => {
    // Don't redirect if we're in the middle of logging out
    if (isLoggingOutRef.current) return;

    // Wait for initial auth check to complete
    if (isAuthLoading) return;

    const isLoginPage = location.pathname === "/" || location.pathname === "";
    const isResetPasswordPage = location.pathname === "/reset-password";
    const isProtectedRoute = !isLoginPage && !isResetPasswordPage;

    // If authenticated and on login page, redirect to dashboard
    // Add a small delay so the loading animation on the login page is visible
    if (accessToken && user && isLoginPage && !isLoggingOutRef.current) {
      const timer = setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 800); // 800ms delay for clearer animation visibility

      return () => clearTimeout(timer);
    }

    // If not authenticated and on protected route, redirect to login immediately
    if (!accessToken && !isAuthLoading && isProtectedRoute) {
      navigate("/", { replace: true });
      return;
    }
  }, [accessToken, user, location.pathname, navigate, isAuthLoading]);

  // Set up axios interceptors for token attachment and refresh
  useEffect(() => {
    if (isAuthLoading) return; // Wait for initial auth check

    const requestInterceptor = axiosInstance.interceptors.request.use(
      async (config) => {
        // Attach token if available
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

        // Handle 401 errors by refreshing token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Don't retry refresh if we're on login page
          if (window.location.pathname === "/" || window.location.pathname === "/reset-password") {
            return Promise.reject(error);
          }

          // Prevent concurrent refresh attempts
          if (isRefetchingRef.current) {
            return Promise.reject(error);
          }

          try {
            isRefetchingRef.current = true;
            // Refetch auth token using React Query
            const { data: newAuthData } = await refetchAuth();

            if (newAuthData?.accessToken) {
              originalRequest.headers["Authorization"] = `Bearer ${newAuthData.accessToken}`;
              return axiosInstance(originalRequest);
            } else {
              // Refresh returned null (no valid token), clear auth state
              queryClient.setQueryData(AUTH_QUERY_KEY, null);
              setAccessTokenForApi(null);
            }
          } catch (refreshError) {
            // Refresh failed with an error, clear auth state
            queryClient.setQueryData(AUTH_QUERY_KEY, null);
            setAccessTokenForApi(null);
          } finally {
            isRefetchingRef.current = false;
          }
        }

        return Promise.reject(error);
      },
    );

    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
      axiosInstance.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken, isAuthLoading, refetchAuth, queryClient]);

  // Memoize context value to prevent unnecessary re-renders
  // Ensure contextValue is always defined and stable
  const contextValue: AuthContextType = React.useMemo(
    () => ({
      user: user ?? null,
      login,
      logout,
      accessToken: accessToken ?? null,
      displayFlag,
      isReady: !isAuthLoading,
    }),
    [user, login, logout, accessToken, displayFlag, isAuthLoading],
  );

  // Always render the provider - never return null for login page
  // This ensures the context is always available

  // Proactively refetch token on route changes or tab focus to catch cross-tab logins
  // But only if we have a token (user is logged in) and not already fetching
  const lastSyncRef = React.useRef<number>(0);
  useEffect(() => {
    const trySync = () => {
      // Prevent concurrent refetches
      if (isAuthFetching || isRefetchingRef.current) return;

      const now = Date.now();
      if (now - lastSyncRef.current < 5000) return; // Increase throttle to 5 seconds
      lastSyncRef.current = now;

      const onProtected = /dashboard|home|console/i.test(location.pathname);
      // Only refetch if we're on protected route AND we have a token (logged in)
      // Don't refetch if we're not logged in (no token) - that's expected
      if (onProtected && !isAuthLoading && !isAuthFetching && accessToken) {
        isRefetchingRef.current = true;
        refetchAuth().finally(() => {
          isRefetchingRef.current = false;
        });
      }
    };

    // Only set up listeners if we're logged in
    if (!accessToken) {
      return;
    }

    const onFocus = () => {
      // Only refetch on focus if enough time has passed
      const now = Date.now();
      if (now - lastSyncRef.current < 30000) return; // 30 second throttle for focus
      void trySync();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        // Only refetch if enough time has passed
        const now = Date.now();
        if (now - lastSyncRef.current < 30000) return; // 30 second throttle
        void trySync();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [location.pathname, refetchAuth, isAuthLoading, isAuthFetching, accessToken]);

  const isLoginPage = location.pathname === "/" || location.pathname === "";
  const isResetPasswordPage = location.pathname === "/reset-password";
  const protectedPath = !isLoginPage && !isResetPasswordPage;

  // Always render the AuthContext.Provider so hooks can access it
  // Show loading state while checking initial auth
  if (isAuthLoading) {
    // On login page, show it immediately (will redirect if authenticated)
    if (isLoginPage) {
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
    }
    // On protected paths, wait for auth check but still provide context
    // This ensures hooks like useAuth can be called even during loading
    if (protectedPath) {
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
    }
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
