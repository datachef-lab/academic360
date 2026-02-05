import { onboardingSlides } from "@/constants/Onboarding";
import { useTheme } from "@/hooks/use-theme";
import { getOnboardingCompleted, setOnboardingCompleted } from "@/lib/onboarding-storage";
import { useAuth } from "@/providers/auth-provider";
import { router } from "expo-router";
import { Calendar, FileText, GraduationCap, Library, LogIn, Sparkles } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { Directions, Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

// Dark black-like background for onboarding
const ONBOARDING_BG_TOP = "#0a0a0a";
const ONBOARDING_BG_BOTTOM = "#15141A";

// Animation constants - synchronized timing
const ANIMATION_DURATION = 400;
const ANIMATION_DELAY = 100;
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 0.8,
};

// Icon mapping for illustrations
const iconMap: Record<string, React.ComponentType<any>> = {
  "onboarding-campus": GraduationCap,
  "onboarding-schedule": Calendar,
  "onboarding-exams": FileText,
  "onboarding-services": Library,
  "onboarding-login": LogIn,
};

// Animated Pagination Dot Component
function AnimatedDot({ isActive, accentColor, isDark }: { isActive: boolean; accentColor: string; isDark: boolean }) {
  const width = useSharedValue(isActive ? 24 : 8);
  const opacity = useSharedValue(isActive ? 1 : 0.4);
  const scale = useSharedValue(isActive ? 1.2 : 1);

  useEffect(() => {
    width.value = withSpring(isActive ? 24 : 8, SPRING_CONFIG);
    opacity.value = withTiming(isActive ? 1 : 0.4, { duration: ANIMATION_DURATION });
    scale.value = withSpring(isActive ? 1.2 : 1, SPRING_CONFIG);
  }, [isActive, width, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          height: 8,
          borderRadius: 4,
          backgroundColor: isActive ? accentColor : isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)",
        },
        animatedStyle,
      ]}
    />
  );
}

