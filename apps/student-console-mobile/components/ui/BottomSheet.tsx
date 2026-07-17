import React from "react";
import { Modal, Platform, Pressable, View } from "react-native";
import Animated, { SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Bottom tab bar height + gap (see app/console/(tabs)/_layout.tsx). */
const TAB_BAR_SPACE = 62;

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
  // On web the Modal renders inside the tab scene, which ends above the tab bar,
  // leaving a gap under the sheet. Bleed past it so the panel reaches the screen
  // bottom (native Modals are their own window, so no bleed needed there).
  const bleed = Platform.OS === "web" ? TAB_BAR_SPACE : 0;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1 }}>
        <Pressable
          onPress={onClose}
          style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" }}
        >
          <Animated.View entering={SlideInDown.duration(240)}>
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{
                backgroundColor: bg,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                overflow: "hidden",
                maxHeight: "88%",
                // Extend to the true screen bottom; keep content clear of the tab bar.
                marginBottom: -bleed,
                paddingBottom: insets.bottom + 10 + bleed,
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
              {/* cast: monorepo dual @types/react (18 web / 19 mobile) ReactNode mismatch */}
              <View>{children as never}</View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </View>
    </Modal>
  );
}
