import { useCallback, useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { ArrowRight } from "lucide-react-native";

import { BouncingDots } from "@/components/ui/BouncingDots";
import { OnboardingIllustration } from "@/components/onboarding/OnboardingIllustration";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/Button";
import { brandLogoUrl, onboardingImages } from "@/constants/Images";
import { onboardingSlides } from "@/constants/Onboarding";
import { getOnboardingCompleted, setOnboardingCompleted } from "@/lib/onboarding-storage";
import { useAuth } from "@/providers/auth-provider";

// Neutral light theme (no purple). Colour comes from each slide's accent.
const BG = "#ffffff";
const TEXT_DARK = "#1e293b";
const TEXT_MUTED = "#64748b";
const DOT_INACTIVE = "#dbe1ea";

// `any` cast: dual @types/react (18 web / 19 mobile) trips lucide's JSX type.
const ArrowIcon: any = ArrowRight;

const SPRING = { damping: 22, stiffness: 210, mass: 0.6 };
const DOT_SPRING = { damping: 15, stiffness: 150, mass: 0.8 };
const N = onboardingSlides.length;

/** Subtle decorative background (soft blobs + dot clusters) tinted to the
 * current slide's accent, filling the otherwise-empty space. */
function OnboardingBackground({ accent, w, h }: { accent: string; w: number; h: number }) {
  const dots: { top: number; left: number }[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      dots.push({ top: h * 0.1 + r * 22, left: w * 0.07 + c * 22 }); // top-left cluster
      dots.push({ top: h * 0.72 + r * 22, left: w * 0.66 + c * 22 }); // bottom-right cluster
    }
  }
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View
        style={{
          position: "absolute",
          top: -70,
          right: -80,
          width: 250,
          height: 250,
          borderRadius: 125,
          backgroundColor: `${accent}0d`,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 30,
          left: -90,
          width: 230,
          height: 230,
          borderRadius: 115,
          backgroundColor: `${accent}0d`,
        }}
      />
      {dots.map((d, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            top: d.top,
            left: d.left,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: `${accent}24`,
          }}
        />
      ))}
    </View>
  );
}

