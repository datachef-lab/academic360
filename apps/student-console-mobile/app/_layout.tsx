import { SidebarContent } from "@/features/sidebar";
import { useTheme } from "@/hooks/use-theme";
import { AuthProvider } from "@/providers/auth-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import Drawer from "expo-router/drawer";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";
import React, { useLayoutEffect } from "react";
import { InteractionManager, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import "../global.css";

export default function RootLayout() {
  return (
    <GestureHandlerRootView className="flex-1">
      <AuthProvider>
        <ThemeProvider>
          <CustomDrawerNavigation />
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

function CustomDrawerNavigation() {
  const { theme, colorScheme } = useTheme();

  // Force status bar style when theme changes - derive from actual background for reliability
  const statusBarStyle = theme.background === "white" ? "dark" : "light";

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
          <Drawer.Screen
            name="(auth)"
            options={{
              drawerLabel: "Login",
              drawerItemStyle: {
                display: "none",
              },
            }}
          />
          <Drawer.Screen
            name="/console"
            options={{
              drawerLabel: "Home",
              drawerItemStyle: {
                display: "none",
              },
            }}
          />
        </Drawer>
      </GestureHandlerRootView>
    </>
  );
}
