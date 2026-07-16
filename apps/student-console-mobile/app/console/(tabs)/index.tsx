import { useAuth } from "@/providers/auth-provider";
import { useTheme } from "@/hooks/use-theme";
import type { StudentDto } from "@repo/db/dtos/user";
import {
  Calendar,
  CalendarCheck,
  ClipboardList,
  FileEdit,
  ListChecks,
  Megaphone,
  PartyPopper,
  BookOpen,
  ChevronRight,
  Upload,
  X,
  Coffee,
  Wrench,
  type LucideIcon,
} from "lucide-react-native";
import React, { useState } from "react";
import { Dimensions, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Dialog } from "@/components/ui/Dialog";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { toSentenceCase } from "@/lib/text";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function formatTime12h(time24: string): string {
  const [hours, mins] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  return `${h}:${mins.toString().padStart(2, "0")} ${period}`;
}

const tableHead = (color: string) =>
  ({ color, opacity: 0.5, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }) as const;

function getTodayDateFormatted(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Activity/reminder items - like Instagram stories. Replace with API data later.
type ActivityType = "exam" | "assignment" | "notice" | "fee" | "library" | "event" | "class";

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  subtitle?: string;
  timeLabel: string;
  iconBg: string;
  icon: LucideIcon;
  path?: string;
  detail?: string;
}

// Bright, vibrant palette for story icons
const STORY_ICON_BGS = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  purple: "#a855f7",
  blue: "#3b82f6",
  teal: "#14b8a6",
  amber: "#f59e0b",
  rose: "#f43f5e",
};

// "For You" surfaces time-sensitive items that AREN'T bottom-tab destinations
// (Exams/Fees/Library live in the tab bar, so they're intentionally omitted here
// to avoid duplicate entry points). Replace with API data later.
const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: "1",
    type: "class",
    title: "10 AM",
    subtitle: "Room 201",
    timeLabel: "Today",
    iconBg: STORY_ICON_BGS.purple,
    icon: Calendar,
    path: "/console/academics",
    detail: "Your next class is at 10:00 AM in Room 201. Subject: Business Economics.",
  },
  {
    id: "2",
    type: "assignment",
    title: "Marketing",
    subtitle: "Due tomorrow",
    timeLabel: "Due",
    iconBg: STORY_ICON_BGS.blue,
    icon: FileEdit,
    path: "/console/documents",
    detail: "Marketing assignment submission is due tomorrow. Please submit before 11:59 PM.",
  },
  {
    id: "3",
    type: "notice",
    title: "Holiday",
    subtitle: "College closed",
    timeLabel: "New",
    iconBg: STORY_ICON_BGS.amber,
    icon: Megaphone,
    path: "/console/notifications",
    detail:
      "College will remain closed on 15th Feb for maintenance. Classes will resume on 16th Feb.",
  },
  {
    id: "4",
    type: "event",
    title: "Tech Fest",
    subtitle: "Reg. open",
    timeLabel: "New",
    iconBg: STORY_ICON_BGS.violet,
    icon: PartyPopper,
    path: "/console/events",
    detail: "Annual Tech Fest registration is now open. Last date to register: 20th Feb.",
  },
];

// Quick actions are the academic shortcuts, each opening a nested screen under
// /console/academics. They're built per-student in the component because the
// registration label uses the student's affiliation name. Requests /
// Notifications / Events are omitted here — they live in the sidebar.

// Recent updates - different from activities (full list view)
const MOCK_UPDATES = [
  {
    id: "1",
    icon: CalendarCheck,
    iconBg: "#6366f1",
    title: "Internal Exam Schedule Announced",
    time: "Just Now",
    path: "/console/exams",
  },
  {
    id: "2",
    icon: FileEdit,
    iconBg: "#3b82f6",
    title: "Assignment Due Tomorrow: Marketing",
    time: "30 mins ago",
    path: "/console/documents",
  },
  {
    id: "3",
    icon: BookOpen,
    iconBg: "#f43f5e",
    title: "Library Book Return Reminder",
    time: "1 hour ago",
    path: "/console/library",
  },
];

