import { onboardingImages } from "@/constants/Images";
import { useTheme } from "@/hooks/use-theme";
import { toSentenceCase } from "@/lib/text";
import { useAuth } from "@/providers/auth-provider";
import type { StudentDto } from "@repo/db/dtos/user";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

type TabKey = "activities" | "subjects";

type ActivityCard = {
  id: string;
  label: string;
  desc: string;
  illustration: number;
  path: string;
};

// Mock subjects for the current semester — replace with the student's real
// subject list (from subject-selection / promotion) later.
const MOCK_SUBJECTS = [
  { id: "1", name: "Mathematics", code: "MTMA", type: "Major" },
  { id: "2", name: "Business Economics", code: "ECON", type: "Minor" },
  { id: "3", name: "Statistics", code: "STAT", type: "Major" },
  { id: "4", name: "English", code: "ENGL", type: "AEC" },
  { id: "5", name: "Programming Lab", code: "CMSA", type: "SEC" },
];

export default function AcademicsScreen() {
  const { theme, colorScheme } = useTheme();
  const { user } = useAuth();
  const student = user?.payload as StudentDto | undefined;
  const [tab, setTab] = useState<TabKey>("activities");

  const isDark = colorScheme === "dark";
  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const accent = isDark ? "#a5b4fc" : "#4f46e5";
  const segBg = isDark ? "rgba(255,255,255,0.06)" : "#eef2ff";

  const promo = student?.currentPromotion;
  const semesterName = toSentenceCase(promo?.class?.name || "");
  const affiliation = student?.programCourse?.affiliation ?? promo?.programCourse?.affiliation;
  const affiliationLabel = affiliation?.shortName || affiliation?.name;

  const activityCards: ActivityCard[] = [
    {
      id: "attendance",
      label: "Attendance",
      desc: "Your attendance and academic status",
      illustration: onboardingImages["onboarding-schedule"],
      path: "/console/academics/current-status",
    },
    {
      id: "subject-selection",
      label: "Subject Selection",
      desc: "Choose your electives and optional subjects",
      illustration: onboardingImages["onboarding-campus"],
      path: "/console/academics/subject-selection",
    },
    {
      id: "registration",
      label: affiliationLabel ? `${affiliationLabel} Registration` : "Registration",
      desc: "Complete your affiliation registration",
      illustration: onboardingImages["onboarding-login"],
      path: "/console/academics/adm-registration",
    },
    {
      id: "exam-form",
      label: "Exam Form Fillup",
      desc: "Fill and upload your examination form",
      illustration: onboardingImages["onboarding-exams"],
      path: "/console/academics/cu-exam-form-upload",
    },
  ];

  const tabs: { key: TabKey; label: string }[] = [
    { key: "activities", label: "Activities" },
    { key: "subjects", label: "Subjects" },
  ];

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={{ color: theme.text }} className="text-2xl font-bold mb-1">
        Academics
      </Text>
      <Text style={{ color: theme.text, opacity: 0.65 }} className="text-sm mb-4">
        {semesterName ? `${semesterName} · ` : ""}Activities, subjects and exam forms
      </Text>

      {/* Segmented control */}
      <View className="flex-row rounded-xl p-1 mb-5" style={{ backgroundColor: segBg }}>
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              className="flex-1 py-2 rounded-lg items-center"
              style={{ backgroundColor: active ? (isDark ? "#4338ca" : "#ffffff") : "transparent" }}
            >
              <Text
                style={{
                  color: active ? (isDark ? "#ffffff" : accent) : theme.text,
                  opacity: active ? 1 : 0.6,
                  fontWeight: active ? "700" : "500",
                  fontSize: 14,
                }}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {tab === "activities" ? (
        <View className="gap-3">
          {activityCards.map((card) => (
            <Pressable
              key={card.id}
              onPress={() => router.push(card.path as any)}
              className="flex-row items-center rounded-2xl p-3.5"
              style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
            >
              <View
                className="rounded-xl items-center justify-center mr-3"
                style={{
                  width: 56,
                  height: 56,
                  backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
                }}
              >
                <Image
                  source={card.illustration}
                  style={{ width: 44, height: 44 }}
                  contentFit="contain"
                />
              </View>
              <View className="flex-1">
                <Text style={{ color: theme.text }} className="text-base font-semibold">
                  {card.label}
                </Text>
                <Text style={{ color: theme.text, opacity: 0.6 }} className="text-xs mt-0.5">
                  {card.desc}
                </Text>
              </View>
              <ChevronRight size={20} color={theme.text} style={{ opacity: 0.4 }} />
            </Pressable>
          ))}
        </View>
      ) : (
        <View className="gap-3">
          {MOCK_SUBJECTS.map((sub) => (
            <Pressable
              key={sub.id}
              onPress={() =>
                router.push({
                  pathname: "/console/academics/subject/[id]",
                  params: { id: sub.id, name: sub.name, type: sub.type },
                } as any)
              }
              className="flex-row items-center rounded-2xl p-4"
              style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
            >
              <View
                className="rounded-xl items-center justify-center mr-3"
                style={{
                  width: 44,
                  height: 44,
                  backgroundColor: isDark ? "rgba(99,102,241,0.2)" : "rgba(79,70,229,0.1)",
                }}
              >
                <Text style={{ color: accent, fontWeight: "800", fontSize: 15 }}>
                  {sub.name.charAt(0)}
                </Text>
              </View>
              <View className="flex-1">
                <Text style={{ color: theme.text }} className="text-base font-semibold">
                  {sub.name}
                </Text>
                <Text style={{ color: theme.text, opacity: 0.6 }} className="text-xs mt-0.5">
                  {sub.code} · {sub.type}
                </Text>
              </View>
              <ChevronRight size={20} color={theme.text} style={{ opacity: 0.4 }} />
            </Pressable>
          ))}
          <Text style={{ color: theme.text, opacity: 0.4 }} className="text-xs text-center mt-2">
            Subjects shown are samples — will list your semester subjects
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
