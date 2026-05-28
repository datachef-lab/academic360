import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { GlassSurface } from "./glass-surface";

type GlassDockProps = {
  isDark: boolean;
  height: number;
  borderRadius: number;
  style?: ViewStyle;
};

/** Frosted pill behind tab icons. */
export function GlassDock({ isDark, height, borderRadius, style }: GlassDockProps) {
  return (
    <View
      style={[
        {
          height,
          borderRadius,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <GlassSurface isDark={isDark} borderRadius={borderRadius} />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius,
            borderWidth: StyleSheet.hairlineWidth + 0.5,
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
          },
        ]}
      />
    </View>
  );
}