export default function OnboardingScreen() {
  const { theme, colorScheme } = useTheme();
  const { accessToken, user, isReady } = useAuth();
  const [slideIndex, setSlideIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  // Redirect: if authenticated -> /console; if onboarding done -> login
  useEffect(() => {
    if (!isReady) {
      console.log("[Onboarding] Waiting for auth to be ready...");
      return;
    }

    const checkAndRedirect = async () => {
      try {
        console.log("[Onboarding] Checking onboarding status...");
        const completed = await getOnboardingCompleted();
        setIsCheckingOnboarding(false);

        // If user is already logged in, go to console
        if (accessToken && user?.type === "STUDENT") {
          console.log("[Onboarding] User authenticated, navigating to /console");
          try {
            router.replace("/console");
          } catch (error) {
            console.error("[Onboarding] Navigation error to /console:", error);
          }
          return;
        }

        // If onboarding completed, go to login
        if (completed) {
          console.log("[Onboarding] Onboarding completed, navigating to login");
          try {
            router.replace("/(auth)/login");
          } catch (error) {
            console.error("[Onboarding] Navigation error to login:", error);
          }
        }
      } catch (error) {
        console.error("[Onboarding] Error in checkAndRedirect:", error);
        setIsCheckingOnboarding(false);
      }
    };

    void checkAndRedirect();
  }, [isReady, accessToken, user]);
  const iconScale = useSharedValue(1);
  const contentOpacity = useSharedValue(1);

  const data = onboardingSlides[slideIndex];
  const IconComponent = iconMap[data.illustration] || Sparkles;
  const isDark = true; // Onboarding always uses dark branded background

  // Theme-based colors (onboarding uses dark branded bg for consistency on mobile)
  const accentColor = isDark ? "#CEF202" : "#007AFF";
  const textColor = "#FFFFFF";
  const textSecondaryColor = "rgba(255,255,255,0.6)";

  // Icon scale animation on slide change
  useEffect(() => {
    iconScale.value = withSpring(1.1, SPRING_CONFIG, () => {
      iconScale.value = withSpring(1, SPRING_CONFIG);
    });
  }, [slideIndex, iconScale]);

  // Content fade animation - smoother to prevent layout shifts
  useEffect(() => {
    contentOpacity.value = withTiming(0.3, { duration: 100 }, () => {
      contentOpacity.value = withTiming(1, { duration: ANIMATION_DURATION });
    });
  }, [slideIndex, contentOpacity]);

  // ✅ END - Save completion state and navigate to login
  const handleEndOnboarding = useCallback(async () => {
    await setOnboardingCompleted();
    setSlideIndex(0);
    router.replace("/(auth)/login");
  }, []);

  // ✅ NEXT
  const handleOnContinue = useCallback(() => {
    if (slideIndex === onboardingSlides.length - 1) {
      void handleEndOnboarding();
    } else {
      setDirection("right");
      setSlideIndex((prev) => prev + 1);
    }
  }, [slideIndex, handleEndOnboarding]);

  const handleOnBack = useCallback(() => {
    const isFirstScreen = slideIndex === 0;
    if (isFirstScreen) {
      void handleEndOnboarding();
    } else {
      setDirection("left");
      setSlideIndex((prev) => prev - 1);
    }
  }, [slideIndex, handleEndOnboarding]);

  // Swipe gestures
  const swipeForward = Gesture.Fling()
    .direction(Directions.LEFT)
    .onEnd(() => {
      handleOnContinue();
    });

  const swipeBackward = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onEnd(() => {
      handleOnBack();
    });

  const swipes = Gesture.Simultaneous(swipeBackward, swipeForward);

  // Icon scale animation style
  const iconScaleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: iconScale.value }],
    };
  });

  // Content opacity animation style
  const contentOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
    };
  });

  const isLastSlide = slideIndex === onboardingSlides.length - 1;

  // Don't render onboarding content while checking storage (avoids flash)
  if (isCheckingOnboarding) {
    return (
      <LinearGradient colors={[ONBOARDING_BG_TOP, ONBOARDING_BG_BOTTOM]} className="flex-1">
        <SafeAreaView edges={["top", "bottom"]} className="flex-1">
          <View className="flex-1" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[ONBOARDING_BG_TOP, ONBOARDING_BG_BOTTOM]} className="flex-1">
      <StatusBar style="light" />
      <SafeAreaView edges={["top", "bottom"]} className="flex-1">
        <View className="flex-1">
          {/* Pagination Dots - Single progress indicator */}
          <View className="flex-row gap-2 justify-center mt-4 mb-6">
            {onboardingSlides.map((_slide, idx) => (
              <AnimatedDot key={idx} isActive={slideIndex === idx} accentColor={accentColor} isDark={isDark} />
            ))}
          </View>

          {/* Gesture Detector for Swipe */}
          <GestureDetector gesture={swipes}>
            <View className="flex-1">
              {/* Icon/Illustration Section - Fixed height to prevent shifting */}
              <View className="items-center justify-center px-8" style={{ minHeight: 240, maxHeight: 280 }}>
                <Animated.View
                  key={`icon-wrapper-${slideIndex}`}
                  entering={
                    direction === "right"
                      ? SlideInRight.duration(ANIMATION_DURATION).delay(ANIMATION_DELAY).springify()
                      : SlideInLeft.duration(ANIMATION_DURATION).delay(ANIMATION_DELAY).springify()
                  }
                  exiting={
                    direction === "right"
                      ? SlideOutLeft.duration(ANIMATION_DURATION * 0.75)
                      : SlideOutRight.duration(ANIMATION_DURATION * 0.75)
                  }
                  className="items-center justify-center"
                  style={{ width: 192, height: 192 }}
                >
                  <Animated.View
                    style={[
                      iconScaleStyle,
                      {
                        width: 192,
                        height: 192,
                        borderRadius: 96,
                        backgroundColor: isDark ? `${accentColor}25` : `${accentColor}15`,
                        alignItems: "center",
                        justifyContent: "center",
                        // Shadow for native platforms
                        ...(Platform.OS !== "web" && {
                          shadowColor: accentColor,
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: isDark ? 0.5 : 0.3,
                          shadowRadius: isDark ? 30 : 20,
                          elevation: 10,
                        }),
                      },
                    ]}
                  >
                    <IconComponent size={120} color={accentColor} strokeWidth={isDark ? 1.5 : 2} />
                  </Animated.View>
                </Animated.View>
              </View>

              {/* Content Section - Consistent spacing with fixed layout */}
              <View className="flex-1 px-2 justify-between pb-6">
                {/* Text Content - Fixed wrapper to prevent shifting */}
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    minHeight: 200,
                  }}
                >
                  <Animated.View
                    key={`content-${slideIndex}`}
                    entering={
                      direction === "right"
                        ? SlideInRight.duration(ANIMATION_DURATION)
                            .delay(ANIMATION_DELAY * 1.5)
                            .springify()
                        : SlideInLeft.duration(ANIMATION_DURATION)
                            .delay(ANIMATION_DELAY * 1.5)
                            .springify()
                    }
                    exiting={
                      direction === "right"
                        ? SlideOutLeft.duration(ANIMATION_DURATION * 0.75)
                        : SlideOutRight.duration(ANIMATION_DURATION * 0.75)
                    }
                  >
                    <Animated.View style={contentOpacityStyle}>
                      {/* Title - Large and Prominent */}
                      <Animated.Text
                        key={`title-${slideIndex}`}
                        entering={FadeIn.delay(ANIMATION_DELAY * 2).duration(ANIMATION_DURATION)}
                        style={{
                          color: textColor,
                          fontSize: 36,
                          fontWeight: "800",
                          // lineHeight: 56,
                          marginBottom: 24,
                          textAlign: "center",
                          // paddingHorizontal: 16,
                        }}
                      >
                        {data.title}
                      </Animated.Text>

                      {/* Description */}
                      <Animated.Text
                        key={`description-${slideIndex}`}
                        entering={FadeIn.delay(ANIMATION_DELAY * 2.5).duration(ANIMATION_DURATION)}
                        style={{
                          color: textSecondaryColor,
                          fontSize: 16,
                          lineHeight: 24,
                          textAlign: "center",
                          paddingHorizontal: 8,
                        }}
                      >
                        {data.description}
                      </Animated.Text>
                    </Animated.View>
                  </Animated.View>
                </View>

                {/* Button Section - Fixed at bottom with consistent spacing */}
                <Animated.View
                  key={`buttons-wrapper-${slideIndex}`}
                  entering={FadeIn.delay(ANIMATION_DELAY * 3).duration(ANIMATION_DURATION)}
                >
                  <Animated.View
                    style={[
                      {
                        marginTop: 40,
                        paddingTop: 0,
                      },
                      contentOpacityStyle,
                    ]}
                  >
                    {/* Skip and Next/Continue Buttons in same row */}
                    <View className="flex-row gap-3 items-center">
                      {/* Skip Button */}
                      <Pressable
                        onPress={handleEndOnboarding}
                        className="flex-1 py-4 rounded-2xl active:opacity-70"
                        style={{
                          backgroundColor: "transparent",
                          borderWidth: 1,
                          borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
                        }}
                      >
                        <Text style={{ color: textSecondaryColor }} className="text-center text-lg font-semibold">
                          Skip
                        </Text>
                      </Pressable>

                      {/* CTA Button */}
                      <Pressable
                        onPress={handleOnContinue}
                        className="flex-1 py-4 rounded-2xl active:opacity-90"
                        style={{
                          backgroundColor: isLastSlide
                            ? accentColor
                            : isDark
                              ? "rgba(255,255,255,0.1)"
                              : "rgba(0,0,0,0.05)",
                        }}
                      >
                        <Text
                          style={{
                            color: isLastSlide ? (isDark ? "#15141A" : "#FFFFFF") : textColor,
                          }}
                          className="text-center text-lg font-bold"
                        >
                          {data.cta || (isLastSlide ? "Get Started" : "Continue")}
                        </Text>
                      </Pressable>
                    </View>
                  </Animated.View>
                </Animated.View>
              </View>
            </View>
          </GestureDetector>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// import { useTheme } from "@/hooks/use-theme";
// import { Link } from "expo-router";
// import { View } from "react-native";

// export default function Index() {
//   const { theme } = useTheme();

//   return (
//     <View style={{ backgroundColor: theme.background }} className="flex-1 items-center justify-center">
//       <Link href="/console/(tabs)" className="text-2xl" style={{ color: theme.text }}>
//         Go to Console Screen!
//       </Link>
//       <Link href="/onboarding" className="text-2xl" style={{ color: theme.text }}>
//         Go to onboarding!
//       </Link>
//     </View>
//   );
// }
