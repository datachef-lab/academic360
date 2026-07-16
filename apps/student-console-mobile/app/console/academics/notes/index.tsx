import { Select } from "@/components/ui/select";
import { useTheme } from "@/hooks/use-theme";
import { toSentenceCase } from "@/lib/text";
import { useAuth } from "@/providers/auth-provider";
import {
  fetchMandatoryPaperRows,
  fetchStudentSubjectSelections,
} from "@/services/subject-selection";
import type { StudentDto } from "@repo/db/dtos/user";
import { router } from "expo-router";
import { ChevronRight, FileText } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

type UiPaper = {
  id: number;
  name: string;
  code: string;
  type: string;
  className: string;
  elective: boolean;
};

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

  const [papersAll, setPapersAll] = useState<UiPaper[]>([]);
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
    Promise.all([
      fetchMandatoryPaperRows(sid),
      fetchStudentSubjectSelections(sid).catch(() => null),
    ])
      .then(([mand, sel]) => {
        if (cancelled) return;
        const list: UiPaper[] = mand.map((row) => ({
          id: row.paper.id,
          name: row.paper?.name || row.subject?.name || "Paper",
          code: row.paper?.code || row.subject?.code || "",
          type: row.subjectType?.name || "",
          className: row.class?.name?.trim() || "",
          elective: false,
        }));

        // The student's chosen electives: match the available paper options to
        // the subjectIds the student actually selected.
        if (sel) {
          const chosen = new Set<number>();
          for (const s of sel.actualStudentSelections ?? []) {
            const sid2 = s?.subjectId ?? s?.subjectModelId ?? s?.subject?.id;
            if (typeof sid2 === "number") chosen.add(sid2);
          }
          if (chosen.size > 0) {
            for (const grp of sel.studentSubjectsSelection ?? []) {
              for (const opt of grp.paperOptions ?? []) {
                const subjId = opt.subject?.id;
                if (subjId == null || !chosen.has(subjId)) continue;
                list.push({
                  id: opt.id,
                  name: opt.name || opt.subject?.name || "Paper",
                  code: opt.code || "",
                  type: grp.subjectType?.name || "Elective",
                  className: opt.class?.name?.trim() || "",
                  elective: true,
                });
              }
            }
          }
        }
        setPapersAll(list);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [student?.id]);

  const bySem = useMemo(() => {
    const map = new Map<string, UiPaper[]>();
    for (const p of papersAll) {
      if (!p.className) continue;
      if (!map.has(p.className)) map.set(p.className, []);
      map.get(p.className)!.push(p);
    }
    return map;
  }, [papersAll]);

  const semesterNames = useMemo(
    () => Array.from(bySem.keys()).sort((a, b) => romanToNum(a) - romanToNum(b)),
    [bySem],
  );
  const semesterOptions = semesterNames.map((n) => ({ value: n, label: toSentenceCase(n) }));
  const currentClassName = student?.currentPromotion?.class?.name?.trim();

  // Default to the student's current semester (from the DTO), matched by its
  // roman numeral so minor label differences still resolve.
  useEffect(() => {
    if (sem || semesterNames.length === 0) return;
    const curNum = romanToNum(currentClassName);
    const match = semesterNames.find((n) => romanToNum(n) === curNum);
    setSem(match ?? semesterNames[0]);
  }, [sem, semesterNames, currentClassName]);

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
          searchable={false}
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
            {papersAll.length === 0
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
            {papers.map((p) => (
              <Pressable
                key={`${p.elective ? "e" : "m"}-${p.id}`}
                onPress={() =>
                  router.push({
                    pathname: "/console/academics/notes/[paperId]",
                    params: { paperId: String(p.id), name: p.name, code: p.code },
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
                  <View className="flex-row items-center" style={{ gap: 8 }}>
                    <Text
                      style={{ color: theme.text, flexShrink: 1 }}
                      numberOfLines={1}
                      className="text-base font-semibold"
                    >
                      {p.name}
                      {!p.elective ? <Text style={{ color: "#ef4444" }}> *</Text> : null}
                    </Text>
                    {p.elective ? (
                      <View
                        className="rounded-full px-2 py-0.5"
                        style={{ backgroundColor: isDark ? "rgba(34,197,94,0.2)" : "#dcfce7" }}
                      >
                        <Text style={{ color: "#16a34a", fontSize: 10, fontWeight: "700" }}>
                          Elective
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={{ color: theme.text, opacity: 0.6 }} className="text-xs mt-0.5">
                    {p.code || "Paper"}
                  </Text>
                </View>
                <ChevronRight size={20} color={theme.text} style={{ opacity: 0.4 }} />
              </Pressable>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}
