import { Colors } from "@/constants/Colors";
import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

type GlassSurfaceProps = {
  isDark: boolean;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
};

/** Shared frosted layer for header bar and bottom dock. */
export function GlassSurface({ isDark, style, borderRadius = 0 }: GlassSurfaceProps) {
  const borderColor = isDark ? Colors.dark.dockBorder : Colors.light.dockBorder;
  const tintOverlay = isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.42)";

  const shellStyle: ViewStyle = {
    ...StyleSheet.absoluteFillObject,
    borderRadius,
    overflow: "hidden",
    borderBottomWidth: borderRadius === 0 ? StyleSheet.hairlineWidth + 0.5 : 0,
    borderBottomColor: borderColor,
  };

  if (Platform.OS === "web") {
    return (
      <View
        style={[
          shellStyle,
          style,
          {
            backgroundColor: isDark ? "rgba(32,32,32,0.35)" : "rgba(255,255,255,0.35)",
            // @ts-expect-error web-only
            backdropFilter: "blur(24px) saturate(160%)",
            // @ts-expect-error web-only
            WebkitBackdropFilter: "blur(24px) saturate(160%)",
          },
        ]}
      />
    );
  }

  return (
    <View style={[shellStyle, style]}>
      <BlurView
        intensity={isDark ? 55 : 75}
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: tintOverlay }]} />
    </View>
  );
}
