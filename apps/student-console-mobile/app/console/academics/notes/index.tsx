import { Select } from "@/components/ui/select";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import type { StudentDto } from "@repo/db/dtos/user";
import { router } from "expo-router";
import { ChevronRight, FileText } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const SEMESTERS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

// Placeholder papers per semester — replace with the student's promotion papers
// (subject-paper mapping) later.
function papersFor(sem: string) {
  return [
    { id: `${sem}-cc1`, name: "Major Paper I", code: "CC-1" },
    { id: `${sem}-cc2`, name: "Major Paper II", code: "CC-2" },
    { id: `${sem}-mn`, name: "Minor Paper", code: "MN-1" },
    { id: `${sem}-aec`, name: "Ability Enhancement Course", code: "AEC" },
    { id: `${sem}-sec`, name: "Skill Enhancement Course", code: "SEC" },
  ];
}

export default function NotesScreen() {
  const { theme, colorScheme } = useTheme();
  const { user } = useAuth();
  const student = user?.payload as StudentDto | undefined;

  const isDark = colorScheme === "dark";
  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const accent = isDark ? "#a5b4fc" : "#4f46e5";
  const accentBg = isDark ? "rgba(99,102,241,0.2)" : "rgba(79,70,229,0.1)";

  const currentSem = student?.currentPromotion?.class?.name
    ?.match(/\b([IVX]+)\b/i)?.[1]
    ?.toUpperCase();
  const [sem, setSem] = useState<string>(
    currentSem && SEMESTERS.includes(currentSem) ? currentSem : "I",
  );

  const semesterOptions = SEMESTERS.map((s) => ({ value: s, label: `Semester ${s}` }));
  const papers = papersFor(sem);

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={{ color: theme.text, opacity: 0.7 }} className="text-sm mb-2">
        Semester
      </Text>
      <View className="mb-5">
        <Select
          options={semesterOptions}
          value={sem}
          onChange={setSem}
          placeholder="Select semester"
        />
      </View>

      <Text
        style={{ color: theme.text, opacity: 0.55, fontSize: 12, fontWeight: "700" }}
        className="mb-3"
      >
        PAPERS
      </Text>
      <View className="gap-3">
        {papers.map((paper) => (
          <Pressable
            key={paper.id}
            onPress={() =>
              router.push({
                pathname: "/console/academics/notes/[paperId]",
                params: { paperId: paper.id, name: paper.name, code: paper.code },
              } as any)
            }
            className="flex-row items-center rounded-2xl p-4"
            style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
          >
            <View
              className="rounded-xl items-center justify-center mr-3"
              style={{ width: 44, height: 44, backgroundColor: accentBg }}
            >
              <FileText size={20} color={accent} />
            </View>
            <View className="flex-1">
              <Text style={{ color: theme.text }} className="text-base font-semibold">
                {paper.name}
              </Text>
              <Text style={{ color: theme.text, opacity: 0.6 }} className="text-xs mt-0.5">
                {paper.code} · Semester {sem}
              </Text>
            </View>
            <ChevronRight size={20} color={theme.text} style={{ opacity: 0.4 }} />
          </Pressable>
        ))}
      </View>

      <Text style={{ color: theme.text, opacity: 0.4 }} className="text-xs text-center mt-4">
        Papers shown are samples — will list your promotion papers for the semester
      </Text>
    </ScrollView>
  );
}
