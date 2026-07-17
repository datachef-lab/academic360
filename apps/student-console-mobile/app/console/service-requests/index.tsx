import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { useTheme } from "@/hooks/use-theme";
import {
  BadgeIndianRupee,
  Clock,
  FileBadge,
  FilePlus2,
  FileText,
  GraduationCap,
  IdCard,
  Inbox,
  Repeat,
  UserPen,
  type LucideIcon,
} from "lucide-react-native";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

type TabKey = "new" | "mine";
type Status = "Pending" | "In review" | "Approved" | "Rejected";

const REQUEST_TYPES: { id: string; label: string; desc: string; icon: LucideIcon }[] = [
  { id: "id-card", label: "ID Card Issue", desc: "Lost, damaged or new card", icon: IdCard },
  { id: "shift-change", label: "Shift Change", desc: "Move to morning / day shift", icon: Repeat },
  {
    id: "fee-concession",
    label: "Fee Concession",
    desc: "Apply for a fee waiver",
    icon: BadgeIndianRupee,
  },
  { id: "bonafide", label: "Bonafide Certificate", desc: "Proof of enrolment", icon: FileBadge },
  { id: "transcript", label: "Transcript", desc: "Official academic record", icon: GraduationCap },
  {
    id: "duplicate-marksheet",
    label: "Duplicate Marksheet",
    desc: "Re-issue a marksheet",
    icon: FileText,
  },
  {
    id: "name-correction",
    label: "Name Correction",
    desc: "Fix your name / details",
    icon: UserPen,
  },
  { id: "leave", label: "Leave Application", desc: "Apply for leave", icon: FilePlus2 },
];

const MY_REQUESTS: { id: string; ref: string; type: string; date: string; status: Status }[] = [
  {
    id: "1",
    ref: "SR-2026-0142",
    type: "Bonafide Certificate",
    date: "12 Jul 2026",
    status: "Approved",
  },
  { id: "2", ref: "SR-2026-0151", type: "ID Card Issue", date: "15 Jul 2026", status: "In review" },
  { id: "3", ref: "SR-2026-0158", type: "Fee Concession", date: "16 Jul 2026", status: "Pending" },
  { id: "4", ref: "SR-2026-0119", type: "Shift Change", date: "02 Jul 2026", status: "Rejected" },
];

const statusTone = (s: Status, isDark: boolean) => {
  switch (s) {
    case "Approved":
      return { bg: isDark ? "rgba(34,197,94,0.2)" : "#dcfce7", fg: "#16a34a" };
    case "Rejected":
      return { bg: isDark ? "rgba(239,68,68,0.2)" : "#fee2e2", fg: "#ef4444" };
    case "In review":
      return { bg: isDark ? "rgba(99,102,241,0.2)" : "#e0e7ff", fg: "#4f46e5" };
    default:
      return { bg: isDark ? "rgba(245,158,11,0.2)" : "#fef3c7", fg: "#d97706" };
  }
};

export default function ServiceRequestsScreen() {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const accent = isDark ? "#a5b4fc" : "#4f46e5";
  const accentBg = isDark ? "rgba(99,102,241,0.2)" : "rgba(79,70,229,0.1)";

  const [tab, setTab] = useState<TabKey>("new");
  const tabs: TabItem<TabKey>[] = [
    { id: "new", label: "New request", icon: FilePlus2 },
    { id: "mine", label: "My requests", icon: Inbox },
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

      {tab === "new" ? (
        <View
          className="flex-row flex-wrap"
          style={{ justifyContent: "space-between", rowGap: 12 }}
        >
          {REQUEST_TYPES.map((r) => {
            const Icon = r.icon;
            return (
              <Pressable
                key={r.id}
                onPress={() =>
                  Alert.alert(r.label, "Request submitted (sample — service requests coming soon).")
                }
                className="rounded-2xl p-4"
                style={{
                  width: "48.5%",
                  backgroundColor: cardBg,
                  borderWidth: 1,
                  borderColor: cardBorder,
                }}
              >
                <View
                  className="rounded-xl items-center justify-center mb-2.5"
                  style={{ width: 40, height: 40, backgroundColor: accentBg }}
                >
                  <Icon size={20} color={accent} />
                </View>
                <Text style={{ color: theme.text }} className="text-sm font-semibold">
                  {r.label}
                </Text>
                <Text style={{ color: theme.text, opacity: 0.6 }} className="text-xs mt-0.5">
                  {r.desc}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View className="gap-3">
          {MY_REQUESTS.map((r) => {
            const tone = statusTone(r.status, isDark);
            return (
              <View
                key={r.id}
                className="rounded-2xl p-4"
                style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text style={{ color: theme.text }} className="text-base font-semibold">
                      {r.type}
                    </Text>
                    <Text
                      style={{ color: theme.text, opacity: 0.55, marginTop: 2 }}
                      className="text-xs"
                    >
                      {r.ref}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: tone.fg,
                      backgroundColor: tone.bg,
                      fontSize: 11,
                      fontWeight: "700",
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      overflow: "hidden",
                    }}
                  >
                    {r.status}
                  </Text>
                </View>
                <View className="flex-row items-center mt-3">
                  <Clock size={13} color={theme.text} style={{ opacity: 0.5 }} />
                  <Text
                    style={{ color: theme.text, opacity: 0.55, marginLeft: 6 }}
                    className="text-xs"
                  >
                    Raised on {r.date}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <Text style={{ color: theme.text, opacity: 0.4 }} className="text-xs text-center mt-5">
        Sample data — service requests are coming soon.
      </Text>
    </ScrollView>
  );
}