const STORY_SIZE = 52;
const STORY_ITEM_WIDTH = 68;

// Mock today's schedule - replace with API data later
type ScheduleItemType = "class" | "break" | "workshop" | "lunch";
interface ScheduleItem {
  id: string;
  time: string;
  endTime?: string;
  title: string;
  subtitle?: string;
  type: ScheduleItemType;
  icon: LucideIcon;
}

const MOCK_TODAY_SCHEDULE: ScheduleItem[] = [
  {
    id: "1",
    time: "09:00",
    endTime: "10:00",
    title: "Mathematics",
    subtitle: "Room 201",
    type: "class",
    icon: BookOpen,
  },
  { id: "2", time: "10:00", endTime: "10:15", title: "Short Break", type: "break", icon: Coffee },
  {
    id: "3",
    time: "10:15",
    endTime: "11:15",
    title: "Business Economics",
    subtitle: "Room 105",
    type: "class",
    icon: BookOpen,
  },
  { id: "4", time: "11:15", endTime: "11:30", title: "Short Break", type: "break", icon: Coffee },
  {
    id: "5",
    time: "11:30",
    endTime: "12:30",
    title: "Statistics",
    subtitle: "Room 302",
    type: "class",
    icon: BookOpen,
  },
  { id: "6", time: "12:30", endTime: "13:30", title: "Lunch Break", type: "lunch", icon: Coffee },
  {
    id: "7",
    time: "13:30",
    endTime: "14:30",
    title: "Programming Lab",
    subtitle: "Lab 1",
    type: "workshop",
    icon: Wrench,
  },
  {
    id: "8",
    time: "14:30",
    endTime: "15:30",
    title: "English",
    subtitle: "Room 204",
    type: "class",
    icon: BookOpen,
  },
];

