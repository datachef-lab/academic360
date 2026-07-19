import { Colors } from "@/constants/Colors";
import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

type GlassSurfaceProps = {
  isDark: boolean;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  /** Which edge gets the hairline separator: "bottom" (line under), "top"
   * (line above), or "both". Header uses "both" — a line where the status
   * bar meets it and one against the content; dock uses "top". */
  borderEdge?: "top" | "bottom" | "both";
};

/** Shared frosted layer for header bar and bottom dock. */
export function GlassSurface({
  isDark,
  style,
  borderRadius = 0,
  borderEdge = "bottom",
}: GlassSurfaceProps) {
  // Deliberately stronger than Colors.*.dockBorder (8% alpha) — at hairline
  // width that alpha is invisible on most phones, and the separator needs to
  // actually read as a line under the header / above the dock.
  const borderColor = isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.16)";
  // Android's BlurView barely blurs (and does nothing without
  // experimentalBlurMethod), so it needs a much stronger tint — otherwise
  // scrolled content stays legible through the dock and collides with the
  // tab labels. iOS keeps the lighter frosted look.
  // Light mode uses a soft indigo-gray (not plain white) so the header and
  // dock read as distinct surfaces against the white page even where the
  // hairline separator is hard to see.
  const tintOverlay = Platform.select({
    android: isDark ? "rgba(18,18,18,0.88)" : "rgba(238,240,250,0.97)",
    default: isDark ? "rgba(255,255,255,0.07)" : "rgba(238,240,250,0.55)",
  });

  const shellStyle: ViewStyle = {
    ...StyleSheet.absoluteFillObject,
    borderRadius,
    overflow: "hidden",
  };
  // Drawn as explicit overlay lines (NOT borders on the shell): the
  // near-opaque Android tint is an absoluteFill child that paints OVER shell
  // borders, which is why the hairline was invisible no matter its alpha.
  const line = (edge: "top" | "bottom") => (
    <View
      key={edge}
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: borderColor,
        [edge]: 0,
      }}
    />
  );
  const separator =
    borderRadius === 0 ? (
      <>
        {borderEdge === "top" || borderEdge === "both" ? line("top") : null}
        {borderEdge === "bottom" || borderEdge === "both" ? line("bottom") : null}
      </>
    ) : null;

  if (Platform.OS === "web") {
    return (
      <View
        style={[
          shellStyle,
          style,
          {
            backgroundColor: isDark ? "rgba(32,32,32,0.35)" : "rgba(255,255,255,0.35)",
            backdropFilter: "blur(24px) saturate(160%)",
            // @ts-expect-error web-only
            WebkitBackdropFilter: "blur(24px) saturate(160%)",
          },
        ]}
      >
        {separator}
      </View>
    );
  }

  return (
    <View style={[shellStyle, style]}>
      <BlurView
        intensity={isDark ? 55 : 75}
        tint={isDark ? "dark" : "light"}
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: tintOverlay }]} />
      {separator}
    </View>
  );
}
