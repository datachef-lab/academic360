import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { radii, shadow, spacing } from "@/constants/theme";

export interface CardProps {
  children: ReactNode;
  elevation?: number;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Rounded surface with a cross-platform shadow. */
export function Card({ children, elevation = 2, padded = true, style }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: "#ffffff",
          borderRadius: radii.lg,
          padding: padded ? spacing.base : 0,
          ...shadow(elevation),
        },
        style,
      ]}
    >
      {/* cast: monorepo dual @types/react (18 web / 19 mobile) mismatch on children */}
      {children as never}
    </View>
  );
}
