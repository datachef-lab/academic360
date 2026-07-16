import comingSoonImg from "@/assets/illustrations/coming-soon.jpg";
import { useTheme } from "@/hooks/use-theme";
import { Image } from "expo-image";
import React from "react";
import { Text, View } from "react-native";

/** Friendly placeholder for screens that aren't built yet. */
export function ComingSoon({ title, message }: { title?: string; message?: string }) {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  return (
    <View
      className="flex-1 items-center justify-center px-8"
      style={{ backgroundColor: theme.background }}
    >
      <View
        className="rounded-3xl items-center justify-center overflow-hidden mb-6"
        style={{ width: 180, height: 180, backgroundColor: "#ffffff" }}
      >
        <Image source={comingSoonImg} style={{ width: 172, height: 172 }} contentFit="contain" />
      </View>
      <View
        className="rounded-full px-3 py-1 mb-3"
        style={{ backgroundColor: isDark ? "rgba(99,102,241,0.2)" : "#eef2ff" }}
      >
        <Text style={{ color: "#4f46e5", fontSize: 11, fontWeight: "800", letterSpacing: 1 }}>
          COMING SOON
        </Text>
      </View>
      <Text style={{ color: theme.text }} className="text-xl font-bold text-center">
        {title ?? "Coming soon"}
      </Text>
      <Text
        style={{ color: theme.text, opacity: 0.6 }}
        className="text-sm mt-2 text-center"
        numberOfLines={3}
      >
        {message ?? "This screen is being designed and will be available soon."}
      </Text>
    </View>
  );
}
