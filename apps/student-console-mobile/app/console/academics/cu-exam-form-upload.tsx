import { useTheme } from "@/hooks/use-theme";
import { CheckCircle2, FileText, Trash2, Upload } from "lucide-react-native";
import React from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

const STEPS = [
  { label: "Exam form filled on CU portal", done: true },
  { label: "Form downloaded as PDF", done: true },
  { label: "Uploaded here for verification", done: false },
  { label: "Verified by the college office", done: false },
];

const UPLOADED: { id: string; name: string; meta: string }[] = [
  { id: "1", name: "CU_Exam_Form_Sem_I.pdf", meta: "Uploaded 08 Jan 2026 · Verified" },
];

export default function CuExamFormUploadScreen() {
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
      {/* Upload dropzone */}
      <Pressable
        onPress={() =>
          Alert.alert("Upload exam form", "File picker opens here (sample — upload coming soon).")
        }
        className="rounded-2xl items-center px-5 py-8 mb-5"
        style={{
          backgroundColor: accentBg,
          borderWidth: 1.5,
          borderColor: accent,
          borderStyle: "dashed",
        }}
      >
        <View
          className="rounded-2xl items-center justify-center mb-3"
          style={{ width: 52, height: 52, backgroundColor: isDark ? "#6366f1" : "#4f46e5" }}
        >
          <Upload size={24} color="#ffffff" />
        </View>
        <Text style={{ color: theme.text }} className="text-base font-semibold">
          Upload your CU exam form
        </Text>
        <Text
          style={{ color: theme.text, opacity: 0.6, textAlign: "center", marginTop: 4 }}
          className="text-xs"
        >
          PDF or JPG · up to 5 MB
        </Text>
      </Pressable>

      {/* Progress */}
      <Text
        style={{ color: theme.text, opacity: 0.55, fontSize: 12, fontWeight: "700" }}
        className="mb-3"
      >
        SUBMISSION PROGRESS
      </Text>
      <View
        className="rounded-2xl overflow-hidden mb-6"
        style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
      >
        {STEPS.map((s, i) => (
          <View
            key={s.label}
            className="flex-row items-center px-4 py-3"
            style={{
              borderBottomWidth: i < STEPS.length - 1 ? 1 : 0,
              borderBottomColor: cardBorder,
            }}
          >
            <CheckCircle2 size={17} color={s.done ? "#16a34a" : isDark ? "#475569" : "#cbd5e1"} />
            <Text
              style={{ color: theme.text, opacity: s.done ? 1 : 0.55, marginLeft: 10, flex: 1 }}
              className="text-sm"
            >
              {s.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Previously uploaded */}
      <Text
        style={{ color: theme.text, opacity: 0.55, fontSize: 12, fontWeight: "700" }}
        className="mb-3"
      >
        UPLOADED FORMS
      </Text>
      <View className="gap-3">
        {UPLOADED.map((u) => (
          <View
            key={u.id}
            className="flex-row items-center rounded-2xl p-4"
            style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }}
          >
            <View
              className="rounded-xl items-center justify-center mr-3"
              style={{ width: 42, height: 42, backgroundColor: accentBg }}
            >
              <FileText size={20} color={accent} />
            </View>
            <View className="flex-1">
              <Text
                style={{ color: theme.text }}
                numberOfLines={1}
                className="text-sm font-semibold"
              >
                {u.name}
              </Text>
              <Text style={{ color: theme.text, opacity: 0.55, marginTop: 2 }} className="text-xs">
                {u.meta}
              </Text>
            </View>
            <Pressable onPress={() => Alert.alert("Remove file", "Removed (sample).")} hitSlop={8}>
              <Trash2 size={17} color="#ef4444" />
            </Pressable>
          </View>
        ))}
      </View>

      <Text style={{ color: theme.text, opacity: 0.4 }} className="text-xs text-center mt-5">
        Sample data — exam form upload coming soon.
      </Text>
    </ScrollView>
  );
}
