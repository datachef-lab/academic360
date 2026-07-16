import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { spacing } from "@/constants/theme";

export interface ScreenProps {
  children: ReactNode;
  /** Safe-area edges to inset. */
  edges?: Edge[];
  /** Background colour behind the safe area (solid). */
  background?: string;
  /** Apply default horizontal padding. */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Standard screen container: full-bleed background + safe-area content. */
export function Screen({
  children,
  edges = ["top", "bottom"],
  background = "#ffffff",
  padded = false,
  style,
}: ScreenProps) {
  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      <SafeAreaView
        edges={edges}
        style={[{ flex: 1 }, padded ? { paddingHorizontal: spacing.lg } : null, style]}
      >
        {/* cast: monorepo dual @types/react (18 web / 19 mobile) mismatch on children */}
        {children as never}
      </SafeAreaView>
    </View>
  );
}
