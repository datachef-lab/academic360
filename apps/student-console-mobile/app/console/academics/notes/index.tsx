import { Select } from "@/components/ui/select";
import { useTheme } from "@/hooks/use-theme";
import { toSentenceCase } from "@/lib/text";
import { useAuth } from "@/providers/auth-provider";
import { fetchMandatoryPaperRows, type MandatoryPaperRow } from "@/services/subject-selection";
import type { StudentDto } from "@repo/db/dtos/user";
import { router } from "expo-router";
import { ChevronRight, FileText } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

const ROMAN: Record<string, number> = { I: 1, V: 5, X: 10 };
function romanToNum(s?: string | null): number {
  const m = s?.toUpperCase().match(/\b([IVX]+)\b/)?.[1];
  if (!m) return 999;
  let total = 0;
  let prev = 0;
  for (let i = m.length - 1; i >= 0; i--) {
    const v = ROMAN[m[i]] || 0;
    total += v < prev ? -v : v;
    prev = v;
  }
  return total || 999;
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

  const [rows, setRows] = useState<MandatoryPaperRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sem, setSem] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const sid = student?.id;
    if (!sid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchMandatoryPaperRows(sid)
      .then((r) => !cancelled && setRows(r))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [student?.id]);

  // Group papers by their semester (class.name).
  const bySem = useMemo(() => {
    const map = new Map<string, MandatoryPaperRow[]>();
    for (const row of rows) {
      const cn = row.class?.name?.trim();
      if (!cn) continue;
      if (!map.has(cn)) map.set(cn, []);
      map.get(cn)!.push(row);
    }
    return map;
  }, [rows]);

  const semesterNames = useMemo(
    () => Array.from(bySem.keys()).sort((a, b) => romanToNum(a) - romanToNum(b)),
    [bySem],
  );
  const semesterOptions = semesterNames.map((n) => ({ value: n, label: toSentenceCase(n) }));
  const currentClassName = student?.currentPromotion?.class?.name?.trim();

  useEffect(() => {
    if (sem || semesterNames.length === 0) return;
    setSem(currentClassName && bySem.has(currentClassName) ? currentClassName : semesterNames[0]);
  }, [sem, semesterNames, currentClassName, bySem]);

  const papers = sem ? (bySem.get(sem) ?? []) : [];

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
          disabled={loading || semesterOptions.length === 0}
        />
      </View>

      {loading ? (
        <View className="py-16 items-center">
          <ActivityIndicator color={accent} />
        </View>
      ) : papers.length === 0 ? (
        <View className="py-16 items-center">
          <Text style={{ color: theme.text, opacity: 0.6 }} className="text-sm text-center">
            {rows.length === 0
              ? "No papers found for your promotion yet."
              : "No papers for this semester."}
          </Text>
        </View>
      ) : (
        <>
          <Text
            style={{ color: theme.text, opacity: 0.55, fontSize: 12, fontWeight: "700" }}
            className="mb-3"
          >
            PAPERS
          </Text>
          <View className="gap-3">
            {papers.map((row) => {
              const title = row.paper?.name || row.subject?.name || "Paper";
              const code = row.paper?.code || row.subject?.code || "";
              const type = row.subjectType?.name || "";
              return (
                <Pressable
                  key={row.paper.id}
                  onPress={() =>
                    router.push({
                      pathname: "/console/academics/notes/[paperId]",
                      params: { paperId: String(row.paper.id), name: title, code },
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
                      {title}
                    </Text>
                    <Text style={{ color: theme.text, opacity: 0.6 }} className="text-xs mt-0.5">
                      {[code, type].filter(Boolean).join(" · ") || "Paper"}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={theme.text} style={{ opacity: 0.4 }} />
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}
