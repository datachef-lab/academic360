import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { useTheme } from "@/hooks/use-theme";
import {
  Bell,
  BellRing,
  CalendarCheck,
  FileEdit,
  IndianRupee,
  Megaphone,
  type LucideIcon,
} from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";

type TabKey = "all" | "unread";

const NOTIFICATIONS: {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  icon: LucideIcon;
  tone: string;
}[] = [
  {
    id: "1",
    title: "Internal exam schedule announced",
    body: "Semester II internal exams begin 24 Jul. Check your timetable.",
    time: "Just now",
    unread: true,
    icon: CalendarCheck,
    tone: "#6366f1",
  },
  {
    id: "2",
    title: "Fee due reminder",
    body: "Your Semester II enrolment fee is due on 20 Jul.",
    time: "2 hours ago",
    unread: true,
    icon: IndianRupee,
    tone: "#14b8a6",
  },
  {
    id: "3",
    title: "Assignment due tomorrow",
    body: "Marketing assignment submission closes at 11:59 PM.",
    time: "5 hours ago",
    unread: true,
    icon: FileEdit,
    tone: "#3b82f6",
  },
  {
    id: "4",
    title: "College closed on 15 Aug",
    body: "Independence Day. Classes resume 16 Aug.",
    time: "Yesterday",
    unread: false,
    icon: Megaphone,
    tone: "#f59e0b",
  },
  {
    id: "5",
    title: "Library book return reminder",
    body: "2 books are due for return this week.",
    time: "2 days ago",
    unread: false,
    icon: Bell,
    tone: "#f43f5e",
  },
];

export default function NotificationsScreen() {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const [tab, setTab] = useState<TabKey>("all");

  const tabs: TabItem<TabKey>[] = [
    { id: "all", label: "All", icon: Bell },
    { id: "unread", label: "Unread", icon: BellRing },
  ];
  const list = tab === "all" ? NOTIFICATIONS : NOTIFICATIONS.filter((n) => n.unread);

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="mb-5">
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
      </View>

      <View className="gap-3">
        {list.map((n) => {
          const Icon = n.icon;
          return (
            <View
              key={n.id}
              className="flex-row rounded-2xl p-4"
              style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
            >
              <View
                className="rounded-xl items-center justify-center mr-3"
                style={{ width: 40, height: 40, backgroundColor: n.tone }}
              >
                <Icon size={19} color="#ffffff" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text style={{ color: theme.text, flex: 1 }} className="text-sm font-semibold">
                    {n.title}
                  </Text>
                  {n.unread ? (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "#4f46e5",
                        marginLeft: 8,
                      }}
                    />
                  ) : null}
                </View>
                <Text
                  style={{ color: theme.text, opacity: 0.65, marginTop: 3 }}
                  className="text-xs"
                >
                  {n.body}
                </Text>
                <Text style={{ color: theme.text, opacity: 0.4, marginTop: 5 }} className="text-xs">
                  {n.time}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={{ color: theme.text, opacity: 0.4 }} className="text-xs text-center mt-5">
        Sample notifications — live alerts coming soon.
      </Text>
    </ScrollView>
  );
}
