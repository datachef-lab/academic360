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
      <GlassSurface isDark={isDark} borderRadius={borderRadius} borderEdge="top" />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius,
            // Full outline only when the dock floats as a rounded pill; when
            // it's flush full-width (radius 0), GlassSurface's top hairline
            // is the separator and side/bottom borders would show as stray
            // lines against the screen edges.
            borderWidth: borderRadius > 0 ? StyleSheet.hairlineWidth + 0.5 : 0,
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
          },
        ]}
      />
    </View>
  );
}
