import admitCardImg from "@/assets/illustrations/academics/admit-card.jpg";
import attendanceImg from "@/assets/illustrations/academics/attendance.jpg";
import cuRegistrationImg from "@/assets/illustrations/academics/cu-registration.jpg";
import examFormImg from "@/assets/illustrations/academics/exam-form.jpg";
import notesImg from "@/assets/illustrations/academics/notes.jpg";
import statusImg from "@/assets/illustrations/academics/status.jpg";
import subjectSelectionImg from "@/assets/illustrations/academics/subject-selection.jpg";
import timetableImg from "@/assets/illustrations/academics/timetable.jpg";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import type { StudentDto } from "@repo/db/dtos/user";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ChevronRight, FolderClosed, LayoutGrid } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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
    {
      id: "admit-card",
      label: "Collect Admit Card",
      desc: "Download your exam admit card",
      img: admitCardImg,
      path: "/console/academics/admit-card",
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

  const tabItems: TabItem<TabKey>[] = [
    { id: "activities", label: "Activities", icon: LayoutGrid },
    { id: "records", label: "Records", icon: FolderClosed },
  ];

  const cards = tab === "activities" ? activityCards : recordCards;

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="mb-5">
        <Tabs tabs={tabItems} value={tab} onChange={setTab} />
      </View>

      <View style={{ gap: 12 }}>
        {cards.map((card) => (
          <Pressable
            key={card.id}
            onPress={() => router.push(card.path as any)}
            style={{
              flexDirection: "row",
              alignItems: "stretch",
              borderRadius: 16,
              overflow: "hidden",
              backgroundColor: cardBg,
              borderWidth: 1,
              borderColor: cardBorder,
            }}
          >
            {/* Left: image, flush, no padding. The image MUST be absolutely
                positioned: with height "100%" it feeds its intrinsic size
                (740x692 jpg) into the row-height calculation — stretch sizes
                the column FROM the row while the image sizes the row FROM the
                column, and Yoga resolves that cycle by using the image's
                natural height, blowing the card up to ~700px tall. absoluteFill
                contributes zero intrinsic size, so row height comes purely
                from the text column. */}
            <View style={{ width: 96, backgroundColor: "#ffffff" }}>
              <Image source={card.img} style={StyleSheet.absoluteFill} contentFit="cover" />
            </View>
            {/* Right: label + description */}
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                paddingVertical: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600" }}>
                  {card.label}
                </Text>
                <Text style={{ color: theme.text, opacity: 0.6, fontSize: 12, marginTop: 2 }}>
                  {card.desc}
                </Text>
              </View>
              <ChevronRight size={20} color={theme.text} style={{ opacity: 0.4 }} />
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
