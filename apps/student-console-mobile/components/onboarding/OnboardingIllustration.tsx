import { Image } from "expo-image";
import Animated from "react-native-reanimated";
import { useFloat } from "@/lib/animations";

/** Onboarding hero image — fills the available height, gently floating. */
export function OnboardingIllustration({ image }: { image: number }) {
  const float = useFloat(7, 3600);

  return (
    <Animated.View style={[float, { flex: 1, width: "100%" }]}>
      <Image
        source={image}
        style={{ width: "100%", height: "100%" }}
        contentFit="contain"
        transition={220}
      />
    </Animated.View>
  );
}
