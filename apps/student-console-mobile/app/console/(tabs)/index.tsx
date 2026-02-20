import { useAuth } from "@/providers/auth-provider";
import { useTheme } from "@/hooks/use-theme";
import type { StudentDto } from "@repo/db/dtos/user";
import {
  Calendar,
  CalendarCheck,
  FileEdit,
  Megaphone,
  PartyPopper,
  BookOpen,
  FileSearch,
  ChevronRight,
  X,
  IndianRupee,
  Library,
  Upload,
  ClipboardList,
  ListChecks,
  Coffee,
  Wrench,
  type LucideIcon,
} from "lucide-react-native";
import React, { useState } from "react";
import { Dimensions, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";

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

const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: "1",
    type: "exam",
    title: "Exam",
    subtitle: "Maths - Tomorrow",
    timeLabel: "Due",
    iconBg: STORY_ICON_BGS.indigo,
    icon: CalendarCheck,
    path: "/console/exams",
    detail: "Internal examination for Mathematics is scheduled for tomorrow. Please ensure you have your admit card.",
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
    detail: "College will remain closed on 15th Feb for maintenance. Classes will resume on 16th Feb.",
  },
  {
    id: "4",
    type: "fee",
    title: "Fee Due",
    subtitle: "Semester 4",
    timeLabel: "Action",
    iconBg: STORY_ICON_BGS.teal,
    icon: IndianRupee,
    path: "/console/fees",
    detail: "Your semester 4 fee payment is pending. Please complete the payment at the earliest.",
  },
  {
    id: "5",
    type: "library",
    title: "Books",
    subtitle: "2 due",
    timeLabel: "Reminder",
    iconBg: STORY_ICON_BGS.rose,
    icon: Library,
    path: "/console/library",
    detail: "You have 2 library books due for return. Kindly return them to avoid late fees.",
  },
  {
    id: "6",
    type: "event",
    title: "Tech Fest",
    subtitle: "Reg. open",
    timeLabel: "New",
    iconBg: STORY_ICON_BGS.violet,
    icon: PartyPopper,
    path: "/console/events",
    detail: "Annual Tech Fest registration is now open. Last date to register: 20th Feb.",
  },
  {
    id: "7",
    type: "class",
    title: "10 AM",
    subtitle: "Room 201",
    timeLabel: "Today",
    iconBg: STORY_ICON_BGS.purple,
    icon: Calendar,
    path: "/console/academics",
    detail: "Your next class is at 10:00 AM in Room 201. Subject: Business Economics.",
  },
];

// Quick actions - ONLY items NOT in bottom nav (Study Notes, Fees, Exams, Library are in tabs)
const QUICK_ACTIONS = [
  { id: "attendance", label: "Attendance", icon: CalendarCheck, path: "/console/academics/current-status" },
  { id: "timetable", label: "Timetable", icon: Calendar, path: "/console/academics" },
  { id: "cu-exam-form", label: "CU Exam Form Upload", icon: Upload, path: "/console/academics/cu-exam-form-upload" },
  { id: "cu-registration", label: "Adm. Reg", icon: ClipboardList, path: "/console/academics/adm-registration" },
  {
    id: "subject-selection",
    label: "Subject Selection",
    icon: ListChecks,
    path: "/console/academics/subject-selection",
  },
  { id: "requests", label: "Requests", icon: FileSearch, path: "/console/service-requests" },
  { id: "notifications", label: "Notifications", icon: Megaphone, path: "/console/notifications" },
  { id: "events", label: "Events", icon: PartyPopper, path: "/console/events" },
  { id: "documents", label: "Documents", icon: FileEdit, path: "/console/documents" },
];

// Recent updates - different from activities (full list view)
const MOCK_UPDATES = [
  { id: "1", icon: CalendarCheck, iconBg: "#6366f1", title: "Internal Exam Schedule Announced", time: "Just Now" },
  { id: "2", icon: FileEdit, iconBg: "#3b82f6", title: "Assignment Due Tomorrow: Marketing", time: "30 mins ago" },
  { id: "3", icon: BookOpen, iconBg: "#f43f5e", title: "Library Book Return Reminder", time: "1 hour ago" },
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
  { id: "8", time: "14:30", endTime: "15:30", title: "English", subtitle: "Room 204", type: "class", icon: BookOpen },
];

