import { useRegisterOverlay } from "@/lib/overlay-store";
import React from "react";
import { Modal, Pressable, View } from "react-native";
import Animated, { SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  bg: string;
  grabberColor?: string;
  children: React.ReactNode;
};

/** Bottom drawer: dimmed backdrop, panel slides up from the bottom with a
 * rounded top and grab handle. Tap outside to dismiss. */
export function BottomSheet({ visible, onClose, bg, grabberColor, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  // Hides the bottom tab bar while the sheet is open.
  useRegisterOverlay(visible);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // Both are needed for the sheet to reach the true screen edges on Android:
      // without navigationBarTranslucent the modal window stops above the nav bar.
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" }}
      >
        {/* Cap the height here rather than on the panel, so the panel has a bounded
            parent and any ScrollView inside it can actually scroll instead of
            being clipped by the panel's overflow: hidden. */}
        <Animated.View entering={SlideInDown.duration(240)} style={{ maxHeight: "88%" }}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: bg,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              overflow: "hidden",
              paddingBottom: insets.bottom + 12,
            }}
          >
            <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 2 }}>
              <View
                style={{
                  width: 40,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: grabberColor ?? "rgba(148,163,184,0.5)",
                }}
              />
            </View>
            {/* flexShrink lets tall content shrink to the capped height (and scroll)
                instead of overflowing past the panel and getting clipped. */}
            {/* cast: monorepo dual @types/react (18 web / 19 mobile) ReactNode mismatch */}
            <View style={{ flexShrink: 1 }}>{children as never}</View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
