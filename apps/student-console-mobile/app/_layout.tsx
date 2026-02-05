import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SidebarContent } from "@/features/sidebar";
import { useTheme } from "@/hooks/use-theme";
import { AuthProvider, useAuth } from "@/providers/auth-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import Drawer from "expo-router/drawer";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";
import React, { useLayoutEffect } from "react";
import { InteractionManager, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
// import AsyncStorage from '@react-native-async-storage/async-storage';
import "../global.css";

export default function RootLayout() {
  // AsyncStorage.clear();

  // Log startup info for debugging (always log in production too for debugging)
  console.log("[RootLayout] App starting...");
  try {
    const { API_BASE_URL } = require("@/lib/api");
    console.log("[RootLayout] API_BASE_URL:", API_BASE_URL);
  } catch (e) {
    console.error("[RootLayout] Failed to load API config:", e);
  }

  // Global error handler for uncaught errors (web only)
  React.useEffect(() => {
    // Only set up web error handlers - React Native has its own error handling
    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
      const errorHandler = (error: ErrorEvent) => {
        console.error("[RootLayout] Uncaught error:", error.error);
      };

      const rejectionHandler = (event: PromiseRejectionEvent) => {
        console.error("[RootLayout] Unhandled promise rejection:", event.reason);
      };

      window.addEventListener("error", errorHandler);
      window.addEventListener("unhandledrejection", rejectionHandler);

      return () => {
        window.removeEventListener("error", errorHandler);
        window.removeEventListener("unhandledrejection", rejectionHandler);
      };
    }
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView className="flex-1">
        <AuthProvider>
          <ThemeProvider>
            <AuthReadyWrapper>
              <CustomDrawerNavigation />
            </AuthReadyWrapper>
          </ThemeProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

// Wrapper to ensure auth is ready before rendering navigation
function AuthReadyWrapper({ children }: { children: React.ReactNode }) {
  const { isReady } = useAuth();

  React.useEffect(() => {
    console.log("[AuthReadyWrapper] isReady:", isReady);
  }, [isReady]);

  // Show nothing while auth initializes to prevent crashes
  if (!isReady) {
    return null;
  }

  try {
    return <>{children}</>;
  } catch (error) {
    console.error("[AuthReadyWrapper] Error rendering children:", error);
    return null;
  }
}

function CustomDrawerNavigation() {
  const { theme, colorScheme } = useTheme();

  // Log when drawer navigation renders
  React.useEffect(() => {
    console.log("[CustomDrawerNavigation] Rendering...");
  }, []);

  // Force status bar style when theme changes - dark icons on light bg, light icons on dark bg
  const isLightTheme =
    colorScheme === "light" ||
    theme.background === "white" ||
    theme.background === "#fff" ||
    theme.background === "#ffffff";
  const statusBarStyle = isLightTheme ? "dark" : "light";

  useLayoutEffect(() => {
    setStatusBarStyle(statusBarStyle, false);
    // Android with edge-to-edge can have timing issues; re-apply after interactions
    if (Platform.OS === "android") {
      const id = InteractionManager.runAfterInteractions(() => {
        setStatusBarStyle(statusBarStyle, false);
      });
      return () => id.cancel();
    }
  }, [statusBarStyle]);

  try {
    return (
      <>
        <StatusBar key={statusBarStyle} style={statusBarStyle} backgroundColor={theme.background} translucent={false} />
        <GestureHandlerRootView className="flex-1">
          <Drawer
            screenOptions={{
              headerShown: false,
              drawerStyle: {
                backgroundColor: theme.background,
              },
              drawerActiveTintColor: colorScheme == "dark" ? "white" : "#007aff",
            }}
            drawerContent={SidebarContent}
          >
            {/* Expo Router automatically handles routes - no need to declare them explicitly */}
          </Drawer>
        </GestureHandlerRootView>
      </>
    );
  } catch (error) {
    console.error("[CustomDrawerNavigation] Error rendering:", error);
    // Fallback: render a simple view to prevent crash
    return (
      <GestureHandlerRootView className="flex-1" style={{ backgroundColor: theme.background }}>
        {/* Error fallback - app will still work */}
      </GestureHandlerRootView>
    );
  }
}
