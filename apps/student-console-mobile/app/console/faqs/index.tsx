import { useTheme } from "@/hooks/use-theme";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import React, { useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  Text,
  UIManager,
  View,
} from "react-native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS: { q: string; a: string }[] = [
  {
    q: "How do I pay my semester fees?",
    a: "Open the Fees tab, pick the instalment you want to clear and tap Pay. You'll be taken to the payment gateway, and the receipt appears under Documents once the payment succeeds.",
  },
  {
    q: "When are subject selections open?",
    a: "Subject selection opens at the start of each semester. You'll get a notification, and the option appears under Academics → Subject Selection while the window is open.",
  },
  {
    q: "Where do I find my admit card?",
    a: "Academics → Collect Admit Card. It unlocks once your fees are cleared and your exam form is verified.",
  },
  {
    q: "How many books can I borrow at a time?",
    a: "Undergraduate students may borrow up to 4 books for 14 days. Check due dates and fines under Library → My Books.",
  },
  {
    q: "What is the minimum attendance requirement?",
    a: "You need at least 75% attendance to appear for university examinations. Track it under Academics → Academic Status.",
  },
  {
    q: "How do I get a bonafide certificate?",
    a: "Raise a request from Service Requests → New request → Bonafide Certificate. You'll be notified once the office approves it.",
  },
  {
    q: "I lost my ID card. What should I do?",
    a: "Raise an ID Card Issue request from Service Requests. Carry the acknowledgement to the office to collect the replacement.",
  },
];

export default function FaqsScreen() {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const accent = isDark ? "#a5b4fc" : "#4f46e5";
  const [open, setOpen] = useState<number | null>(0);

  const toggle = (i: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((prev) => (prev === i ? null : i));
  };

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={{ color: theme.text, opacity: 0.6 }} className="text-sm mb-4">
        Answers to the questions students ask most.
      </Text>

      <View className="gap-3">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          const Chevron = isOpen ? ChevronUp : ChevronDown;
          return (
            <Pressable
              key={f.q}
              onPress={() => toggle(i)}
              className="rounded-2xl p-4"
              style={{
                backgroundColor: cardBg,
                borderWidth: 1,
                borderColor: isOpen ? accent : cardBorder,
              }}
            >
              <View className="flex-row items-center">
                <Text style={{ color: theme.text, flex: 1 }} className="text-sm font-semibold">
                  {f.q}
                </Text>
                <Chevron
                  size={17}
                  color={isOpen ? accent : theme.text}
                  style={{ opacity: isOpen ? 1 : 0.4 }}
                />
              </View>
              {isOpen ? (
                <Text
                  style={{ color: theme.text, opacity: 0.65, marginTop: 8, lineHeight: 19 }}
                  className="text-xs"
                >
                  {f.a}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