export default function ConsoleScreen() {
  const { theme, colorScheme } = useTheme();
  const { user } = useAuth();
  const student = user?.payload as StudentDto | undefined;
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const firstName = user?.name?.split(" ")[0] || "Student";
  const programName = student?.currentPromotion?.programCourse?.name || student?.programCourse?.course?.name || "—";
  const sectionName = student?.currentPromotion?.section?.name || "—";
  const sessionName = student?.currentPromotion?.session?.name || "";
  const semesterLabel = sessionName ? `Semester ${sessionName.replace(/\D/g, "") || "—"}` : "—";
  const academicSubtitle = [semesterLabel, programName, sectionName].filter(Boolean).join(" • ");

  const isDark = colorScheme === "dark";
  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  const handleActivityPress = (item: ActivityItem) => {
    setSelectedActivity(item);
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
      contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
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
        {MOCK_ACTIVITIES.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => handleActivityPress(item)}
            className="items-center mr-3"
            style={{ width: STORY_ITEM_WIDTH }}
          >
            {/* Story circle - subtle ring */}
            <View
              className="rounded-full mb-1.5 items-center justify-center"
              style={{
                width: STORY_SIZE + 4,
                height: STORY_SIZE + 4,
                padding: 2,
                backgroundColor: isDark ? "rgba(99,102,241,0.25)" : "rgba(79,70,229,0.15)",
              }}
            >
              <View
                className="rounded-full items-center justify-center overflow-hidden"
                style={{
                  width: STORY_SIZE,
                  height: STORY_SIZE,
                  backgroundColor: theme.background,
                }}
              >
                <View
                  className="w-11 h-11 rounded-full items-center justify-center"
                  style={{ backgroundColor: item.iconBg }}
                >
                  {(() => {
                    const Icon = item.icon;
                    return <Icon size={22} color="#ffffff" />;
                  })()}
                </View>
              </View>
            </View>
            <Text
              numberOfLines={2}
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
        ))}
      </ScrollView>

      {/* Quick Actions - no overlap with bottom nav */}
      <Text style={{ color: theme.text }} className="text-lg font-bold mb-3">
        Quick Actions
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-6">
        {QUICK_ACTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <Pressable
              key={item.id}
              onPress={() => router.push(item.path as any)}
              className="rounded-lg p-3"
              style={{
                width: "31%",
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
              <Icon size={22} color={isDark ? "#a5b4fc" : "#4f46e5"} />
              <Text
                numberOfLines={2}
                style={{ color: theme.text, fontSize: 11, marginTop: 6, fontWeight: "500", textAlign: "center" }}
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
              onPress={() => router.push("/console/notifications")}
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
                <Text numberOfLines={1} style={{ color: theme.text, fontSize: 14, fontWeight: "500" }}>
                  {item.title}
                </Text>
                <Text style={{ color: theme.text, opacity: 0.55, fontSize: 12, marginTop: 1 }}>{item.time}</Text>
              </View>
              <ChevronRight size={18} color={theme.text} style={{ opacity: 0.5 }} />
            </Pressable>
          );
        })}
      </View>

      {/* Today's Schedule Modal */}
      <Modal
        visible={showScheduleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onPress={() => setShowScheduleModal(false)}
        >
          <Pressable
            className="rounded-t-2xl mx-2 overflow-hidden"
            style={{
              backgroundColor: theme.background,
              maxHeight: Dimensions.get("window").height * 0.85,
              height: Dimensions.get("window").height * 0.85,
              flexDirection: "column",
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="p-4 border-b" style={{ borderColor: cardBorder }}>
              <View className="flex-row items-center justify-between">
                <Text style={{ color: theme.text }} className="text-lg font-bold">
                  Today's Schedule
                </Text>
                <Pressable onPress={() => setShowScheduleModal(false)} className="p-2 -mr-2">
                  <X size={24} color={theme.text} />
                </Pressable>
              </View>
              <Text style={{ color: theme.text, opacity: 0.7 }} className="text-sm mt-1">
                {getTodayDateFormatted()}
              </Text>
            </View>
            <ScrollView
              style={{ flex: 1, minHeight: 0 }}
              contentContainerStyle={{ paddingBottom: 8 }}
              showsVerticalScrollIndicator={true}
            >
              {MOCK_TODAY_SCHEDULE.map((item, index) => {
                const Icon = item.icon;
                const isBreak = item.type === "break" || item.type === "lunch";
                const isWorkshop = item.type === "workshop";
                return (
                  <View
                    key={item.id}
                    className="flex-row items-center py-3"
                    style={{
                      paddingHorizontal: 16,
                      borderBottomWidth: index < MOCK_TODAY_SCHEDULE.length - 1 ? 1 : 0,
                      borderBottomColor: cardBorder,
                      backgroundColor: isBreak
                        ? isDark
                          ? "rgba(255,255,255,0.03)"
                          : "rgba(0,0,0,0.02)"
                        : "transparent",
                    }}
                  >
                    <View
                      style={{
                        width: 88,
                        paddingRight: 12,
                        borderRightWidth: 2,
                        borderRightColor: isDark ? "#6366f1" : "#4f46e5",
                      }}
                    >
                      <Text style={{ color: theme.text, fontSize: 12, fontWeight: "600" }}>
                        {formatTime12h(item.time)}
                      </Text>
                      {item.endTime && (
                        <Text style={{ color: theme.text, fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                          {formatTime12h(item.endTime)}
                        </Text>
                      )}
                    </View>
                    <View className="flex-1 flex-row items-center" style={{ marginLeft: 16, minWidth: 0 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 12,
                          backgroundColor: isBreak
                            ? isDark
                              ? "rgba(245,158,11,0.3)"
                              : "rgba(245,158,11,0.2)"
                            : isWorkshop
                              ? isDark
                                ? "rgba(34,197,94,0.3)"
                                : "rgba(34,197,94,0.2)"
                              : isDark
                                ? "rgba(99,102,241,0.25)"
                                : "rgba(79,70,229,0.15)",
                        }}
                      >
                        <Icon
                          size={18}
                          color={isBreak ? "#f59e0b" : isWorkshop ? "#22c55e" : isDark ? "#a5b4fc" : "#4f46e5"}
                        />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ color: theme.text, fontSize: 14, fontWeight: "500" }}>{item.title}</Text>
                        {item.subtitle && (
                          <Text style={{ color: theme.text, opacity: 0.65, fontSize: 12, marginTop: 1 }}>
                            {item.subtitle}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            <Pressable
              onPress={() => {
                setShowScheduleModal(false);
                router.push("/console/academics");
              }}
              className="m-4 py-3 rounded-xl items-center"
              style={{ backgroundColor: isDark ? "#6366f1" : "#4f46e5" }}
            >
              <Text className="text-white font-semibold">View Full Timetable</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Activity Detail Modal */}
      <Modal
        visible={!!selectedActivity}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedActivity(null)}
      >
        <Pressable className="flex-1 justify-end bg-black/50" onPress={() => setSelectedActivity(null)}>
          <Pressable
            className="rounded-t-2xl p-5 pb-8"
            style={{ backgroundColor: theme.background }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-1">
                <Text style={{ color: theme.text }} className="text-lg font-bold">
                  {selectedActivity?.title}
                </Text>
                {selectedActivity?.subtitle && (
                  <Text style={{ color: theme.text, opacity: 0.7 }} className="text-sm mt-0.5">
                    {selectedActivity.subtitle}
                  </Text>
                )}
              </View>
              <Pressable onPress={() => setSelectedActivity(null)} className="p-2 -mr-2">
                <X size={24} color={theme.text} />
              </Pressable>
            </View>
            <Text style={{ color: theme.text, opacity: 0.85 }} className="text-base leading-6 mb-4">
              {selectedActivity?.detail || "No additional details available."}
            </Text>
            {selectedActivity?.path && (
              <Pressable
                onPress={handleActivityView}
                className="py-3 rounded-xl items-center"
                style={{ backgroundColor: isDark ? "#6366f1" : "#4f46e5" }}
              >
                <Text className="text-white font-semibold">View Details</Text>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
