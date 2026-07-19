import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SidebarContent } from "@/features/sidebar";
import { useTheme } from "@/hooks/use-theme";
import { AuthProvider, useAuth } from "@/providers/auth-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import Drawer from "expo-router/drawer";
import { StatusBar } from "expo-status-bar";
import React from "react";
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

  React.useEffect(() => {
    console.log("[CustomDrawerNavigation] Rendering...");
  }, []);

  // Theme-driven default only. Screens with a fixed background that doesn't
  // follow the theme (onboarding is always white; login has its own indigo
  // gradient) declare their own <StatusBar> — stacked declarative StatusBars
  // merge in mount order so the child's wins. Do NOT call setStatusBarStyle
  // imperatively here — the imperative write clobbers whatever the child set,
  // which was making onboarding's dark icons flip back to white/light.
  // Also no backgroundColor / translucent: edgeToEdgeEnabled in app.config.js
  // makes this drive the icon tint only, no painted strip.
  const statusBarStyle = colorScheme === "dark" ? "light" : "dark";

  return (
    <>
      <StatusBar style={statusBarStyle} />
      <GestureHandlerRootView className="flex-1">
        <Drawer
          initialRouteName="(root)/index"
          screenOptions={{
            headerShown: false,
            drawerType: "front",
            drawerStatusBarAnimation: "fade",
            drawerStyle: {
              backgroundColor: theme.background,
              // Clear separation from the dimmed content behind, especially
              // in dark mode where black-on-black had no visible edge.
              borderRightWidth: 1,
              borderRightColor:
                colorScheme === "dark" ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.14)",
            },
            overlayColor: colorScheme === "dark" ? "rgba(2,6,23,0.35)" : "rgba(15,23,42,0.14)",
            sceneStyle: {
              backgroundColor: theme.background,
            },
            drawerActiveTintColor: colorScheme == "dark" ? "white" : "#007aff",
          }}
          drawerContent={SidebarContent}
        >
          <Drawer.Screen
            name="(root)/index"
            options={{
              drawerLabel: "Onboarding",
              drawerItemStyle: { display: "none" },
            }}
          />
          <Drawer.Screen
            name="(auth)/login"
            options={{
              drawerLabel: "Login",
              drawerItemStyle: { display: "none" },
            }}
          />
          <Drawer.Screen
            name="console"
            options={{
              drawerLabel: "Home",
              drawerItemStyle: { display: "none" },
            }}
          />
        </Drawer>
      </GestureHandlerRootView>
    </>
  );
}
