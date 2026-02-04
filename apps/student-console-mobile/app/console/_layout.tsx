import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Header } from "@/components/ui/header";
import { useTheme } from "@/hooks/use-theme";
import { Stack } from "expo-router";
import React, { useState, useEffect } from "react";
import { Platform, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function WebStatusBar({ theme }: { theme: { background: string; text: string } }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
  useEffect(() => {
    const id = setInterval(
      () => setTime(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })),
      1000,
    );
    return () => clearInterval(id);
  }, []);
  if (Platform.OS !== "web") return null;
  const isDark = theme.background !== "white";
  if (__DEV__) {
    console.log("[WebStatusBar] render:", {
      "theme.background": theme.background,
      isDark,
      "text color": isDark ? "white" : "black",
    });
  }
  return (
    <View
      style={{
        height: 24,
        backgroundColor: theme.background,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
      }}
    >
      <Text style={{ color: isDark ? "#fff" : "#000", fontSize: 12, fontWeight: "600" }}>{time}</Text>
      <Text style={{ color: isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.8)", fontSize: 11 }}>100%</Text>
    </View>
  );
}

export default function ConsoleLayout() {
  const { theme } = useTheme();

  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: theme.background }} className="h-full flex-1">
      <Header />
      <Breadcrumb />
      <Stack
        screenOptions={{
          headerShown: false,
          // Configure right-to-left slide animation
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" />
        {/* <Stack.Screen name="console" /> */}
      </Stack>
    </SafeAreaView>
  );
}