export default function ConsoleScreen() {
  const { theme, colorScheme } = useTheme();
  const { user } = useAuth();
  const student = user?.payload as StudentDto | undefined;
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [seenActivities, setSeenActivities] = useState<Set<string>>(new Set());

  const firstName = user?.name?.split(" ")[0] || "Student";
  const promo = student?.currentPromotion;
  const semesterName = toSentenceCase(promo?.class?.name || "");
  // Prefer a nested academicYear.year if the payload includes it; else the session label.
  const academicYearName =
    (promo?.session as { academicYear?: { year?: string } } | undefined)?.academicYear?.year ||
    promo?.session?.name ||
    "";
  const sectionName = promo?.section?.name || "";
  const academicSubtitle = [semesterName, academicYearName, sectionName]
    .filter(Boolean)
    .join(" • ");

  const affiliation =
    student?.programCourse?.affiliation ?? student?.currentPromotion?.programCourse?.affiliation;
  const affiliationLabel = affiliation?.shortName || affiliation?.name;
  const registrationLabel = affiliationLabel ? `${affiliationLabel} Registration` : "Registration";

  const quickActions = [
    {
      id: "attendance",
      label: "Attendance",
      icon: CalendarCheck,
      path: "/console/academics/current-status",
    },
    {
      id: "subject-selection",
      label: "Subject Selection",
      icon: ListChecks,
      path: "/console/academics/subject-selection",
    },
    {
      id: "registration",
      label: registrationLabel,
      icon: ClipboardList,
      path: "/console/academics/adm-registration",
    },
    {
      id: "exam-form",
      label: "Exam Form Fillup",
      icon: Upload,
      path: "/console/academics/cu-exam-form-upload",
    },
  ];

  const isDark = colorScheme === "dark";
  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  const handleActivityPress = (item: ActivityItem) => {
    setSelectedActivity(item);
    setSeenActivities((prev) => {
      const next = new Set(prev);
      next.add(item.id);
      return next;
    });
  };

  const handleActivityView = () => {
    if (selectedActivity?.path) {
      setSelectedActivity(null);
      router.push(selectedActivity.path as any);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header: Greeting + Academic Details */}
      <View className="mb-6">
        <Text style={{ color: theme.text }} className="text-2xl font-bold">
          {getGreeting()}, {firstName}
        </Text>
        <Text style={{ color: theme.text, opacity: 0.65 }} className="text-sm mt-0.5">
          {academicSubtitle}
        </Text>
      </View>

      {/* Instagram Stories-like: Activities / Reminders */}
      <Text style={{ color: theme.text }} className="text-base font-semibold mb-3">
        For You
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 12, marginBottom: 24 }}
        className="-mx-4 px-4"
      >
        {MOCK_ACTIVITIES.map((item) => {
          const Icon = item.icon;
          const seen = seenActivities.has(item.id);
          return (
            <Pressable
              key={item.id}
              onPress={() => handleActivityPress(item)}
              className="items-center mr-3"
              style={{ width: STORY_ITEM_WIDTH }}
            >
              {/* Story ring: coloured until seen, then muted grey */}
              <View
                className="rounded-full mb-1.5 items-center justify-center"
                style={{
                  width: STORY_SIZE + 6,
                  height: STORY_SIZE + 6,
                  padding: 2.5,
                  backgroundColor: seen
                    ? isDark
                      ? "rgba(255,255,255,0.16)"
                      : "#d8dee9"
                    : isDark
                      ? "#818cf8"
                      : "#4f46e5",
                }}
              >
                <View
                  className="rounded-full items-center justify-center overflow-hidden"
                  style={{
                    width: STORY_SIZE,
                    height: STORY_SIZE,
                    backgroundColor: theme.background,
                    padding: 2,
                  }}
                >
                  <View
                    className="rounded-full items-center justify-center"
                    style={{ width: "100%", height: "100%", backgroundColor: item.iconBg }}
                  >
                    <Icon size={22} color="#ffffff" />
                  </View>
                </View>
              </View>
              <Text
                numberOfLines={1}
                style={{
                  color: theme.text,
                  fontSize: 12,
                  textAlign: "center",
                  minWidth: STORY_ITEM_WIDTH,
                }}
              >
                {item.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Today's Schedule Card */}
      <Pressable
        onPress={() => setShowScheduleModal(true)}
        className="flex-row items-center rounded-xl p-3 mb-6"
        style={{
          backgroundColor: cardBg,
          borderWidth: 1,
          borderColor: cardBorder,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0 : 0.05,
          shadowRadius: 3,
          elevation: 2,
        }}
      >
        <View
          className="w-10 h-10 rounded-lg items-center justify-center mr-3"
          style={{ backgroundColor: isDark ? "rgba(139,92,246,0.25)" : "rgba(139,92,246,0.15)" }}
        >
          <Calendar size={20} color={isDark ? "#a78bfa" : "#7c3aed"} />
        </View>
        <View className="flex-1">
          <Text style={{ color: theme.text }} className="text-base font-semibold">
            Today's Schedule
          </Text>
          <Text style={{ color: theme.text, opacity: 0.65 }} className="text-sm mt-0.5">
            View your classes for today
          </Text>
        </View>
        <Pressable
          onPress={() => setShowScheduleModal(true)}
          className="px-4 py-2 rounded-lg"
          style={{ backgroundColor: isDark ? "#6366f1" : "#4f46e5" }}
        >
          <Text className="text-white font-semibold text-sm">VIEW</Text>
        </Pressable>
      </Pressable>

      {/* Quick Actions - academic shortcuts (all live under /console/academics) */}
      <Text style={{ color: theme.text }} className="text-lg font-bold mb-3">
        Quick Actions
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-6" style={{ justifyContent: "space-between" }}>
        {quickActions.map((item) => {
          const Icon = item.icon;
          return (
            <Pressable
              key={item.id}
              onPress={() => router.push(item.path as any)}
              className="rounded-xl p-3.5"
              style={{
                width: "48.5%",
                backgroundColor: cardBg,
                borderWidth: 1,
                borderColor: cardBorder,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isDark ? 0 : 0.04,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <View
                className="w-9 h-9 rounded-lg items-center justify-center mb-2"
                style={{ backgroundColor: isDark ? "rgba(99,102,241,0.2)" : "rgba(79,70,229,0.1)" }}
              >
                <Icon size={20} color={isDark ? "#a5b4fc" : "#4f46e5"} />
              </View>
              <Text
                numberOfLines={2}
                style={{ color: theme.text, fontSize: 12.5, fontWeight: "600" }}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Recent Updates */}
      <Text style={{ color: theme.text }} className="text-lg font-bold mb-3">
        Recent Updates
      </Text>
      <View
        className="rounded-xl overflow-hidden mb-6"
        style={{
          backgroundColor: cardBg,
          borderWidth: 1,
          borderColor: cardBorder,
        }}
      >
        {MOCK_UPDATES.map((item, index) => {
          const Icon = item.icon;
          return (
            <Pressable
              key={item.id}
              onPress={() => router.push(item.path as any)}
              className="flex-row items-center p-3"
              style={{
                borderBottomWidth: index < MOCK_UPDATES.length - 1 ? 1 : 0,
                borderBottomColor: cardBorder,
              }}
            >
              <View
                className="w-9 h-9 rounded-full items-center justify-center mr-2.5"
                style={{ backgroundColor: item.iconBg }}
              >
                <Icon size={18} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text
                  numberOfLines={1}
                  style={{ color: theme.text, fontSize: 14, fontWeight: "500" }}
                >
                  {item.title}
                </Text>
                <Text style={{ color: theme.text, opacity: 0.55, fontSize: 12, marginTop: 1 }}>
                  {item.time}
                </Text>
              </View>
              <ChevronRight size={18} color={theme.text} style={{ opacity: 0.5 }} />
            </Pressable>
          );
        })}
      </View>

      {/* Today's Schedule - bottom drawer, tabular */}
      <BottomSheet
        visible={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        bg={theme.background}
      >
        <View className="px-5 pb-3">
          <View className="flex-row items-center justify-between">
            <Text style={{ color: theme.text }} className="text-lg font-bold">
              Today's Schedule
            </Text>
            <Pressable onPress={() => setShowScheduleModal(false)} className="p-2 -mr-2">
              <X size={22} color={theme.text} />
            </Pressable>
          </View>
          <Text style={{ color: theme.text, opacity: 0.7 }} className="text-sm mt-0.5">
            {getTodayDateFormatted()}
          </Text>
        </View>

        {/* Table header */}
        <View
          className="flex-row px-5 pb-2"
          style={{ borderBottomWidth: 1, borderBottomColor: cardBorder }}
        >
          <Text style={{ width: 74, ...tableHead(theme.text) }}>TIME</Text>
          <Text style={{ flex: 1, ...tableHead(theme.text) }}>CLASS</Text>
          <Text style={{ width: 60, textAlign: "right", ...tableHead(theme.text) }}>ROOM</Text>
        </View>

        <ScrollView
          style={{ maxHeight: Dimensions.get("window").height * 0.5 }}
          contentContainerStyle={{ paddingBottom: 4 }}
          showsVerticalScrollIndicator
        >
          {MOCK_TODAY_SCHEDULE.map((item, index) => {
            const isBreak = item.type === "break" || item.type === "lunch";
            const accent = isBreak
              ? "#f59e0b"
              : item.type === "workshop"
                ? "#22c55e"
                : isDark
                  ? "#818cf8"
                  : "#4f46e5";
            return (
              <View
                key={item.id}
                className="flex-row items-center px-5 py-3"
                style={{
                  borderBottomWidth: index < MOCK_TODAY_SCHEDULE.length - 1 ? 1 : 0,
                  borderBottomColor: cardBorder,
                  backgroundColor: isBreak
                    ? isDark
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(0,0,0,0.02)"
                    : "transparent",
                }}
              >
                <View style={{ width: 74 }}>
                  <Text style={{ color: theme.text, fontSize: 12.5, fontWeight: "700" }}>
                    {formatTime12h(item.time)}
                  </Text>
                  {item.endTime && (
                    <Text style={{ color: theme.text, fontSize: 11, opacity: 0.55, marginTop: 1 }}>
                      {formatTime12h(item.endTime)}
                    </Text>
                  )}
                </View>
                <View className="flex-row items-center" style={{ flex: 1, paddingRight: 8 }}>
                  <View
                    style={{
                      width: 4,
                      height: 22,
                      borderRadius: 2,
                      backgroundColor: accent,
                      marginRight: 10,
                    }}
                  />
                  <Text
                    numberOfLines={1}
                    style={{
                      color: theme.text,
                      fontSize: 14,
                      fontWeight: isBreak ? "500" : "600",
                      opacity: isBreak ? 0.7 : 1,
                      flex: 1,
                    }}
                  >
                    {item.title}
                  </Text>
                </View>
                <Text
                  numberOfLines={1}
                  style={{
                    width: 60,
                    textAlign: "right",
                    color: theme.text,
                    opacity: 0.6,
                    fontSize: 12,
                  }}
                >
                  {item.subtitle || "—"}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        <Pressable
          onPress={() => {
            setShowScheduleModal(false);
            router.push("/console/academics");
          }}
          className="mx-5 mt-3 py-3 rounded-xl items-center"
          style={{ backgroundColor: isDark ? "#6366f1" : "#4f46e5" }}
        >
          <Text className="text-white font-semibold">View Full Timetable</Text>
        </Pressable>
      </BottomSheet>

      {/* Activity Detail Dialog */}
      <Dialog
        visible={!!selectedActivity}
        onClose={() => setSelectedActivity(null)}
        bg={theme.background}
      >
        {selectedActivity && (
          <View className="p-5">
            <Pressable
              onPress={() => setSelectedActivity(null)}
              className="absolute p-2"
              style={{ top: 8, right: 8, zIndex: 2 }}
            >
              <X size={20} color={theme.text} />
            </Pressable>

            {/* Icon + title */}
            <View className="items-center mb-4" style={{ paddingTop: 4 }}>
              <View
                className="items-center justify-center mb-3"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  backgroundColor: selectedActivity.iconBg,
                }}
              >
                {(() => {
                  const Icon = selectedActivity.icon;
                  return <Icon size={26} color="#ffffff" />;
                })()}
              </View>
              <Text style={{ color: theme.text }} className="text-lg font-bold text-center">
                {selectedActivity.title}
              </Text>
              {selectedActivity.subtitle && (
                <Text
                  style={{ color: theme.text, opacity: 0.7 }}
                  className="text-sm mt-0.5 text-center"
                >
                  {selectedActivity.subtitle}
                </Text>
              )}
            </View>

            {/* Detail card with eyebrow */}
            <View
              className="rounded-xl p-4 mb-4"
              style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
            >
              <View className="flex-row items-center mb-1.5">
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: selectedActivity.iconBg,
                    marginRight: 7,
                  }}
                />
                <Text
                  style={{
                    color: theme.text,
                    opacity: 0.55,
                    fontSize: 11,
                    fontWeight: "700",
                    letterSpacing: 0.5,
                  }}
                >
                  {(selectedActivity.timeLabel || "Details").toUpperCase()}
                </Text>
              </View>
              <Text style={{ color: theme.text, opacity: 0.9, fontSize: 15, lineHeight: 22 }}>
                {selectedActivity.detail || "No additional details available."}
              </Text>
            </View>

            {selectedActivity.path && (
              <Pressable
                onPress={handleActivityView}
                className="py-3 rounded-xl items-center"
                style={{ backgroundColor: isDark ? "#6366f1" : "#4f46e5" }}
              >
                <Text className="text-white font-semibold">View Details</Text>
              </Pressable>
            )}
          </View>
        )}
      </Dialog>
    </ScrollView>
  );
}
