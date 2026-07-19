import { useRegisterOverlay } from "@/lib/overlay-store";
import { useTheme } from "@/hooks/use-theme";
import React from "react";
import { Modal, Pressable, View } from "react-native";
import Animated, { Keyframe } from "react-native-reanimated";

// shadcn-style enter: fade-in + zoom-in-95 (subtle scale from 0.95 -> 1).
const zoomIn = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.95 }] },
  100: { opacity: 1, transform: [{ scale: 1 }] },
});

type DialogProps = {
  visible: boolean;
  onClose: () => void;
  bg: string;
  children: React.ReactNode;
};

/** Centered modal dialog (like shadcn/ui): dimmed backdrop that fades in, with
 * the content card fading + zooming in. Tap outside to dismiss. */
export function Dialog({ visible, onClose, bg, children }: DialogProps) {
  // Hides the bottom tab bar while the dialog is open.
  useRegisterOverlay(visible);
  const { colorScheme } = useTheme();
  const cardBorder = colorScheme === "dark" ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.16)";
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          backgroundColor: "rgba(0,0,0,0.55)",
        }}
      >
        <Animated.View
          entering={zoomIn.duration(170)}
          style={{ width: "100%", maxWidth: 440, maxHeight: "85%" }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              borderRadius: 20,
              overflow: "hidden",
              backgroundColor: bg,
              borderWidth: 1,
              borderColor: cardBorder,
            }}
          >
            {/* cast: monorepo dual @types/react (18 web / 19 mobile) ReactNode mismatch */}
            <View>{children as never}</View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
