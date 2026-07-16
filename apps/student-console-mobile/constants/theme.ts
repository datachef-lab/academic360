import { Platform, type TextStyle, type ViewStyle } from "react-native";
import { Colors } from "./Colors";

// Design tokens for the mobile app. Single source of truth for spacing, radii,
// typography, shadows and motion so screens stay visually consistent.

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
} as const;

export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: "800" },
  h1: { fontSize: 28, lineHeight: 34, fontWeight: "800" },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: "700" },
  title: { fontSize: 18, lineHeight: 24, fontWeight: "700" },
  body: { fontSize: 15.5, lineHeight: 24, fontWeight: "400" },
  bodySm: { fontSize: 13.5, lineHeight: 20, fontWeight: "400" },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "600" },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "500" },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

// Cross-platform shadow (elevation on Android, shadow* on iOS) — from the
// react-native-design skill's shadow guidance.
export function shadow(elevation: number, color = "#000000"): ViewStyle {
  if (Platform.OS === "android") return { elevation };
  const map: Record<number, ViewStyle> = {
    1: { shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.18, shadowRadius: 2 },
    2: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
    4: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 8 },
    8: { shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.26, shadowRadius: 16 },
    16: { shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 24 },
  };
  return { shadowColor: color, ...(map[elevation] ?? map[4]) };
}

// Motion tokens. Ease-out is the UI default; springs give physical feel.
export const motion = {
  fast: 180,
  base: 260,
  slow: 420,
  spring: { damping: 15, stiffness: 150, mass: 0.9 },
  springSoft: { damping: 18, stiffness: 120, mass: 1 },
  springSnappy: { damping: 13, stiffness: 220, mass: 0.8 },
} as const;

export const theme = {
  colors: Colors.brand,
  spacing,
  radii,
  typography,
  shadow,
  motion,
};
