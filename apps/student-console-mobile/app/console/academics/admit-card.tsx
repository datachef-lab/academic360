import { useTheme } from "@/hooks/use-theme";
import { CalendarDays, CheckCircle2, Download, Lock, type LucideIcon } from "lucide-react-native";
import React from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

type CardState = "ready" | "locked";

const ADMIT_CARDS: {
  id: string;
  exam: string;
  session: string;
  window: string;
  state: CardState;
  note: string;
}[] = [
  {
    id: "1",
    exam: "Semester II — University Examination",
    session: "2025-26",
    window: "24 Jul – 08 Aug 2026",
    state: "ready",
    note: "Available for download",
  },
  {
    id: "2",
    exam: "Semester II — Internal Assessment",
    session: "2025-26",
    window: "12 – 18 Jul 2026",
    state: "ready",
    note: "Available for download",
  },
  {
    id: "3",
    exam: "Semester III — University Examination",
    session: "2026-27",
    window: "Dec 2026",
    state: "locked",
    note: "Releases after fee clearance",
  },
];

const CHECKLIST: { label: string; done: boolean }[] = [
  { label: "Enrolment fee paid", done: true },
  { label: "Exam form submitted", done: true },
  { label: "Attendance above 75%", done: true },
  { label: "No pending library dues", done: false },
];

export default function AdmitCardScreen() {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <Text
        style={{ color: theme.text, opacity: 0.55, fontSize: 12, fontWeight: "700" }}
        className="mb-3"
      >
        ADMIT CARDS
      </Text>
      <View className="gap-3 mb-6">
        {ADMIT_CARDS.map((c) => {
          const locked = c.state === "locked";
          const Icon: LucideIcon = locked ? Lock : Download;
          return (
            <View
              key={c.id}
              className="rounded-2xl p-4"
              style={{
                backgroundColor: cardBg,
                borderWidth: 1,
                borderColor: cardBorder,
                opacity: locked ? 0.75 : 1,
              }}
            >
              <Text style={{ color: theme.text }} className="text-base font-semibold">
                {c.exam}
              </Text>
              <View className="flex-row items-center mt-2">
                <CalendarDays size={13} color={theme.text} style={{ opacity: 0.5 }} />
                <Text
                  style={{ color: theme.text, opacity: 0.55, marginLeft: 6 }}
                  className="text-xs"
                >
                  {c.window} · Session {c.session}
                </Text>
              </View>
              <View className="flex-row items-center justify-between mt-3">
                <Text style={{ color: theme.text, opacity: 0.5 }} className="text-xs">
                  {c.note}
                </Text>
                <Pressable
                  disabled={locked}
                  onPress={() =>
                    Alert.alert(c.exam, "Download starting (sample — admit cards coming soon).")
                  }
                  className="flex-row items-center rounded-lg px-3 py-1.5"
                  style={{
                    backgroundColor: locked
                      ? isDark
                        ? "rgba(255,255,255,0.08)"
                        : "#e2e8f0"
                      : isDark
                        ? "#6366f1"
                        : "#4f46e5",
                  }}
                >
                  <Icon size={13} color={locked ? theme.text : "#ffffff"} />
                  <Text
                    style={{
                      color: locked ? theme.text : "#ffffff",
                      opacity: locked ? 0.6 : 1,
                      fontSize: 12,
                      fontWeight: "700",
                      marginLeft: 6,
                    }}
                  >
                    {locked ? "Locked" : "Download"}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>

      <Text
        style={{ color: theme.text, opacity: 0.55, fontSize: 12, fontWeight: "700" }}
        className="mb-3"
      >
        ELIGIBILITY CHECKLIST
      </Text>
      <View
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
      >
        {CHECKLIST.map((c, i) => (
          <View
            key={c.label}
            className="flex-row items-center px-4 py-3"
            style={{
              borderBottomWidth: i < CHECKLIST.length - 1 ? 1 : 0,
              borderBottomColor: cardBorder,
            }}
          >
            <CheckCircle2 size={17} color={c.done ? "#16a34a" : isDark ? "#475569" : "#cbd5e1"} />
            <Text
              style={{ color: theme.text, opacity: c.done ? 1 : 0.55, marginLeft: 10, flex: 1 }}
              className="text-sm"
            >
              {c.label}
            </Text>
            {!c.done ? (
              <Text style={{ color: "#d97706", fontSize: 11, fontWeight: "700" }}>Pending</Text>
            ) : null}
          </View>
        ))}
      </View>

      <Text style={{ color: theme.text, opacity: 0.4 }} className="text-xs text-center mt-5">
        Sample data — admit card downloads coming soon.
      </Text>
    </ScrollView>
  );
}
