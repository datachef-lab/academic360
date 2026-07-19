import { CONSOLE_HEADER_HEIGHT, Header } from "@/components/ui/header";
import { useTheme } from "@/hooks/use-theme";
import { ExamSocketProvider } from "@/providers/exam-socket-provider";
import { Stack } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function ConsoleLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  // Header is absolutely positioned inside SafeAreaView(top), so the overlay
  // occupies insets.top + CONSOLE_HEADER_HEIGHT of vertical space. The Stack
  // content must reserve the SAME amount, otherwise screens draw under the
  // status bar area and the header's translucent glass surface makes the
  // content ghost through (Home's "Good Evening" was leaking into the header).
  const topOverlayHeight = insets.top + CONSOLE_HEADER_HEIGHT;

  return (
    <ExamSocketProvider>
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            contentStyle: {
              backgroundColor: theme.background,
              paddingTop: topOverlayHeight,
            },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="exams/[id]" />
        </Stack>

        <View style={styles.overlay} pointerEvents="box-none">
          <SafeAreaView edges={["top"]} pointerEvents="box-none">
            <Header />
          </SafeAreaView>
        </View>
      </View>
    </ExamSocketProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
});
