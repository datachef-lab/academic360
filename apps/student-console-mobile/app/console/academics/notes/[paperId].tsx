import { useTheme } from "@/hooks/use-theme";
import { useLocalSearchParams } from "expo-router";
import { Download, FileText, NotebookPen } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

type SectionKey = "notes" | "assignment";

// Placeholder content — wire to the paper's real notes/assignments later.
const MOCK_NOTES = [
  { id: "1", title: "Unit 1 — Introduction", meta: "PDF · 2.1 MB" },
  { id: "2", title: "Unit 2 — Core Concepts", meta: "PDF · 3.4 MB" },
  { id: "3", title: "Reference Sheet", meta: "PDF · 0.8 MB" },
];

const MOCK_ASSIGNMENTS = [
  { id: "1", title: "Assignment 1: Problem Set", due: "Due 20 Jul", done: false },
  { id: "2", title: "Assignment 2: Case Study", due: "Due 28 Jul", done: false },
  { id: "3", title: "Assignment 0: Warm-up", due: "Submitted", done: true },
];

export default function PaperNotesScreen() {
  const { theme, colorScheme } = useTheme();
  const params = useLocalSearchParams<{ paperId: string; name?: string; code?: string }>();
  const [section, setSection] = useState<SectionKey>("notes");

  const isDark = colorScheme === "dark";
  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const accent = isDark ? "#a5b4fc" : "#4f46e5";
  const accentBg = isDark ? "rgba(99,102,241,0.2)" : "rgba(79,70,229,0.1)";
  const segBg = isDark ? "rgba(255,255,255,0.06)" : "#eef2ff";

  const name = params.name || "Paper";
  const sections: { key: SectionKey; label: string }[] = [
    { key: "notes", label: "Notes" },
    { key: "assignment", label: "Assignment" },
  ];

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={{ color: theme.text }} className="text-2xl font-bold mb-1">
        {name}
      </Text>
      {params.code ? (
        <Text style={{ color: theme.text, opacity: 0.6 }} className="text-sm mb-4">
          {params.code}
        </Text>
      ) : (
        <View className="mb-4" />
      )}

      <View className="flex-row rounded-xl p-1 mb-5" style={{ backgroundColor: segBg }}>
        {sections.map((s) => {
          const active = section === s.key;
          return (
            <Pressable
              key={s.key}
              onPress={() => setSection(s.key)}
              className="flex-1 py-2 rounded-lg items-center"
              style={{ backgroundColor: active ? (isDark ? "#4338ca" : "#ffffff") : "transparent" }}
            >
              <Text
                style={{
                  color: active ? (isDark ? "#ffffff" : accent) : theme.text,
                  opacity: active ? 1 : 0.6,
                  fontWeight: active ? "700" : "500",
                  fontSize: 14,
                }}
              >
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {section === "notes" ? (
        <View className="gap-3">
          {MOCK_NOTES.map((n) => (
            <Pressable
              key={n.id}
              className="flex-row items-center rounded-2xl p-4"
              style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
            >
              <View
                className="rounded-xl items-center justify-center mr-3"
                style={{ width: 40, height: 40, backgroundColor: accentBg }}
              >
                <FileText size={20} color={accent} />
              </View>
              <View className="flex-1">
                <Text style={{ color: theme.text }} className="text-sm font-semibold">
                  {n.title}
                </Text>
                <Text style={{ color: theme.text, opacity: 0.6 }} className="text-xs mt-0.5">
                  {n.meta}
                </Text>
              </View>
              <Download size={18} color={accent} />
            </Pressable>
          ))}
        </View>
      ) : (
        <View className="gap-3">
          {MOCK_ASSIGNMENTS.map((a) => (
            <Pressable
              key={a.id}
              className="flex-row items-center rounded-2xl p-4"
              style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
            >
              <View
                className="rounded-xl items-center justify-center mr-3"
                style={{ width: 40, height: 40, backgroundColor: accentBg }}
              >
                <NotebookPen size={20} color={accent} />
              </View>
              <View className="flex-1">
                <Text style={{ color: theme.text }} className="text-sm font-semibold">
                  {a.title}
                </Text>
                <Text
                  style={{ color: a.done ? "#16a34a" : theme.text, opacity: a.done ? 1 : 0.6 }}
                  className="text-xs mt-0.5"
                >
                  {a.due}
                </Text>
              </View>
              {/* Assignment is a downloadable PDF (preview/open) */}
              <Download size={18} color={accent} />
            </Pressable>
          ))}
        </View>
      )}

      <Text style={{ color: theme.text, opacity: 0.4 }} className="text-xs text-center mt-4">
        Sample content — notes and assignments will load from this paper
      </Text>
    </ScrollView>
  );
}
