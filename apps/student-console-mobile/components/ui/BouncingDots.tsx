import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type BouncingDotsProps = {
  /** Dot fill color. */
  color?: string;
  /** Shadow (ground ellipse) color. */
  shadowColor?: string;
  size?: number;
};

const BOUNCE_HEIGHT = 30;
const DELAYS = [0, 200, 300];

/** Squash-and-stretch bouncing dots — mobile port of main-console's
 * `animate-bounce-circle` receipt loader (0.5s alternate ease, staggered). */
function Dot({
  delay,
  color,
  shadowColor,
  size,
}: {
  delay: number;
  color: string;
  shadowColor: string;
  size: number;
}) {
  // 0 = airborne (top), 1 = on the ground.
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
  }, [p, delay]);

  const dotStyle = useAnimatedStyle(() => {
    const squash = interpolate(p.value, [0, 0.8, 1], [0, 0, 1]);
    return {
      transform: [
        { translateY: interpolate(p.value, [0, 1], [0, BOUNCE_HEIGHT]) },
        { scaleX: 1 + 0.55 * squash },
        { scaleY: 1 - 0.55 * squash },
      ],
    };
  });

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 1], [0.25, 0.6]),
    transform: [{ scaleX: interpolate(p.value, [0, 1], [0.3, 1.5]) }],
  }));

  return (
    <View style={{ width: size * 2, alignItems: "center" }}>
      <Animated.View
        style={[
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
          dotStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            width: size,
            height: 4,
            borderRadius: 2,
            marginTop: BOUNCE_HEIGHT - size + 8,
            backgroundColor: shadowColor,
          },
          shadowStyle,
        ]}
      />
    </View>
  );
}

export function BouncingDots({
  color = "#4f46e5",
  shadowColor = "rgba(79,70,229,0.35)",
  size = 16,
}: BouncingDotsProps) {
  return (
    <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
      {DELAYS.map((delay) => (
        <Dot key={delay} delay={delay} color={color} shadowColor={shadowColor} size={size} />
      ))}
    </View>
  );
}
