import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { toSentenceCase } from "@/lib/text";
import type { StudentDto } from "@repo/db/dtos/user";
import React from "react";
import { ScrollView, Text, View } from "react-native";

const SUBJECT_ATTENDANCE = [
  { name: "Basic Algebra", pct: 92 },
  { name: "Python Programming", pct: 78 },
  { name: "Compulsory English", pct: 85 },
  { name: "Environmental Education", pct: 64 },
];

function pctTone(p: number) {
  if (p >= 80) return "#16a34a";
  if (p >= 70) return "#d97706";
  return "#ef4444";
}

export default function CurrentAcademicStatusScreen() {
  const { theme, colorScheme } = useTheme();
  const { user } = useAuth();
  const student = user?.payload as StudentDto | undefined;
  const promo = student?.currentPromotion;

  const isDark = colorScheme === "dark";
  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const track = isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0";

  const overall = Math.round(
    SUBJECT_ATTENDANCE.reduce((s, x) => s + x.pct, 0) / SUBJECT_ATTENDANCE.length,
  );

  const facts: [string, string][] = [
    ["Semester", toSentenceCase(promo?.class?.name || "—")],
    ["Section", promo?.section?.name || "—"],
    ["Shift", promo?.shift?.name || "—"],
    ["Roll number", student?.classRollNumber || "—"],
    ["Enrolment", "Active"],
  ];

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Overall attendance */}
      <View
        className="rounded-2xl p-5 mb-4 items-center"
        style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
      >
        <Text style={{ color: theme.text, opacity: 0.6 }} className="text-xs font-semibold">
          OVERALL ATTENDANCE
        </Text>
        <Text style={{ color: pctTone(overall), fontSize: 44, fontWeight: "800", marginTop: 4 }}>
          {overall}%
        </Text>
        <View
          style={{
            height: 8,
            borderRadius: 4,
            backgroundColor: track,
            width: "100%",
            marginTop: 12,
          }}
        >
          <View
            style={{
              height: 8,
              borderRadius: 4,
              backgroundColor: pctTone(overall),
              width: `${overall}%`,
            }}
          />
        </View>
        <Text style={{ color: theme.text, opacity: 0.5, marginTop: 8 }} className="text-xs">
          Minimum 75% required to sit for exams
        </Text>
      </View>

      {/* Enrolment facts */}
      <View
        className="rounded-2xl overflow-hidden mb-5"
        style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
      >
        {facts.map(([k, v], i) => (
          <View
            key={k}
            className="flex-row justify-between px-4 py-3"
            style={{
              borderBottomWidth: i < facts.length - 1 ? 1 : 0,
              borderBottomColor: cardBorder,
            }}
          >
            <Text style={{ color: theme.text, opacity: 0.6 }} className="text-sm">
              {k}
            </Text>
            <Text style={{ color: theme.text }} className="text-sm font-medium">
              {v}
            </Text>
          </View>
        ))}
      </View>

      {/* Per-subject attendance */}
      <Text
        style={{ color: theme.text, opacity: 0.55, fontSize: 12, fontWeight: "700" }}
        className="mb-3"
      >
        SUBJECT-WISE ATTENDANCE
      </Text>
      <View className="gap-3">
        {SUBJECT_ATTENDANCE.map((s) => (
          <View
            key={s.name}
            className="rounded-2xl p-4"
            style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text
                style={{ color: theme.text, flex: 1 }}
                numberOfLines={1}
                className="text-sm font-semibold"
              >
                {s.name}
              </Text>
              <Text
                style={{ color: pctTone(s.pct), fontSize: 13, fontWeight: "800", marginLeft: 8 }}
              >
                {s.pct}%
              </Text>
            </View>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: track }}>
              <View
                style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: pctTone(s.pct),
                  width: `${s.pct}%`,
                }}
              />
            </View>
          </View>
        ))}
      </View>

      <Text style={{ color: theme.text, opacity: 0.4 }} className="text-xs text-center mt-5">
        Attendance figures are samples — live data coming soon.
      </Text>
    </ScrollView>
  );
}
