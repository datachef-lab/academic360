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
                paddingBottom: insets.bottom + 10,
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
