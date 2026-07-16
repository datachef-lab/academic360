import { useEffect } from "react";
import {
  Easing,
  FadeIn,
  FadeInDown,
  SlideInLeft,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { motion } from "@/constants/theme";

// Reusable Reanimated entrance presets (GPU-friendly: transform + opacity only).
export const enterFade = (delay = 0) => FadeIn.duration(motion.base).delay(delay);
export const enterUp = (delay = 0) =>
  FadeInDown.duration(motion.base).delay(delay).springify().damping(16);
export const enterRight = (delay = 0) =>
  SlideInRight.duration(motion.base).delay(delay).springify();
export const enterLeft = (delay = 0) => SlideInLeft.duration(motion.base).delay(delay).springify();

/** Press-in scale feedback for tappable surfaces (physical "press" feel). */
export function usePressScale(to = 0.97) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn = () => {
    scale.value = withSpring(to, motion.springSnappy);
  };
  const onPressOut = () => {
    scale.value = withSpring(1, motion.springSnappy);
  };
  return { style, onPressIn, onPressOut };
}

/** Gentle, continuous vertical drift — makes a static element feel alive. */
export function useFloat(distance = 8, duration = 2600) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [t, duration]);
  return useAnimatedStyle(() => ({
    transform: [{ translateY: -distance / 2 + t.value * distance }],
  }));
}
