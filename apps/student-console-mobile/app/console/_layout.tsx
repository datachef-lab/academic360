import { Header } from "@/components/ui/header";
import { useTheme } from "@/hooks/use-theme";
import { Stack } from "expo-router";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ConsoleLayout() {
  const { theme, colorScheme } = useTheme();

  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: theme.background }} className="h-full flex-1">
      <Header />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        {/* <Stack.Screen name="console" /> */}
      </Stack>
      {/* <GestureHandlerRootView className="flex-1">
        <Drawer
          screenOptions={{
            headerShown: false,
            drawerContentStyle: {
              padding: 0,
              margin: 0,
            },
            drawerStyle: {
              backgroundColor: theme.background,
              // borderWidth: 1,
              // borderColor: "white",
              padding: 0,
              margin: 0,
            },
            drawerActiveTintColor: colorScheme == "dark" ? "white" : "#007aff",
          }}
          drawerContent={SidebarContent}
        >
          <Drawer.Screen
            name="(tabs)"
            options={{
              drawerLabel: "Home",
              drawerIcon: () => (
                <House color={colorScheme == "dark" ? "white" : "#007aff"} />
              ),
              drawerItemStyle: {
                display: "none",
              },
            }}
          />
        </Drawer>
      </GestureHandlerRootView>
      <StatusBar
        style={colorScheme === "dark" ? "light" : "dark"}
        backgroundColor="transparent"
      /> */}
    </SafeAreaView>
  );
}
