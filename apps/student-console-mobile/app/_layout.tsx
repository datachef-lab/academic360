import { SidebarContent } from "@/features/sidebar";
import { useTheme } from "@/hooks/use-theme";
import { ThemeProvider } from "@/providers/theme-provider";
import Drawer from "expo-router/drawer";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import "../global.css";

export default function RootLayout() {
  return (
    <GestureHandlerRootView className="flex-1">
      <ThemeProvider>
        <CustomDrawerNavigation />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function CustomDrawerNavigation() {
  const { theme, colorScheme } = useTheme();

  return (
    <>
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
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} backgroundColor="transparent" />
      </GestureHandlerRootView>
    </>
  );
}
