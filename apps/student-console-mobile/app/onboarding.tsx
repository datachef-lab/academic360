// import { onboardingSlides } from "@/constants/Onboarding";
import { FontAwesome5 } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Directions, Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { SlideInRight } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export const onboardingSlides = [
  {
    title: "Stay Connected",
    description: "Communicate with your college, receive updates, and never miss an important announcement.",
    icon: "people-arrows",
  },
  {
    title: "Track Academics",
    description: "View attendance, results, assignments and academic progress in one place.",
    icon: "book-reader",
  },
  {
    title: "Pay Fees Easily",
    description: "Secure and fast fee payments directly from the app.",
    icon: "credit-card",
  },
];

export default function OnboardingScreen() {
  const [slideIndex, setSlideIndex] = useState(0);

  const data = onboardingSlides[slideIndex];

  // ✅ NEXT
  const handleOnContinue = () => {
    if (slideIndex === onboardingSlides.length - 1) {
      handleEndOnboarding();
    } else {
      setSlideIndex((prev) => prev + 1);
    }
  };

  const handleOnBack = () => {
    const isFirstScreen = slideIndex === 0;
    if (isFirstScreen) {
      handleEndOnboarding();
    } else {
      setSlideIndex((prev) => prev - 1);
    }
  };

  // ✅ END
  const handleEndOnboarding = () => {
    setSlideIndex(0);

    // 🔥 replace prevents coming back
    router.replace("/(auth)");
  };

  // ✅ Swipe LEFT → Next
  // const leftFling = Gesture.Fling()
  //   .direction(Gesture.Direction.LEFT)
  //   .onEnd(() => {
  //     if (slideIndex < onboardingSlides.length - 1) {
  //       setSlideIndex((prev) => prev + 1);
  //     }
  //   });

  // // ✅ Swipe RIGHT → Previous
  // const rightFling = Gesture.Fling()
  //   .direction(Gesture.Direction.RIGHT)
  //   .onEnd(() => {
  //     if (slideIndex > 0) {
  //       setSlideIndex((prev) => prev - 1);
  //     }
  //   });

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

  return (
    <SafeAreaView className="flex-1 bg-[#15141A]">
      <View className="flex-1 justify-between px-2">
        {/* ✅ Pagination */}
        <View className="flex-row gap-2 mt-3">
          {onboardingSlides.map((_slide, idx) => (
            <View key={idx} className={`flex-1 h-1 rounded-md ${slideIndex === idx ? "bg-white" : "bg-gray-600"}`} />
          ))}
        </View>

        {/* ✅ Gesture must wrap ONE child */}
        <GestureDetector gesture={swipes}>
          <View className="flex-1">
            {/* ICON */}
            <View className="items-center justify-center h-1/2">
              <FontAwesome5 name={data.icon || "people-arrows"} size={110} color="#CEF202" />
            </View>

            {/* TEXT + BUTTONS */}
            <View className="justify-end px-5 py-14 h-1/2">
              <View className="min-h-[235px]">
                <Animated.Text
                  key={slideIndex}
                  entering={SlideInRight}
                  style={{ color: "white", fontWeight: "bold", fontSize: 40, marginVertical: 20 }}
                  className="text-white font-bold text-[40px] my-5"
                >
                  {data.title}
                </Animated.Text>

                <Text className="text-gray-400 text-[16px]">{data.description}</Text>
              </View>

              {/* Buttons */}
              <View className="mt-5 flex-row justify-between items-center w-full">
                {/* Skip */}
                <Text onPress={handleEndOnboarding} className="text-white text-xl font-semibold">
                  Skip
                </Text>

                {/* Continue */}
                <Pressable onPress={handleOnContinue} className="py-3 bg-[#302E38] rounded-xl px-20 active:opacity-70">
                  <Text className="text-white text-xl font-semibold">
                    {slideIndex === onboardingSlides.length - 1 ? "Start" : "Continue"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </GestureDetector>
      </View>
    </SafeAreaView>
  );
}
