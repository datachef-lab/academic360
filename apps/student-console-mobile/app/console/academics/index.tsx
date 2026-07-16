import attendanceImg from "@/assets/illustrations/academics/attendance.jpg";
import cuRegistrationImg from "@/assets/illustrations/academics/cu-registration.jpg";
import examFormImg from "@/assets/illustrations/academics/exam-form.jpg";
import notesImg from "@/assets/illustrations/academics/notes.jpg";
import statusImg from "@/assets/illustrations/academics/status.jpg";
import subjectSelectionImg from "@/assets/illustrations/academics/subject-selection.jpg";
import timetableImg from "@/assets/illustrations/academics/timetable.jpg";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import type { StudentDto } from "@repo/db/dtos/user";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

type TabKey = "activities" | "records";
type Card = { id: string; label: string; desc: string; img: number; path: string };

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
  const affiliation = student?.programCourse?.affiliation ?? promo?.programCourse?.affiliation;
  const affiliationLabel = affiliation?.shortName || affiliation?.name;

  const activityCards: Card[] = [
    {
      id: "subject-selection",
      label: "Subject Selection",
      desc: "Choose your electives and optional subjects",
      img: subjectSelectionImg,
      path: "/console/academics/subject-selection",
    },
    {
      id: "registration",
      label: affiliationLabel ? `${affiliationLabel} Registration` : "Registration",
      desc: "Complete your affiliation registration",
      img: cuRegistrationImg,
      path: "/console/academics/adm-registration",
    },
    {
      id: "exam-form",
      label: "Exam Form Fillup",
      desc: "Fill and upload your examination form",
      img: examFormImg,
      path: "/console/academics/cu-exam-form-upload",
    },
  ];

  const recordCards: Card[] = [
    {
      id: "timetable",
      label: "Time Table",
      desc: "Your weekly class timetable",
      img: timetableImg,
      path: "/console/academics/timetable",
    },
    {
      id: "attendance",
      label: "Attendance",
      desc: "Your class attendance record",
      img: attendanceImg,
      path: "/console/academics/current-status",
    },
    {
      id: "status",
      label: "Current Academic Status",
      desc: "Track your semester and enrollment status",
      img: statusImg,
      path: "/console/academics/current-status",
    },
    {
      id: "notes",
      label: "Notes",
      desc: "Notes and assignments by subject paper",
      img: notesImg,
      path: "/console/academics/notes",
    },
  ];

  const tabs: { key: TabKey; label: string }[] = [
    { key: "activities", label: "Activities" },
    { key: "records", label: "Records" },
  ];

  const cards = tab === "activities" ? activityCards : recordCards;

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
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

      <View className="gap-3">
        {cards.map((card) => (
          <Pressable
            key={card.id}
            onPress={() => router.push(card.path as any)}
            className="flex-row items-center rounded-2xl p-3"
            style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
          >
            <View
              className="rounded-xl items-center justify-center mr-3 overflow-hidden"
              style={{ width: 80, height: 80, backgroundColor: "#ffffff" }}
            >
              <Image source={card.img} style={{ width: 78, height: 78 }} contentFit="contain" />
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
    </ScrollView>
  );
}
