import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { useTheme } from "@/hooks/use-theme";
import {
  Award,
  CalendarDays,
  Download,
  MapPin,
  PartyPopper,
  Trophy,
  type LucideIcon,
} from "lucide-react-native";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

type TabKey = "upcoming" | "mine";

const EVENTS: {
  id: string;
  title: string;
  date: string;
  venue: string;
  tone: string;
  icon: LucideIcon;
  registered: boolean;
}[] = [
  {
    id: "1",
    title: "Annual Tech Fest",
    date: "20–22 Jul 2026",
    venue: "Main Auditorium",
    tone: "#8b5cf6",
    icon: PartyPopper,
    registered: true,
  },
  {
    id: "2",
    title: "Inter-College Sports Meet",
    date: "28 Jul 2026",
    venue: "College Ground",
    tone: "#f59e0b",
    icon: Trophy,
    registered: false,
  },
  {
    id: "3",
    title: "Seminar: Data & Society",
    date: "02 Aug 2026",
    venue: "Seminar Hall 2",
    tone: "#3b82f6",
    icon: CalendarDays,
    registered: false,
  },
  {
    id: "4",
    title: "Cultural Night",
    date: "12 Aug 2026",
    venue: "Open Air Theatre",
    tone: "#f43f5e",
    icon: PartyPopper,
    registered: true,
  },
];

const CERTIFICATES = [
  { id: "1", title: "Tech Fest 2025 — Participation", meta: "Issued 24 Jul 2025" },
  { id: "2", title: "Quiz Championship — Runner Up", meta: "Issued 11 Mar 2026" },
];

export default function EventsScreen() {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const accent = isDark ? "#a5b4fc" : "#4f46e5";
  const accentBg = isDark ? "rgba(99,102,241,0.2)" : "rgba(79,70,229,0.1)";
  const [tab, setTab] = useState<TabKey>("upcoming");

  const tabs: TabItem<TabKey>[] = [
    { id: "upcoming", label: "Events", icon: CalendarDays },
    { id: "mine", label: "Certificates", icon: Award },
  ];

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

      {tab === "upcoming" ? (
        <View className="gap-3">
          {EVENTS.map((e) => {
            const Icon = e.icon;
            return (
              <View
                key={e.id}
                className="rounded-2xl p-4"
                style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
              >
                <View className="flex-row items-center">
                  <View
                    className="rounded-xl items-center justify-center mr-3"
                    style={{ width: 44, height: 44, backgroundColor: e.tone }}
                  >
                    <Icon size={21} color="#ffffff" />
                  </View>
                  <View className="flex-1">
                    <Text style={{ color: theme.text }} className="text-base font-semibold">
                      {e.title}
                    </Text>
                    <Text
                      style={{ color: theme.text, opacity: 0.6, marginTop: 2 }}
                      className="text-xs"
                    >
                      {e.date}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center justify-between mt-3">
                  <View className="flex-row items-center">
                    <MapPin size={13} color={theme.text} style={{ opacity: 0.5 }} />
                    <Text
                      style={{ color: theme.text, opacity: 0.55, marginLeft: 5 }}
                      className="text-xs"
                    >
                      {e.venue}
                    </Text>
                  </View>
                  {e.registered ? (
                    <Text
                      style={{
                        color: "#16a34a",
                        backgroundColor: isDark ? "rgba(34,197,94,0.2)" : "#dcfce7",
                        fontSize: 11,
                        fontWeight: "700",
                        borderRadius: 999,
                        paddingHorizontal: 10,
                        paddingVertical: 3,
                        overflow: "hidden",
                      }}
                    >
                      Registered
                    </Text>
                  ) : (
                    <Pressable
                      onPress={() =>
                        Alert.alert(e.title, "Registered (sample — events coming soon).")
                      }
                      className="rounded-lg px-3 py-1.5"
                      style={{ backgroundColor: isDark ? "#6366f1" : "#4f46e5" }}
                    >
                      <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                        Register
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View className="gap-3">
          {CERTIFICATES.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => Alert.alert(c.title, "Download starting (sample).")}
              className="flex-row items-center rounded-2xl p-4"
              style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
            >
              <View
                className="rounded-xl items-center justify-center mr-3"
                style={{ width: 42, height: 42, backgroundColor: accentBg }}
              >
                <Award size={20} color={accent} />
              </View>
              <View className="flex-1">
                <Text style={{ color: theme.text }} className="text-sm font-semibold">
                  {c.title}
                </Text>
                <Text
                  style={{ color: theme.text, opacity: 0.55, marginTop: 2 }}
                  className="text-xs"
                >
                  {c.meta}
                </Text>
              </View>
              <Download size={18} color={accent} />
            </Pressable>
          ))}
        </View>
      )}

      <Text style={{ color: theme.text, opacity: 0.4 }} className="text-xs text-center mt-5">
        Sample data — events & certificates coming soon.
      </Text>
    </ScrollView>
  );
}