function haptic(type: "light" | "success") {
  if (Platform.OS === "web") return;
  if (type === "success") {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } else {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

function Dot({ isActive, accent }: { isActive: boolean; accent: string }) {
  const width = useSharedValue(isActive ? 22 : 7);
  const opacity = useSharedValue(isActive ? 1 : 0.7);

  useEffect(() => {
    width.value = withSpring(isActive ? 22 : 7, DOT_SPRING);
    opacity.value = withTiming(isActive ? 1 : 0.7, { duration: 260 });
  }, [isActive, width, opacity]);

  const style = useAnimatedStyle(() => ({ width: width.value, opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        { height: 7, borderRadius: 4, backgroundColor: isActive ? accent : DOT_INACTIVE },
        style,
      ]}
    />
  );
}

/** One page: framed illustration panel (fills) + text beneath. */
function Slide({
  slideWidth,
  slideHeight,
  item,
}: {
  slideWidth: number;
  slideHeight: number;
  item: (typeof onboardingSlides)[number];
}) {
  const image = onboardingImages[item.illustration] ?? onboardingImages["onboarding-campus"];
  // Bound the image so it doesn't balloon; the group is centered for even spacing.
  const imgH = Math.round(Math.min(slideHeight * 0.4, slideWidth * 0.92));

  return (
    <View style={{ width: slideWidth, flex: 1, paddingHorizontal: 18, justifyContent: "center" }}>
      <View style={{ width: "100%", height: imgH }}>
        <OnboardingIllustration image={image} />
      </View>

      <View style={{ marginTop: 26, alignItems: "center" }}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            color: TEXT_DARK,
            fontSize: 28,
            fontWeight: "800",
            lineHeight: 34,
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          {item.title}
        </Text>
        <Text style={{ color: TEXT_MUTED, fontSize: 15, lineHeight: 22, textAlign: "center" }}>
          {item.description}
        </Text>
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const { accessToken, user, isReady } = useAuth();
  const { theme, colorScheme } = useTheme();
  const { width, height } = useWindowDimensions();
  const [slideIndex, setSlideIndex] = useState(0);
  const [isChecking, setIsChecking] = useState(true);
  const translateX = useSharedValue(0);
  // This screen stays mounted in the drawer after navigating away, and
  // expo-status-bar lets the last-mounted <StatusBar> win — so an
  // unconditional style="dark" here would pin dark icons app-wide (invisible
  // on the dark theme). Only assert it while this screen is focused.
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isReady) return;
    const run = async () => {
      try {
        const completed = await getOnboardingCompleted();
        if (accessToken && user?.type === "STUDENT") {
          console.log("[Onboarding] User authenticated, navigating to /console");
          router.replace("/console/(tabs)");
          return;
        }
        if (completed) {
          router.replace("/(auth)/login");
          return;
        }
        // Only reveal the slides when we KNOW we're staying here. Flipping
        // isChecking before router.replace flashed the onboarding UI for a
        // frame on every warm start of an already-logged-in user.
        setIsChecking(false);
      } catch (error) {
        console.error("[Onboarding] checkAndRedirect:", error);
        setIsChecking(false);
      }
    };
    void run();
  }, [isReady, accessToken, user]);

  // Keep the strip aligned to the active page (also handles rotation).
  useEffect(() => {
    translateX.value = withSpring(-slideIndex * width, SPRING);
  }, [slideIndex, width, translateX]);

  const data = onboardingSlides[slideIndex];
  const accent = data.accent ?? "#2563eb";
  const accentTo = data.accentTo ?? accent;
  const isLastSlide = slideIndex === N - 1;

  const finish = useCallback(async () => {
    haptic("success");
    await setOnboardingCompleted();
    setSlideIndex(0);
    router.replace("/(auth)/login");
  }, []);

  const commitIndex = useCallback((i: number) => {
    setSlideIndex(i);
    haptic("light");
  }, []);

  const next = useCallback(() => {
    if (slideIndex >= N - 1) {
      void finish();
    } else {
      setSlideIndex((p) => p + 1);
      haptic("light");
    }
  }, [slideIndex, finish]);

  // Finger-following horizontal pager: forward = drag right→left, back = left→right.
  const pan = Gesture.Pan()
    .activeOffsetX([-14, 14])
    .onUpdate((e) => {
      translateX.value = -slideIndex * width + e.translationX;
    })
    .onEnd((e) => {
      const threshold = width * 0.2;
      let target = slideIndex;
      if ((e.translationX < -threshold || e.velocityX < -600) && slideIndex < N - 1) {
        target = slideIndex + 1;
      } else if ((e.translationX > threshold || e.velocityX > 600) && slideIndex > 0) {
        target = slideIndex - 1;
      }
      translateX.value = withSpring(-target * width, { ...SPRING, velocity: e.velocityX });
      if (target !== slideIndex) runOnJS(commitIndex)(target);
    });

  const stripStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

  if (isChecking) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isFocused ? <StatusBar style={colorScheme === "dark" ? "light" : "dark"} /> : null}
        <Image
          source={require("@/assets/images/icon.png")}
          style={{ width: 84, height: 84, borderRadius: 22, marginBottom: 18 }}
          contentFit="cover"
        />
        <Text style={{ color: theme.text, fontSize: 21, fontWeight: "800", marginBottom: 34 }}>
          Student Console
        </Text>
        <BouncingDots
          color={colorScheme === "dark" ? "#a5b4fc" : "#4f46e5"}
          shadowColor={colorScheme === "dark" ? "rgba(165,180,252,0.3)" : "rgba(79,70,229,0.35)"}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <OnboardingBackground accent={accent} w={width} h={height} />
      {isFocused ? <StatusBar style="dark" /> : null}
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={{ uri: brandLogoUrl }}
              style={{ width: 30, height: 30, borderRadius: 8 }}
              contentFit="contain"
            />
            <Text style={{ marginLeft: 8, color: TEXT_DARK, fontSize: 16, fontWeight: "700" }}>
              BESC <Text style={{ color: accent, fontWeight: "600" }}>Console</Text>
            </Text>
          </View>
          {!isLastSlide ? (
            <Pressable onPress={finish} hitSlop={12}>
              <Text style={{ color: TEXT_MUTED, fontSize: 14, fontWeight: "600" }}>Skip</Text>
            </Pressable>
          ) : (
            <View style={{ width: 34 }} />
          )}
        </View>

        {/* Swipeable pager */}
        <GestureDetector gesture={pan}>
          <View style={{ flex: 1, overflow: "hidden" }}>
            <Animated.View
              style={[{ flex: 1, flexDirection: "row", width: width * N }, stripStyle]}
            >
              {onboardingSlides.map((item) => (
                <Slide key={item.id} slideWidth={width} slideHeight={height} item={item} />
              ))}
            </Animated.View>
          </View>
        </GestureDetector>

        {/* Footer: dots + single CTA (never shifts) */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 12, paddingTop: 6 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 7,
              marginBottom: 20,
            }}
          >
            {onboardingSlides.map((_s, idx) => (
              <Dot key={idx} isActive={slideIndex === idx} accent={accent} />
            ))}
          </View>

          <Button
            label={data.cta ?? (isLastSlide ? "Get Started" : "Next")}
            onPress={next}
            variant="gradient"
            size="lg"
            accent={accent}
            accentTo={accentTo}
            haptic={false}
            fullWidth
            rightIcon={<ArrowIcon size={19} color="#ffffff" strokeWidth={2.4} />}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
