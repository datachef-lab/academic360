import { useTheme } from "@/hooks/use-theme";
import {
  Download,
  FileBadge,
  FileText,
  GraduationCap,
  IdCard,
  Receipt,
  type LucideIcon,
} from "lucide-react-native";
import React from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

const DOCS: { id: string; title: string; meta: string; icon: LucideIcon }[] = [
  { id: "1", title: "Bonafide Certificate", meta: "PDF · Issued 12 Jul 2026", icon: FileBadge },
  { id: "2", title: "Semester I Marksheet", meta: "PDF · 1.1 MB", icon: GraduationCap },
  { id: "3", title: "Student ID Card", meta: "PDF · Valid till 2029", icon: IdCard },
  { id: "4", title: "Admission Fee Receipt", meta: "PDF · 2025-26", icon: Receipt },
  { id: "5", title: "Enrolment Fee Receipt", meta: "PDF · Semester II", icon: Receipt },
  { id: "6", title: "Course Registration Slip", meta: "PDF · Semester II", icon: FileText },
];

export default function DocumentScreen() {
  const { theme, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const accent = isDark ? "#a5b4fc" : "#4f46e5";
  const accentBg = isDark ? "rgba(99,102,241,0.2)" : "rgba(79,70,229,0.1)";

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
        CERTIFICATES & RECORDS
      </Text>
      <View className="gap-3">
        {DOCS.map((d) => {
          const Icon = d.icon;
          return (
            <Pressable
              key={d.id}
              onPress={() =>
                Alert.alert(d.title, "Download starting (sample — documents coming soon).")
              }
              className="flex-row items-center rounded-2xl p-4"
              style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
            >
              <View
                className="rounded-xl items-center justify-center mr-3"
                style={{ width: 42, height: 42, backgroundColor: accentBg }}
              >
                <Icon size={20} color={accent} />
              </View>
              <View className="flex-1">
                <Text style={{ color: theme.text }} className="text-sm font-semibold">
                  {d.title}
                </Text>
                <Text
                  style={{ color: theme.text, opacity: 0.55, marginTop: 2 }}
                  className="text-xs"
                >
                  {d.meta}
                </Text>
              </View>
              <Download size={18} color={accent} />
            </Pressable>
          );
        })}
      </View>

      <Text style={{ color: theme.text, opacity: 0.4 }} className="text-xs text-center mt-5">
        Sample documents — downloads coming soon.
      </Text>
    </ScrollView>
  );
}
