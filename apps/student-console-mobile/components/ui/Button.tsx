import type { ReactElement } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/Colors";
import { radii, shadow } from "@/constants/theme";
import { usePressScale } from "@/lib/animations";
import { Text } from "./Text";

const b = Colors.brand;

type Variant = "gradient" | "solid" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const sizes: Record<Size, { height: number; px: number; font: number }> = {
  sm: { height: 44, px: 16, font: 14.5 },
  md: { height: 52, px: 20, font: 16 },
  lg: { height: 56, px: 24, font: 16.5 },
};

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactElement;
  rightIcon?: ReactElement;
  haptic?: boolean;
  fullWidth?: boolean;
  accent?: string; // gradient/solid start colour
  accentTo?: string; // gradient end colour (defaults to accent)
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = "gradient",
  size = "md",
  disabled,
  loading,
  leftIcon,
  rightIcon,
  haptic = true,
  fullWidth,
  accent = b.indigo,
  accentTo,
  style,
}: ButtonProps) {
  const press = usePressScale(0.97);
  const s = sizes[size];
  const isDisabled = disabled || loading;
  const textColor = variant === "ghost" || variant === "outline" ? b.violet300 : "#ffffff";

  const handlePress = () => {
    if (isDisabled) return;
    if (haptic && Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const frame: StyleProp<ViewStyle> = [
    styles.base,
    { height: s.height, paddingHorizontal: s.px, borderRadius: radii.lg },
    variant === "solid" ? { backgroundColor: accent } : null,
    variant === "ghost" ? { backgroundColor: "rgba(255,255,255,0.06)" } : null,
    variant === "outline"
      ? { backgroundColor: "transparent", borderWidth: 1, borderColor: "rgba(255,255,255,0.24)" }
      : null,
    isDisabled ? { opacity: 0.55 } : null,
  ];

  const inner = loading ? (
    <ActivityIndicator color={textColor} />
  ) : (
    <View style={styles.row}>
      {/* casts: monorepo dual @types/react (18 web / 19 mobile) mismatch on node types */}
      {leftIcon as never}
      <Text style={{ color: textColor, fontSize: s.font, fontWeight: "700" }}>{label}</Text>
      {rightIcon as never}
    </View>
  );

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={isDisabled}
      style={[fullWidth ? { alignSelf: "stretch" } : null, style]}
    >
      <Animated.View
        style={[press.style, variant === "gradient" && !isDisabled ? shadow(4, accent) : null]}
      >
        {variant === "gradient" ? (
          <LinearGradient
            colors={[accent, accentTo ?? accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={frame}
          >
            {inner}
          </LinearGradient>
        ) : (
          <View style={frame}>{inner}</View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
