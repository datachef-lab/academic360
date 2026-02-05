import type { ExamDto } from "@repo/db/dtos/exams";
import type { StudentDto } from "@repo/db/dtos/user";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { useExamSocketRefresh } from "@/providers/exam-socket-provider";
import { fetchExamsByStudentId } from "@/services/exam-api";
import { Calendar, Clock, Eye, FileText, GraduationCap, History } from "lucide-react-native";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function hasUpcomingPapers(exam: ExamDto, today: Date): boolean {
  if (!exam.examSubjects?.length) return false;
  return exam.examSubjects.some((s) => {
    const d = new Date(s.startTime);
    d.setHours(0, 0, 0, 0);
    return d > today;
  });
}

function hasPapersToday(exam: ExamDto, today: Date): boolean {
  if (!exam.examSubjects?.length) return false;
  return exam.examSubjects.some((s) => {
    const d = new Date(s.startTime);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });
}

function allPapersCompleted(exam: ExamDto, now: Date): boolean {
  if (!exam.examSubjects?.length) return false;
  const last = exam.examSubjects.reduce((a, b) => (new Date(b.endTime) > new Date(a.endTime) ? b : a));
  return now > new Date(last.endTime);
}

function formatMinutesToHoursMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return "N/A";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} minutes`;
  if (m === 0) return `${h} hour${h > 1 ? "s" : ""}`;
  return `${h} hour${h > 1 ? "s" : ""} ${m} min`;
}

export default function ExamsScreen() {
  const { theme, colorScheme } = useTheme();
  const { user } = useAuth();
  const student = user?.payload as StudentDto | undefined;

  const [exams, setExams] = useState<ExamDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "today" | "completed">("today");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const now = new Date();

  const upcomingExams = exams
    .filter((e) => hasUpcomingPapers(e, today))
    .sort((a, b) => {
      const nextA = (a.examSubjects || [])
        .filter((s) => {
          const d = new Date(s.startTime);
          d.setHours(0, 0, 0, 0);
          return d > today;
        })
        .sort((s1, s2) => new Date(s1.startTime).getTime() - new Date(s2.startTime).getTime())[0];
      const nextB = (b.examSubjects || [])
        .filter((s) => {
          const d = new Date(s.startTime);
          d.setHours(0, 0, 0, 0);
          return d > today;
        })
        .sort((s1, s2) => new Date(s1.startTime).getTime() - new Date(s2.startTime).getTime())[0];
      if (!nextA || !nextB) return 0;
      return new Date(nextA.startTime).getTime() - new Date(nextB.startTime).getTime();
    });

  const todayExams = exams
    .filter((e) => hasPapersToday(e, today) && !allPapersCompleted(e, now))
    .sort((a, b) => {
      const pa = (a.examSubjects || [])
        .filter((s) => {
          const d = new Date(s.startTime);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        })
        .sort((s1, s2) => new Date(s1.startTime).getTime() - new Date(s2.startTime).getTime())[0];
      const pb = (b.examSubjects || [])
        .filter((s) => {
          const d = new Date(s.startTime);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        })
        .sort((s1, s2) => new Date(s1.startTime).getTime() - new Date(s2.startTime).getTime())[0];
      if (!pa || !pb) return 0;
      return new Date(pa.startTime).getTime() - new Date(pb.startTime).getTime();
    });

  const completedExams = exams
    .filter((e) => allPapersCompleted(e, now) && !hasUpcomingPapers(e, today) && !hasPapersToday(e, today))
    .sort((a, b) => {
      const lastA = (a.examSubjects || []).reduce((x, y) => (new Date(y.endTime) > new Date(x.endTime) ? y : x));
      const lastB = (b.examSubjects || []).reduce((x, y) => (new Date(y.endTime) > new Date(x.endTime) ? y : x));
      return new Date(lastB.endTime).getTime() - new Date(lastA.endTime).getTime();
    });

  const totalTodayMinutes = todayExams.reduce((sum, exam) => {
    const papers = (exam.examSubjects || []).filter((s) => {
      const d = new Date(s.startTime);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });
    return (
      sum +
      papers.reduce((s, p) => {
        const start = new Date(p.startTime).getTime();
        const end = new Date(p.endTime).getTime();
        const mins = (end - start) / 60000;
        return s + (mins > 0 && mins <= 480 ? mins : 120);
      }, 0)
    );
  }, 0);

  const refetchExams = useCallback(() => {
    if (!student?.id) return;
    fetchExamsByStudentId(student.id)
      .then((res) => {
        const content = res.payload?.content ?? [];
        const nowTime = new Date().getTime();
        const filtered = content.filter((exam) => {
          if (!exam.admitCardStartDownloadDate) return false;
          const start = new Date(exam.admitCardStartDownloadDate).getTime();
          return start <= nowTime;
        });
        setExams(filtered);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load exams");
      });
  }, [student?.id]);

  useEffect(() => {
    if (!student?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchExamsByStudentId(student.id)
      .then((res) => {
        const content = res.payload?.content ?? [];
        const nowTime = now.getTime();
        const filtered = content.filter((exam) => {
          if (!exam.admitCardStartDownloadDate) return false;
          const start = new Date(exam.admitCardStartDownloadDate).getTime();
          return start <= nowTime;
        });
        setExams(filtered);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load exams");
      })
      .finally(() => setLoading(false));
  }, [student?.id]);

  useExamSocketRefresh(refetchExams);

  const isDark = colorScheme === "dark";
  const cardBg = isDark ? "rgba(255,255,255,0.08)" : "#ffffff";
  const cardBorder = isDark ? "rgba(255,255,255,0.12)" : "#e5e7eb";
  const accent = isDark ? "#6366f1" : "#4f46e5";
  const tabBg = isDark ? "rgba(255,255,255,0.06)" : "#f8fafc";
  const tabBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  const ExamCard = ({
    exam,
    variant,
    onPress,
  }: {
    exam: ExamDto;
    variant: "upcoming" | "today" | "completed";
    onPress: () => void;
  }) => {
    const styles = {
      upcoming: isDark
        ? { border: "rgba(96,165,250,0.5)", iconBg: "rgba(59,130,246,0.25)", text: "#93c5fd" }
        : { border: "#93c5fd", iconBg: "#dbeafe", text: "#1e40af" },
      today: isDark
        ? { border: "rgba(74,222,128,0.5)", iconBg: "rgba(34,197,94,0.25)", text: "#86efac" }
        : { border: "#86efac", iconBg: "#dcfce7", text: "#15803d" },
      completed: isDark
        ? { border: cardBorder, iconBg: "rgba(255,255,255,0.08)", text: theme.text }
        : { border: cardBorder, iconBg: "#f3f4f6", text: theme.text },
    }[variant];
    const Icon = variant === "completed" ? FileText : variant === "today" ? GraduationCap : Calendar;

    let displayPaper: (typeof exam.examSubjects)[0] | null = null;
    if (exam.examSubjects?.length) {
      if (variant === "upcoming") {
        const up = (exam.examSubjects || [])
          .filter((s) => {
            const d = new Date(s.startTime);
            d.setHours(0, 0, 0, 0);
            return d > today;
          })
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        displayPaper = up[0] ?? exam.examSubjects[0];
      } else if (variant === "today") {
        const td = (exam.examSubjects || [])
          .filter((s) => {
            const d = new Date(s.startTime);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === today.getTime();
          })
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        displayPaper = td[0] ?? exam.examSubjects[0];
      } else {
        displayPaper = (exam.examSubjects || []).reduce((a, b) => (new Date(b.endTime) > new Date(a.endTime) ? b : a));
      }
    }

    return (
      <Pressable
        onPress={onPress}
        style={{
          backgroundColor: cardBg,
          borderWidth: 1,
          borderColor: styles.border,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-start" }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: styles.iconBg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={22} color={styles.text} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600" }}>
                {exam.examType?.name ?? "Exam"}
              </Text>
              {displayPaper?.subject?.name && (
                <Text style={{ color: styles.text, fontSize: 14, fontWeight: "500", marginTop: 4 }}>
                  {displayPaper.subject.name}
                </Text>
              )}
              {displayPaper && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Calendar size={14} color={theme.text} style={{ opacity: 0.6 }} />
                    <Text style={{ color: theme.text, fontSize: 12, opacity: 0.8 }}>
                      {formatDate(new Date(displayPaper.startTime))}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Clock size={14} color={theme.text} style={{ opacity: 0.6 }} />
                    <Text style={{ color: theme.text, fontSize: 12, opacity: 0.8 }}>
                      {formatTime(new Date(displayPaper.startTime))}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: styles.iconBg,
              }}
            >
              <Text style={{ color: styles.text, fontSize: 12, fontWeight: "500" }}>{exam.class?.name ?? ""}</Text>
            </View>
            <Pressable
              onPress={onPress}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: styles.iconBg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Eye size={18} color={styles.text} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Tabs - same style as adm-registration */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ maxHeight: 44, flexGrow: 0, flexShrink: 0 }}
          contentContainerStyle={{
            flexDirection: "row",
            paddingHorizontal: 12,
            // paddingBottom: 8,
            gap: 6,
            marginBottom: 16,
          }}
        >
          {(
            [
              { key: "upcoming" as const, label: "Upcoming", icon: Calendar, count: upcomingExams.length },
              { key: "today" as const, label: "Today", icon: Clock, count: todayExams.length },
              { key: "completed" as const, label: "Completed", icon: History, count: completedExams.length },
            ] as const
          ).map(({ key, label, icon: Icon, count }) => {
            const isActive = activeTab === key;
            return (
              <Pressable
                key={key}
                onPress={() => setActiveTab(key)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 8,
                  paddingVertical: 6,
                  borderRadius: 6,
                  backgroundColor: isActive ? accent : tabBg,
                  borderWidth: 1,
                  borderColor: isActive ? accent : tabBorder,
                }}
              >
                <Icon size={14} color={isActive ? "#fff" : theme.text} />
                <Text
                  style={{
                    color: isActive ? "#fff" : theme.text,
                    fontSize: 11,
                    fontWeight: "500",
                    marginLeft: 3,
                  }}
                >
                  {label} ({count})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Content */}
        {loading ? (
          <View style={{ alignItems: "center", paddingVertical: 48 }}>
            <ActivityIndicator size="large" color={accent} />
            <Text style={{ color: theme.text, marginTop: 12 }}>Loading exams...</Text>
          </View>
        ) : error ? (
          <View style={{ alignItems: "center", paddingVertical: 48 }}>
            <FileText size={48} color="#ef4444" />
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600", marginTop: 12 }}>
              Error Loading Exams
            </Text>
            <Text style={{ color: theme.text, opacity: 0.7, marginTop: 4 }}>{error}</Text>
          </View>
        ) : exams.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 48 }}>
            <FileText size={48} color={theme.text} style={{ opacity: 0.4 }} />
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600", marginTop: 12 }}>No Exams Found</Text>
            <Text style={{ color: theme.text, opacity: 0.7, marginTop: 4, textAlign: "center" }}>
              We couldn&apos;t find any exams for your account.
            </Text>
          </View>
        ) : (
          <>
            {activeTab === "today" && todayExams.length > 0 && (
              <View
                style={{
                  backgroundColor: isDark ? "rgba(34,197,94,0.15)" : "#dcfce7",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(34,197,94,0.3)" : "#bbf7d0",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Clock size={20} color="#15803d" />
                  <View>
                    <Text style={{ color: theme.text, fontSize: 13, fontWeight: "600" }}>Total Exam Time Today</Text>
                    <Text style={{ color: "#15803d", fontSize: 18, fontWeight: "700" }}>
                      {formatMinutesToHoursMinutes(totalTodayMinutes)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {activeTab === "upcoming" && (
              <View style={{ marginBottom: 8 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: isDark ? "rgba(59,130,246,0.15)" : "#dbeafe",
                    padding: 12,
                    borderRadius: 10,
                    marginBottom: 16,
                  }}
                >
                  <Clock size={18} color="#1e40af" />
                  <Text style={{ color: theme.text, fontSize: 13 }}>
                    Please arrive 15 minutes prior to the start time of all exams.
                  </Text>
                </View>
                {upcomingExams.length === 0 ? (
                  <View style={{ alignItems: "center", paddingVertical: 32 }}>
                    <Calendar size={40} color={theme.text} style={{ opacity: 0.4 }} />
                    <Text style={{ color: theme.text, fontWeight: "600", marginTop: 12 }}>No Upcoming Exams</Text>
                  </View>
                ) : (
                  upcomingExams.map((exam) => (
                    <ExamCard
                      key={exam.id}
                      exam={exam}
                      variant="upcoming"
                      onPress={() => router.push(`/console/exams/${exam.id}` as any)}
                    />
                  ))
                )}
              </View>
            )}

            {activeTab === "today" && (
              <View style={{ marginBottom: 8 }}>
                {todayExams.length === 0 ? (
                  <View style={{ alignItems: "center", paddingVertical: 32 }}>
                    <Clock size={40} color={theme.text} style={{ opacity: 0.4 }} />
                    <Text style={{ color: theme.text, fontWeight: "600", marginTop: 12 }}>No Exams Today</Text>
                  </View>
                ) : (
                  todayExams.map((exam) => (
                    <ExamCard
                      key={exam.id}
                      exam={exam}
                      variant="today"
                      onPress={() => router.push(`/console/exams/${exam.id}` as any)}
                    />
                  ))
                )}
              </View>
            )}

            {activeTab === "completed" && (
              <View style={{ marginBottom: 8 }}>
                {completedExams.length === 0 ? (
                  <View style={{ alignItems: "center", paddingVertical: 32 }}>
                    <History size={40} color={theme.text} style={{ opacity: 0.4 }} />
                    <Text style={{ color: theme.text, fontWeight: "600", marginTop: 12 }}>No Completed Exams</Text>
                  </View>
                ) : (
                  completedExams.map((exam) => (
                    <ExamCard
                      key={exam.id}
                      exam={exam}
                      variant="completed"
                      onPress={() => router.push(`/console/exams/${exam.id}` as any)}
                    />
                  ))
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
