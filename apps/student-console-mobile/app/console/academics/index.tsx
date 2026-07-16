import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import type { StudentDto } from "@repo/db/dtos/user";
import { router } from "expo-router";
import {
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  ListChecks,
  Upload,
  type LucideIcon,
} from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

type AcademicCard = {
  id: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  path: string;
};

export default function AcademicsScreen() {
  const { theme, colorScheme } = useTheme();
  const { user } = useAuth();
  const student = user?.payload as StudentDto | undefined;

  const isDark = colorScheme === "dark";
  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const accent = isDark ? "#a5b4fc" : "#4f46e5";
  const accentBg = isDark ? "rgba(99,102,241,0.2)" : "rgba(79,70,229,0.1)";

  const affiliation =
    student?.programCourse?.affiliation ?? student?.currentPromotion?.programCourse?.affiliation;
  const affiliationLabel = affiliation?.shortName || affiliation?.name;

  const cards: AcademicCard[] = [
    {
      id: "attendance",
      label: "Attendance",
      desc: "Your attendance and academic status",
      icon: CalendarCheck,
      path: "/console/academics/current-status",
    },
    {
      id: "subject-selection",
      label: "Subject Selection",
      desc: "Choose your electives and optional subjects",
      icon: ListChecks,
      path: "/console/academics/subject-selection",
    },
    {
      id: "registration",
      label: affiliationLabel ? `${affiliationLabel} Registration` : "Registration",
      desc: "Complete your affiliation registration",
      icon: ClipboardList,
      path: "/console/academics/adm-registration",
    },
    {
      id: "exam-form",
      label: "Exam Form Fillup",
      desc: "Fill and upload your examination form",
      icon: Upload,
      path: "/console/academics/cu-exam-form-upload",
    },
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
      <Text style={{ color: theme.text, opacity: 0.65 }} className="text-sm mb-5">
        Registration, subjects, attendance and exam forms
      </Text>

      <View className="gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Pressable
              key={card.id}
              onPress={() => router.push(card.path as any)}
              className="flex-row items-center rounded-xl p-4"
              style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
            >
              <View
                className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: accentBg }}
              >
                <Icon size={22} color={accent} />
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
          );
        })}
      </View>
    </ScrollView>
  );
}
